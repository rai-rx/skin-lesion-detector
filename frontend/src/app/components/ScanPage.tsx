import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, ArrowLeft, X, Loader2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Header } from './Header';
import { useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl } from '../../services/apiUrl';
import { supabase } from '../../services/supabaseClient';
import { useEffect } from 'react';

// Interface matching the pixel data payload needed by the backend
interface CroppedPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createCroppedImage(imageSrc: string, crop: CroppedPixels): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Unable to prepare the selected lesion region.'));
        return;
      }

      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    image.onerror = () => reject(new Error('Unable to lock the selected lesion region.'));
    image.src = imageSrc;
  });
}

export function ScanPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auth & Lesion Selection
  const location = useLocation();
  const { user, session } = useAuth();
  const isDashboardScan = location.pathname === '/dashboard/scan';
  const [lesions, setLesions] = useState<any[]>([]);
  const [selectedLesionId, setSelectedLesionId] = useState<string>(location.state?.lesion_id || '');
  const [scanTitle, setScanTitle] = useState('');
  const [newLesionNickname, setNewLesionNickname] = useState('');
  const [newLesionLocation, setNewLesionLocation] = useState('');

  useEffect(() => {
    const loadLesionOptions = async () => {
      if (!user || !session?.access_token) return;

      try {
        const response = await fetch(`${getApiUrl()}/me/lesions`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) throw new Error('Unable to load lesion profiles');
        const data = await response.json();
        setLesions((data || []).map((lesion: any) => ({ id: lesion.id, nickname: lesion.nickname })));
      } catch (error) {
        console.error('Unable to load lesion profiles:', error);
        setLesions([]);
      }
    };

    void loadLesionOptions();
  }, [user, session?.access_token]);

  // Cropper specific states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedPixels | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setRawFile(file); // Store binary payload for backend submission
      setValidationError(null); // Clear previous errors
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleTakePhoto = async () => {
    const devices = await navigator.mediaDevices?.enumerateDevices().catch(() => []);
    const hasCamera = devices?.some(device => device.kind === 'videoinput');

    if (!hasCamera) {
      window.alert('No camera was detected on this device. Please choose an image file instead.');
      fileInputRef.current?.click();
      return;
    }

    cameraInputRef.current?.click();
  };

  useEffect(() => {
    if (location.state?.openCamera) {
      void handleTakePhoto();
    }
  }, [location.state?.openCamera]);

  const onCropComplete = (_croppedArea: any, pixels: CroppedPixels) => {
    setCroppedAreaPixels(pixels);
  };

  const ensureProfileForScan = async () => {
    if (!user || selectedLesionId) return selectedLesionId;

    const nickname = (newLesionNickname || `Quick Scan ${new Date().toLocaleDateString()}`).trim();
    const bodyLocation = (newLesionLocation || 'Unspecified').trim();

    try {
      const response = await fetch(`${getApiUrl()}/me/lesions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname || `Quick Scan ${new Date().toLocaleDateString()}`,
          body_location: bodyLocation || 'Unspecified',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to create lesion profile');

      setSelectedLesionId(data.id);
      setLesions(prev => [{ id: data.id, nickname: data.nickname }, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Unable to create lesion profile for scan:', error);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!rawFile) return;

    setIsProcessing(true);
    setValidationError(null);

    let activeLesionId = selectedLesionId;
    if (user && !activeLesionId) {
      activeLesionId = await ensureProfileForScan();
    }

    // Build standard Form Data matching the backend signature
    const formData = new FormData();
    formData.append('file', rawFile);
    if (croppedAreaPixels) {
      formData.append('crop_x', croppedAreaPixels.x.toString());
      formData.append('crop_y', croppedAreaPixels.y.toString());
      formData.append('crop_width', croppedAreaPixels.width.toString());
      formData.append('crop_height', croppedAreaPixels.height.toString());
    }

    if (activeLesionId) {
      formData.append('lesion_id', activeLesionId);
    } else if (user) {
      const quickName = newLesionNickname || `Quick Scan ${new Date().toLocaleDateString()}`;
      formData.append('new_lesion_nickname', quickName);
      formData.append('new_lesion_location', newLesionLocation || 'Unspecified');
    }

    if (scanTitle) {
      formData.append('scan_note', scanTitle);
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (user && !currentSession?.access_token) {
        throw new Error('Your login session has expired. Please sign in again before scanning.');
      }
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true'
      };
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      }

      // Direct API call configuration to handle explicit HTTP status errors cleanly
      const apiUrl = `${getApiUrl()}/predict?ngrok-skip-browser-warning=true`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Analysis service returned an invalid response (${response.status}).`);
      }

      if (!response.ok) {
        // Intercept validation failures (e.g., Image Too Blurry, Too Dark)
        if (response.status === 400) {
          setValidationError(data.detail || 'Image quality validation failed.');
          setIsProcessing(false);
          return;
        }
        throw new Error(data.detail || 'Server processing error');
      }

      const resultImage = croppedAreaPixels && selectedImage
        ? await createCroppedImage(selectedImage, croppedAreaPixels)
        : selectedImage;

      // Success route: preserve the selected region in the analytical report.
      navigate('/results', { state: { image: resultImage, result: data } });
    } catch (error: any) {
      console.error('[ScanPage] Analysis pipeline failure:', error);
      setValidationError(error.message || 'Unable to connect to the analysis service. Please verify that the backend server is running and accessible.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setRawFile(null);
    setCroppedAreaPixels(null);
    setValidationError(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#24332d]">
      {!isDashboardScan && <Header />}

      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_0%,rgba(89,137,94,0.18),transparent_30rem)]">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
            className="absolute right-10 top-20 h-64 w-64 rounded-full bg-[#c9dcc4]/40 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute bottom-20 left-10 h-80 w-80 rounded-full bg-[#dce4d4]/50 blur-3xl"
          />
        </div>

        {/* Dynamic Header */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(isDashboardScan ? '/dashboard' : '/')}
            className="mb-10 flex items-center gap-2 text-sm text-[#607268] transition-colors hover:text-[#2f604e]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{isDashboardScan ? 'Back to Dashboard' : 'Back to Home'}</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 grid gap-8 border-b border-[#d7d2c7] pb-10 text-left lg:grid-cols-[1fr_20rem] lg:items-end"
          >
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#2f604e]">01 / Capture a new observation</p>
              <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-[#24332d] md:text-7xl">Analyze<br /><span className="text-[#2f604e]">skin lesion.</span></h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#607268]">Bring a clear image into focus, mark the region that matters, and keep the result attached to its timeline.</p>
            </div>
            
            {user && (
              <div className="space-y-4 border-l-2 border-[#d8a36c] pl-5 lg:mb-1">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 text-left">
                    Save scan to profile
                  </label>
                  <select
                    value={selectedLesionId}
                    onChange={(e) => setSelectedLesionId(e.target.value)}
                    className="w-full border-b border-[#b9c7a9] bg-transparent px-0 py-3 text-[#24332d] outline-none focus:border-[#2f604e] focus:ring-0"
                  >
                    <option value="">Create a new profile automatically</option>
                    {lesions.map(l => (
                      <option key={l.id} value={l.id}>{l.nickname}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Scan title / note
                  </label>
                  <input
                    value={scanTitle}
                    onChange={(e) => setScanTitle(e.target.value)}
                    placeholder="Optional scan title or note"
                    className="w-full border-b border-[#b9c7a9] bg-transparent px-0 py-3 text-[#24332d] outline-none focus:border-[#2f604e] focus:ring-0"
                  />
                </div>

                {!selectedLesionId && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Create a lesion profile from this scan:</p>
                    <input
                      value={newLesionNickname}
                      onChange={(e) => setNewLesionNickname(e.target.value)}
                      placeholder="Lesion nickname (e.g. Left Shoulder Spot)"
                      className="w-full border-b border-[#b9c7a9] bg-transparent px-0 py-3 text-[#24332d] outline-none focus:border-[#2f604e] focus:ring-0"
                    />
                    <input
                      value={newLesionLocation}
                      onChange={(e) => setNewLesionLocation(e.target.value)}
                      placeholder="Body location (optional)"
                      className="w-full border-b border-[#b9c7a9] bg-transparent px-0 py-3 text-[#24332d] outline-none focus:border-[#2f604e] focus:ring-0"
                    />
                  </div>
                )}
              </div>
            )}
            {!user && (
              <div className="mt-6 inline-flex items-center gap-2 border-l-2 border-[#d8a36c] px-4 py-2 text-sm font-medium text-[#806348]">
                <AlertTriangle className="w-4 h-4" /> Sign in to save scans to your timeline
              </div>
            )}
          </motion.div>
        </div>

        {/* Main Content View Container */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-12">
          <AnimatePresence mode="wait">
            {!selectedImage ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* File Dropzone Input Box */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed p-12 text-center transition-all duration-300 md:p-20
                    bg-[#e3ebdf]/45
                    ${dragActive
                      ? 'scale-[1.02] border-[#2f604e] bg-[#dce4d4]'
                      : 'border-[#9fb39e] hover:border-[#2f604e] hover:bg-[#e3ebdf]'
                    }
                  `}
                >
                  <div className="max-w-md mx-auto">
                    <div className="mb-8 flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c9dcc4] text-[#2f604e]">
                        <ImageIcon className="h-9 w-9" />
                      </div>
                    </div>

                    <h3 className="mb-4 font-display text-3xl font-bold text-[#24332d]">
                      {dragActive ? 'Drop image here' : 'Upload or capture an image'}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-3 bg-[#2f604e] px-8 py-4 text-[#f4f0e8] shadow-md transition-all hover:bg-[#244c3e]"
                      >
                        <Upload className="w-5 h-5" />
                        Choose File
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => void handleTakePhoto()}
                        className="flex items-center justify-center gap-3 bg-[#806348] px-8 py-4 text-[#f4f0e8] shadow-md transition-all hover:bg-[#684f3b]"
                      >
                        <Camera className="w-5 h-5" />
                        Take Photo
                      </motion.button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Patient Optimization Guideline Module */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 border-l-2 border-[#2f604e] bg-[#e3ebdf] px-6 py-5"
                >
                  <h4 className="text-lg font-medium mb-3">For best diagnostic accuracy:</h4>
                  <ul className="space-y-2 text-sm text-[#607268]">
                    <li>• Use steady, clear lighting environments and avoid dark casting shadows</li>
                    <li>• Ensure the lesion target is cleanly in focus and fills the cropping viewport</li>
                    <li>• Position the lens directly overhead (straight-on flat angle)</li>
                  </ul>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Advanced Bounding Preview and Crop Interface */}
                <div className="border-y border-[#d7d2c7] py-6 md:py-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-3xl font-bold text-[#24332d]">Position skin lesion</h3>
                      <p className="mt-1 text-sm text-[#607268]">Drag and pinch to isolate the lesion within the box.</p>
                    </div>
                    <button
                      onClick={handleClear}
                      disabled={isProcessing}
                        className="p-2 text-[#607268] transition-colors hover:bg-[#e3ebdf] hover:text-[#2f604e] disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quality Exception Banner Display */}
                  {validationError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 flex items-start gap-3 border-l-2 border-[#b34e3d] bg-[#f3dfd8] p-4 text-[#8d3f34]"
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-semibold">Quality Scan Rejected: </span>
                        {validationError}
                      </div>
                    </motion.div>
                  )}

                  {/* Interactive Viewport Wrapper Container */}
                  <div className="relative mb-6 h-[380px] w-full overflow-hidden border border-[#9fb39e] bg-[#dce4d4] md:h-[450px]">
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1} // Forces a perfect square ratio matching backend models
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      zoomWithScroll={!isProcessing}
                      onWheelRequest={() => !isProcessing}
                      onTouchRequest={() => !isProcessing}
                      showGrid={true}
                      cropShape="rect"
                    />
                    {isProcessing && (
                      <div
                        className="absolute inset-0 z-10 cursor-wait"
                        aria-label="Analysis in progress"
                      />
                    )}
                  </div>

                  {/* Manual Zoom Tuning Control Bar */}
                  <div className="mb-8 flex items-center gap-4 border-b border-[#d7d2c7] bg-[#e3ebdf]/55 p-4">
                    <span className="select-none text-sm font-medium text-[#607268]">Zoom scale</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.05}
                      aria-label="Zoom scale adjust"
                      disabled={isProcessing}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#b9c7a9] accent-[#2f604e] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                    onClick={handleAnalyze}
                    disabled={isProcessing}
                    className="flex w-full items-center justify-center gap-3 bg-[#2f604e] py-5 text-lg font-medium text-[#f4f0e8] shadow-lg transition-all hover:bg-[#244c3e] hover:shadow-xl disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Running Neural Analysis...</span>
                      </>
                    ) : (
                      <span>Analyze Selected Region</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
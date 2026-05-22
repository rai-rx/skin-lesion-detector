import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, ArrowLeft, X, Loader2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Header } from './Header';

// Interface matching the pixel data payload needed by the backend
interface CroppedPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ScanPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const onCropComplete = (_croppedArea: any, pixels: CroppedPixels) => {
    setCroppedAreaPixels(pixels);
  };

  const handleAnalyze = async () => {
    if (!rawFile || !croppedAreaPixels) return;

    setIsProcessing(true);
    setValidationError(null);

    // Build standard Form Data matching the backend signature
    const formData = new FormData();
    formData.append('file', rawFile);
    formData.append('crop_x', croppedAreaPixels.x.toString());
    formData.append('crop_y', croppedAreaPixels.y.toString());
    formData.append('crop_width', croppedAreaPixels.width.toString());
    formData.append('crop_height', croppedAreaPixels.height.toString());

    try {
      // Direct API call configuration to handle explicit HTTP status errors cleanly
      const response = await fetch(`${import.meta.env.VITE_API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Intercept validation failures (e.g., Image Too Blurry, Too Dark)
        if (response.status === 400) {
          setValidationError(data.detail || 'Image quality validation failed.');
          setIsProcessing(false);
          return;
        }
        throw new Error(data.detail || 'Server processing error');
      }

      // Success route: Navigate to analytical report screen
      navigate('/results', { state: { image: selectedImage, result: data } });
    } catch (error: any) {
      console.error('[ScanPage] Analysis pipeline failure:', error);
      navigate('/results', {
        state: {
          image: selectedImage,
          error: error.message || 'Unable to connect to the analysis service.',
        },
      });
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
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
            className="absolute top-20 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute bottom-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          />
        </div>

        {/* Dynamic Header */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">Analyze Skin Lesion</h1>
          </motion.div>
        </div>

        {/* Main Content View Container */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 pb-12">
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
                    relative border-2 border-dashed rounded-3xl p-12 md:p-20 text-center
                    transition-all duration-300 bg-card/50 backdrop-blur-sm
                    ${dragActive
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-card/80'
                    }
                  `}
                >
                  <div className="max-w-md mx-auto">
                    <div className="mb-8 flex justify-center">
                      <div className="w-16 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-primary" />
                      </div>
                    </div>

                    <h3 className="text-2xl mb-4 font-medium">
                      {dragActive ? 'Drop image here' : 'Upload or capture an image'}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-4 bg-primary text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
                      >
                        <Upload className="w-5 h-5" />
                        Choose File
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-8 py-4 bg-secondary text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
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
                  className="mt-8 bg-accent/10 rounded-2xl p-6 border border-accent/20"
                >
                  <h4 className="text-lg font-medium mb-3">For best diagnostic accuracy:</h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
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
                <div className="bg-card rounded-3xl shadow-xl p-6 md:p-8 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-medium">Position Skin Lesion</h3>
                      <p className="text-sm text-muted-foreground mt-1">Drag and pinch to isolate the lesion within the box.</p>
                    </div>
                    <button
                      onClick={handleClear}
                      disabled={isProcessing}
                      className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quality Exception Banner Display */}
                  {validationError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive"
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-semibold">Quality Scan Rejected: </span>
                        {validationError}
                      </div>
                    </motion.div>
                  )}

                  {/* Interactive Viewport Wrapper Container */}
                  <div className="relative w-full h-[380px] md:h-[450px] mb-6 rounded-2xl overflow-hidden bg-muted border border-border">
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1} // Forces a perfect square ratio matching backend models
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      showGrid={true}
                      cropShape="rect"
                    />
                  </div>

                  {/* Manual Zoom Tuning Control Bar */}
                  <div className="flex items-center gap-4 mb-8 bg-muted/40 p-4 rounded-xl border border-border/50">
                    <span className="text-sm font-medium text-muted-foreground select-none">Zoom Scale</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.05}
                      aria-label="Zoom scale adjust"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                    onClick={handleAnalyze}
                    disabled={isProcessing}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-lg font-medium"
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
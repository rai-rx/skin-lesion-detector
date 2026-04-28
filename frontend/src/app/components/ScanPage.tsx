import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, ArrowLeft, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Header } from './Header';
import { analyzeSkinLesion } from '@/services/modelService';

export function ScanPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const result = await analyzeSkinLesion(selectedImage);
      navigate('/results', { state: { image: selectedImage, result } });
    } catch (error) {
      console.error('[ScanPage] analyzeSkinLesion failed', error);
      navigate('/results', {
        state: {
          image: selectedImage,
          error: 'Unable to analyze image with backend service.',
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
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

      {/* Header */}
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
          <h1 className="text-5xl md:text-6xl">Analyze Skin Lesion</h1>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {!selectedImage ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Upload Area */}
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

                  <h3 className="text-2xl mb-4">
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

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-accent/10 rounded-2xl p-6 border border-accent/20"
              >
                <h4 className="text-lg mb-3">For best results:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Use good lighting and avoid shadows</li>
                  <li>• Ensure the lesion is in focus and fills most of the frame</li>
                  <li>• Take the photo straight-on, not at an angle</li>
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
              {/* Image Preview */}
              <div className="bg-card rounded-3xl shadow-xl p-8 border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl">Image Preview</h3>
                  <button
                    onClick={handleClear}
                    disabled={isProcessing}
                    className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative mb-8 rounded-2xl overflow-hidden bg-muted">
                  <img
                    src={selectedImage}
                    alt="Selected skin lesion"
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Analyze Image'
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

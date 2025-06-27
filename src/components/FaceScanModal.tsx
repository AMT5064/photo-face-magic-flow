
import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FaceScanModalProps {
  open: boolean;
  onClose: () => void;
  onScanComplete: (imageData: string) => void;
}

const FaceScanModal = ({ open, onClose, onScanComplete }: FaceScanModalProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setFaceCaptured(true);
      setIsScanning(true);
      
      // Simulate processing delay
      setTimeout(() => {
        stopCamera();
        onScanComplete(imageData);
        setIsScanning(false);
        setFaceCaptured(false);
      }, 1500);
    }
  }, [stopCamera, onScanComplete]);

  const handleClose = () => {
    stopCamera();
    setFaceCaptured(false);
    setIsScanning(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-center">
            Face Recognition Scan
          </DialogTitle>
          {!faceCaptured && (
            <p className="text-center text-gray-600 mt-2">
              Position your face in the circle and hold still
            </p>
          )}
        </DialogHeader>

        <div className="relative bg-black flex-1 min-h-[400px] flex items-center justify-center">
          {!stream && !faceCaptured && (
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <Button onClick={startCamera} className="bg-purple-600 hover:bg-purple-700">
                Start Camera
              </Button>
            </div>
          )}

          {stream && !faceCaptured && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Face alignment guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border-4 border-white rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute inset-0 w-64 h-64 border-4 border-purple-400 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Capture button */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 rounded-full w-16 h-16 p-0"
                >
                  <Camera className="w-8 h-8" />
                </Button>
              </div>
            </>
          )}

          {faceCaptured && (
            <div className="text-center text-white">
              {isScanning ? (
                <>
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Processing your scan...</h3>
                  <p className="opacity-80">This may take a moment</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 rotate-45 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Face captured successfully!</h3>
                </>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {stream && !isScanning && (
          <div className="p-6 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                stopCamera();
                setTimeout(startCamera, 100);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FaceScanModal;

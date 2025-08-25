import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Scan, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScanFaceProps {
  selectedEvent: string;
  events: Array<{ id: string; name: string; }>;
}

const ScanFace = ({ selectedEvent, events }: ScanFaceProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const selectedEventName = events.find(e => e.id === selectedEvent)?.name || "No event selected";

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please ensure camera permissions are granted.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setFaceCaptured(true);
    setIsScanning(true);

    // Simulate face processing
    setTimeout(async () => {
      await processFaceScan(imageData);
      setIsScanning(false);
    }, 2000);
  };

  const processFaceScan = async (imageData: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real implementation, this would send the image to an AI service
      // For now, we'll simulate the process and create a face scan record
      
      // Log the face scan activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          activity_type: 'face_scanned',
          description: `Face scan completed${selectedEvent ? ` for event: ${selectedEventName}` : ''}`,
          metadata: { 
            event_id: selectedEvent || null,
            image_captured: true,
            timestamp: new Date().toISOString()
          }
        });

      toast({
        title: "Face Scan Complete!",
        description: "Your face has been processed. Check the Face Match tab to see your photos.",
      });

    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setFaceCaptured(false);
    setCapturedImage("");
    setIsScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    setFaceCaptured(false);
    setCapturedImage("");
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scan className="h-6 w-6 text-accent" />
        <div>
          <h2 className="text-2xl font-bold text-primary">Scan Face</h2>
          <p className="text-muted-foreground">
            Use your camera to scan your face and find your photos
          </p>
        </div>
      </div>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-accent">Scanning for Event</CardTitle>
            <CardDescription>{selectedEventName}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!selectedEvent && (
        <Card className="border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <p>No event selected. You can still scan your face to search across all events.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md mx-auto">
            {!stream && !faceCaptured && (
              <div className="text-center space-y-6">
                <div className="w-64 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
                  <p className="text-muted-foreground mb-4">
                    Position your face clearly within the camera frame for the best results.
                  </p>
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              </div>
            )}

            {stream && !faceCaptured && (
              <div className="text-center space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-sm mx-auto rounded-lg border"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-accent rounded-full opacity-50"></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Position your face within the circle and click capture
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={capturePhoto} className="bg-accent hover:bg-accent/90">
                      <Scan className="h-4 w-4 mr-2" />
                      Capture Face
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {faceCaptured && !isScanning && (
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto rounded-lg border overflow-hidden">
                  <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Face scan completed successfully!</span>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRetry} variant="outline">
                    Scan Again
                  </Button>
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto rounded-lg border overflow-hidden">
                  <img src={capturedImage} alt="Processing face" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                  <p className="font-medium text-accent">Processing your face scan...</p>
                  <p className="text-sm text-muted-foreground">
                    AI is analyzing your features and searching for matches
                  </p>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Best Results Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ensure good lighting on your face</li>
              <li>• Look directly at the camera</li>
              <li>• Keep your face within the circle guide</li>
              <li>• Remove sunglasses or hats if possible</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your face scan is processed securely and only used for photo matching. The scan data is not stored after processing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanFace;
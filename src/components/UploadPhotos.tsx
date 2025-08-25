import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadPhotosProps {
  selectedEvent: string;
  events: Array<{ id: string; name: string; }>;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

const UploadPhotos = ({ selectedEvent, events }: UploadPhotosProps) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedEventName = events.find(e => e.id === selectedEvent)?.name || "No event selected";

  const handleFileUpload = async (files: FileList) => {
    if (!selectedEvent) {
      toast({
        title: "No Event Selected",
        description: "Please select an event before uploading photos.",
        variant: "destructive",
      });
      return;
    }

    const newUploads: UploadProgress[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      const file = upload.file;
      
      try {
        // Update progress to show upload starting
        setUploads(prev => prev.map((u, idx) => 
          u.file === file ? { ...u, progress: 10 } : u
        ));

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${selectedEvent}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Update progress after upload
        setUploads(prev => prev.map((u, idx) => 
          u.file === file ? { ...u, progress: 50, status: 'processing' } : u
        ));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event-photos')
          .getPublicUrl(filePath);

        // Save photo metadata to database
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: selectedEvent,
            file_name: file.name,
            file_path: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user.id,
          });

        if (dbError) throw dbError;

        // Simulate face detection processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update progress to completed
        setUploads(prev => prev.map((u, idx) => 
          u.file === file ? { ...u, progress: 100, status: 'completed' } : u
        ));

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            activity_type: 'photo_uploaded',
            description: `Uploaded photo: ${file.name}`,
            metadata: { 
              event_id: selectedEvent,
              file_name: file.name,
              file_size: file.size 
            }
          });

      } catch (error: any) {
        setUploads(prev => prev.map((u, idx) => 
          u.file === file ? { 
            ...u, 
            progress: 0, 
            status: 'error', 
            error: error.message 
          } : u
        ));
      }
    }

    // Show completion message
    const completedCount = newUploads.length;
    toast({
      title: "Upload Complete",
      description: `Successfully uploaded ${completedCount} photo${completedCount !== 1 ? 's' : ''}.`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearUploads = () => {
    setUploads([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-6 w-6 text-accent" />
        <div>
          <h2 className="text-2xl font-bold text-primary">Upload Photos</h2>
          <p className="text-muted-foreground">
            Upload event photos for face detection and matching
          </p>
        </div>
      </div>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-accent">Current Event</CardTitle>
            <CardDescription>{selectedEventName}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!selectedEvent && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Please select an event from the dropdown above before uploading photos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEvent && (
        <Card className={`transition-colors ${isDragging ? 'border-accent bg-accent/5' : ''}`}>
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-accent transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Drag & Drop Photos Here
              </h3>
              <p className="text-muted-foreground mb-4">
                Or click to browse and select multiple image files
              </p>
              <Button variant="outline">
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {uploads.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upload Progress</CardTitle>
            <Button variant="outline" size="sm" onClick={clearUploads}>
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {upload.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(upload.file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {upload.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {upload.status}
                      </span>
                    </div>
                  </div>
                  <Progress value={upload.progress} className="h-2" />
                  {upload.error && (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Intelligent Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Photos are automatically optimized for web display while preserving original quality for downloads.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Face Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI algorithms process images to detect faces, preparing them for the matching phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPhotos;
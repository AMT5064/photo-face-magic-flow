
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Camera, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (files: File[]) => void;
}

const UploadModal = ({ open, onClose, onUploadComplete }: UploadModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      onUploadComplete(selectedFiles);
      setUploading(false);
      setSelectedFiles([]);
      toast({
        title: "Upload complete!",
        description: `${selectedFiles.length} photo(s) uploaded successfully.`,
      });
    }, 2000);
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upload Photos
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Add your event photos for AI face detection and tagging
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-purple-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Drop your photos here
                </h3>
                <p className="text-gray-600 mt-1">
                  or click to browse your files
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="pointer-events-none">
                  <Camera className="w-4 h-4 mr-2" />
                  From Camera
                </Button>
                <Button variant="outline" className="pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" />
                  From Files
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                Selected Photos ({selectedFiles.length})
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;

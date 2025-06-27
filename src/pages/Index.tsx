
import { useState } from 'react';
import { Camera, Upload, Settings, Search, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import FaceScanModal from '@/components/FaceScanModal';
import UploadModal from '@/components/UploadModal';
import PrivacySettings from '@/components/PrivacySettings';
import PhotoGallery from '@/components/PhotoGallery';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  url: string;
  timestamp: string;
  confidence: number;
  tags: string[];
}

const Index = () => {
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Mock photo data
  const mockPhotos: Photo[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=400&fit=crop',
      timestamp: '2024-01-15 14:30',
      confidence: 0.95,
      tags: ['main-stage', 'keynote']
    },
    {
      id: '2', 
      url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
      timestamp: '2024-01-15 16:45',
      confidence: 0.87,
      tags: ['networking', 'lobby']
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=400&fit=crop',
      timestamp: '2024-01-15 18:20',
      confidence: 0.92,
      tags: ['dinner', 'awards']
    }
  ];

  const handleFaceScanComplete = (imageData: string) => {
    setIsProcessing(true);
    setShowFaceScan(false);
    
    // Simulate AI processing
    setTimeout(() => {
      setMatchedPhotos(mockPhotos);
      setIsProcessing(false);
      setShowResults(true);
      toast({
        title: "Face scan complete!",
        description: `We found ${mockPhotos.length} photos of you at the event.`,
      });
    }, 3000);
  };

  const handleUploadComplete = (files: File[]) => {
    setShowUpload(false);
    toast({
      title: "Upload successful!",
      description: `${files.length} photo(s) uploaded and processed.`,
    });
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-24 h-24 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Scanning Your Photos...</h2>
          <p className="text-lg opacity-90">Our AI is finding all the moments you were captured</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Event Photos</h1>
              <p className="text-gray-600 mt-2">We found {matchedPhotos.length} photos of you!</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowResults(false)}
              className="hover:scale-105 transition-transform"
            >
              Back to Gallery
            </Button>
          </div>
          <PhotoGallery photos={matchedPhotos} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Find Your Event Photos
            <span className="block text-4xl md:text-5xl bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              in Seconds!
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Our AI-powered face recognition technology instantly finds all the photos you're in. 
            Just scan your face and discover your memories.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setShowFaceScan(true)}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Camera className="mr-2 h-6 w-6" />
              Scan My Face
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 rounded-full transition-all duration-300"
            >
              <Search className="mr-2 h-6 w-6" />
              Browse All Photos
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-6 w-6" />
                Smart Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Advanced AI instantly identifies you in thousands of event photos with high accuracy.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-6 w-6" />
                Easy Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Upload your own photos and let AI automatically tag faces for easy discovery.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-6 w-6" />
                Privacy First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Full control over your photos with privacy settings and the ability to opt-out anytime.</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowUpload(true)}
            className="border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPrivacy(true)}
            className="border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300"
          >
            <Settings className="mr-2 h-4 w-4" />
            Privacy Settings
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-white">
              <div className="text-3xl font-bold">10,000+</div>
              <div className="text-white/80">Photos Processed</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold">95%</div>
              <div className="text-white/80">Accuracy Rate</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold">2s</div>
              <div className="text-white/80">Average Scan Time</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-white/80">Privacy Protected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FaceScanModal
        open={showFaceScan}
        onClose={() => setShowFaceScan(false)}
        onScanComplete={handleFaceScanComplete}
      />
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={handleUploadComplete}
      />
      <PrivacySettings
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </div>
  );
};

export default Index;

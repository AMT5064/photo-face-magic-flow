import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Download, RefreshCw, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FaceMatchProps {
  selectedEvent: string;
  events: Array<{ id: string; name: string; }>;
}

interface Photo {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  confidence_score?: number;
}

const FaceMatch = ({ selectedEvent, events }: FaceMatchProps) => {
  const [matchedPhotos, setMatchedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const { toast } = useToast();

  const selectedEventName = events.find(e => e.id === selectedEvent)?.name || "All Events";

  useEffect(() => {
    checkForPreviousScans();
  }, [selectedEvent]);

  const checkForPreviousScans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any face scan activities
      const { data: scans } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', 'face_scanned')
        .order('created_at', { ascending: false })
        .limit(1);

      if (scans && scans.length > 0) {
        setHasScanned(true);
        await loadMatches();
      }
    } catch (error: any) {
      console.error('Error checking scans:', error);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use secure function to get face matches with audit logging
      const { data: faceMatches, error: matchError } = await supabase
        .rpc('get_user_face_matches', { 
          target_user_id: user.id 
        });

      if (matchError) throw matchError;

      if (!faceMatches || faceMatches.length === 0) {
        setMatchedPhotos([]);
        return;
      }

      // Get photo details for matched photos
      const photoIds = faceMatches.map(match => match.photo_id);
      let photoQuery = supabase
        .from('photos')
        .select('*')
        .in('id', photoIds);

      // Filter by event if one is selected
      if (selectedEvent) {
        photoQuery = photoQuery.eq('event_id', selectedEvent);
      }

      const { data: photos, error: photoError } = await photoQuery
        .order('created_at', { ascending: false });

      if (photoError) throw photoError;

      // Combine photo data with confidence scores from face matches
      const matchedPhotosWithScores = photos?.map(photo => {
        const match = faceMatches.find(m => m.photo_id === photo.id);
        return {
          ...photo,
          confidence_score: match?.confidence_score ? Math.round(Number(match.confidence_score)) : undefined
        };
      }) || [];

      setMatchedPhotos(matchedPhotosWithScores);

      if (matchedPhotosWithScores.length > 0) {
        toast({
          title: "Matches Found!",
          description: `Found ${matchedPhotosWithScores.length} photo${matchedPhotosWithScores.length !== 1 ? 's' : ''} containing your face.`,
        });
      } else {
        toast({
          title: "No Matches",
          description: "No photos found with matching faces. Try scanning again or check a different event.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.file_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${photo.file_name}`,
      });
    } catch (error: any) {
      toast({
        title: "Download Error",
        description: "Failed to download the photo.",
        variant: "destructive",
      });
    }
  };

  const refreshMatches = () => {
    loadMatches();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Camera className="h-6 w-6 text-accent" />
        <div>
          <h2 className="text-2xl font-bold text-primary">Face Match Results</h2>
          <p className="text-muted-foreground">
            Photos containing your face from {selectedEventName}
          </p>
        </div>
      </div>

      {!hasScanned && (
        <Card className="border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No Face Scan Found</h3>
                <p className="text-muted-foreground">
                  Please complete a face scan first using the "Scan Face" tab to see your matching photos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasScanned && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing results for: <strong>{selectedEventName}</strong>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={refreshMatches} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="text-muted-foreground">Searching for your photos...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasScanned && matchedPhotos.length > 0 && !loading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Found {matchedPhotos.length} Matching Photo{matchedPhotos.length !== 1 ? 's' : ''}
              </CardTitle>
              <CardDescription>
                Click on any photo to download the high-resolution version
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matchedPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative group cursor-pointer">
                  <img
                    src={photo.file_path}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(photo)}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  {photo.confidence_score && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 bg-black/70 text-white"
                    >
                      {photo.confidence_score}% match
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{photo.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(photo.file_size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {hasScanned && matchedPhotos.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No Matches Found</h3>
                <p className="text-muted-foreground">
                  No photos were found containing your face in {selectedEventName}.
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" onClick={refreshMatches}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Download Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All downloads are high-resolution original images, perfect for printing and sharing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Confidence Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Match percentages indicate the AI's confidence level in face recognition accuracy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CheckCircle = Camera; // Using Camera as a placeholder since CheckCircle might not be imported

export default FaceMatch;
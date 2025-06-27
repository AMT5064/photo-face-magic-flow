
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share2, Eye, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  url: string;
  timestamp: string;
  confidence: number;
  tags: string[];
}

interface PhotoGalleryProps {
  photos: Photo[];
}

const PhotoGallery = ({ photos }: PhotoGalleryProps) => {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  const filteredPhotos = photos.filter(photo => {
    if (filter === 'all') return true;
    return photo.tags.includes(filter);
  });

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleDownload = (photo: Photo) => {
    toast({
      title: "Download started",
      description: `Downloading photo from ${photo.timestamp}`,
    });
  };

  const handleShare = (photo: Photo) => {
    toast({
      title: "Share link copied",
      description: "Link to photo copied to clipboard",
    });
  };

  const handleBulkDownload = () => {
    toast({
      title: "Bulk download started",
      description: `Downloading ${selectedPhotos.size} selected photos`,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const uniqueTags = Array.from(new Set(photos.flatMap(photo => photo.tags)));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photos</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          >
            <Eye className="w-4 h-4 mr-2" />
            {view === 'grid' ? 'List View' : 'Grid View'}
          </Button>
        </div>

        {selectedPhotos.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedPhotos.size} selected
            </span>
            <Button onClick={handleBulkDownload} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Selected
            </Button>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      <div className={view === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-4"
      }>
        {filteredPhotos.map((photo) => (
          <Card 
            key={photo.id} 
            className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
              selectedPhotos.has(photo.id) ? 'ring-2 ring-purple-500' : ''
            }`}
            onClick={() => togglePhotoSelection(photo.id)}
          >
            <CardContent className="p-0">
              {view === 'grid' ? (
                <>
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`Photo from ${photo.timestamp}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getConfidenceColor(photo.confidence)} text-xs`}
                      >
                        {Math.round(photo.confidence * 100)}% match
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="flex gap-1">
                        {photo.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs bg-black/50 text-white border-white/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(photo.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(photo.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(photo);
                          }}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={photo.url}
                      alt={`Photo from ${photo.timestamp}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(photo.timestamp).toLocaleString()}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {photo.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${getConfidenceColor(photo.confidence)} text-xs mt-2`}
                        >
                          {Math.round(photo.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(photo);
                          }}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo);
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? "No photos match your search criteria"
              : `No photos found for "${filter}"`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;


import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, EyeOff, Trash2, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettingsProps {
  open: boolean;
  onClose: () => void;
}

const PrivacySettings = ({ open, onClose }: PrivacySettingsProps) => {
  const [settings, setSettings] = useState({
    publicPhotos: true,
    faceDetection: true,
    dataRetention: false,
    emailNotifications: true,
  });
  const { toast } = useToast();

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteData = () => {
    toast({
      title: "Data deletion requested",
      description: "Your face data will be removed within 24 hours.",
    });
  };

  const handleReportPhoto = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for reporting. We'll review this promptly.",
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your privacy preferences have been updated.",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold">
            <Shield className="w-6 h-6 mr-2 text-purple-600" />
            Privacy Settings
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Control how your photos and data are used
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Visibility */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Photo Visibility</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="public-photos" className="text-sm font-medium">
                  Make my photos discoverable
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Allow others to find photos you're tagged in
                </p>
              </div>
              <Switch
                id="public-photos"
                checked={settings.publicPhotos}
                onCheckedChange={(checked) => handleSettingChange('publicPhotos', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="face-detection" className="text-sm font-medium">
                  Enable face detection
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Allow AI to detect and tag your face in photos
                </p>
              </div>
              <Switch
                id="face-detection"
                checked={settings.faceDetection}
                onCheckedChange={(checked) => handleSettingChange('faceDetection', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Data Management</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="data-retention" className="text-sm font-medium">
                  Extended data retention
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Keep your face data for improved accuracy
                </p>
              </div>
              <Switch
                id="data-retention"
                checked={settings.dataRetention}
                onCheckedChange={(checked) => handleSettingChange('dataRetention', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="email-notifications" className="text-sm font-medium">
                  Email notifications
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Get notified when new photos are found
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Actions</h3>
            
            <Button
              variant="outline"
              onClick={handleDeleteData}
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete all my face data
            </Button>

            <Button
              variant="outline"
              onClick={handleReportPhoto}
              className="w-full justify-start"
            >
              <Flag className="w-4 h-4 mr-2" />
              Report inappropriate photo
            </Button>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="bg-purple-600 hover:bg-purple-700">
              Save Settings
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
            <strong>Privacy Notice:</strong> Your face data is encrypted and processed locally when possible. 
            We never share your biometric data with third parties and you can delete it at any time.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacySettings;

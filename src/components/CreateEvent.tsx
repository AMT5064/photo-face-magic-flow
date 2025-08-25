import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateEventProps {
  onEventCreated: () => void;
}

const CreateEvent = ({ onEventCreated }: CreateEventProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hybrid'>('public');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('events')
        .insert({
          name,
          description,
          start_date: startDate,
          end_date: endDate || null,
          visibility,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Event created successfully.",
      });

      // Reset form
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setVisibility('public');
      
      // Refresh events list
      onEventCreated();

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          activity_type: 'event_created',
          description: `Created event: ${name}`,
          metadata: { event_name: name, visibility }
        });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-accent" />
        <div>
          <h2 className="text-2xl font-bold text-primary">Create Campaign / Event</h2>
          <p className="text-muted-foreground">Set up a new event to organize your photo collection</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Event Details
          </CardTitle>
          <CardDescription>
            Provide essential information about your event. This will serve as a container for all photo uploads and face matching activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name *</Label>
              <Input
                id="event-name"
                type="text"
                placeholder="e.g., Annual Tech Summit 2025, Spring Gala Dinner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                placeholder="Brief overview of the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility Settings</Label>
              <Select value={visibility} onValueChange={(value: 'public' | 'private' | 'hybrid') => setVisibility(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can access</SelectItem>
                  <SelectItem value="private">Private - Invite only</SelectItem>
                  <SelectItem value="hybrid">Hybrid - Mixed access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                {loading ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              After creating your event, you can upload photos and enable face scanning for attendees.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Privacy Control</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose visibility settings to control who can access your event photos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-accent">Face Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered face detection will automatically process uploaded photos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
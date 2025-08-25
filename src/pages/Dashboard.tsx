import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, LogOut, Plus, Upload, Scan, Users, Activity, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import tab components
import CreateEvent from "@/components/CreateEvent";
import UploadPhotos from "@/components/UploadPhotos";
import ScanFace from "@/components/ScanFace";
import FaceMatch from "@/components/FaceMatch";
import UserManagement from "@/components/UserManagement";
import ActivityLogs from "@/components/ActivityLogs";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  visibility: 'public' | 'private' | 'hybrid';
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
          await fetchEvents();
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          await fetchProfile(session.user.id);
          await fetchEvents();
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      
      // Auto-select first event if available
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to auth
  }

  const isAdmin = profile.role === 'admin';
  const isAdminOrEditor = profile.role === 'admin' || profile.role === 'editor';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-8 w-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold text-primary">AI FaceSync</h1>
                <p className="text-sm text-muted-foreground">Event Photo Discovery Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-foreground">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Event Selector */}
          {events.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Current Event:</label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="create-event" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {isAdminOrEditor && (
              <TabsTrigger value="create-event" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Event</span>
              </TabsTrigger>
            )}
            {isAdminOrEditor && (
              <TabsTrigger value="upload-photos" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload Photos</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="scan-face" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Scan Face</span>
            </TabsTrigger>
            <TabsTrigger value="face-match" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Face Match</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="user-management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}
            {isAdminOrEditor && (
              <TabsTrigger value="activity-logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            )}
          </TabsList>

          {isAdminOrEditor && (
            <TabsContent value="create-event">
              <CreateEvent onEventCreated={fetchEvents} />
            </TabsContent>
          )}

          {isAdminOrEditor && (
            <TabsContent value="upload-photos">
              <UploadPhotos selectedEvent={selectedEvent} events={events} />
            </TabsContent>
          )}

          <TabsContent value="scan-face">
            <ScanFace selectedEvent={selectedEvent} events={events} />
          </TabsContent>

          <TabsContent value="face-match">
            <FaceMatch selectedEvent={selectedEvent} events={events} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="user-management">
              <UserManagement />
            </TabsContent>
          )}

          {isAdminOrEditor && (
            <TabsContent value="activity-logs">
              <ActivityLogs />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
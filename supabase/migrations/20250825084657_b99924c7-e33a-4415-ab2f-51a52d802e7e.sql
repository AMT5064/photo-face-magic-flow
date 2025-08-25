-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'editor', 'viewer');

-- Create enum for event visibility
CREATE TYPE public.event_visibility AS ENUM ('public', 'private', 'hybrid');

-- Create enum for activity types
CREATE TYPE public.activity_type AS ENUM ('login', 'logout', 'event_created', 'event_updated', 'photo_uploaded', 'face_scanned', 'user_role_changed', 'user_created', 'user_deleted');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  visibility event_visibility DEFAULT 'public',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create photos table
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  faces_detected INTEGER DEFAULT 0,
  face_data JSONB,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create face_matches table
CREATE TABLE public.face_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  confidence_score DECIMAL(5,2),
  face_scan_data JSONB,
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on face_matches
ALTER TABLE public.face_matches ENABLE ROW LEVEL SECURITY;

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to check if user has admin or editor role
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for events
CREATE POLICY "Everyone can view public events" ON public.events
  FOR SELECT USING (visibility = 'public' OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins and editors can create events" ON public.events
  FOR INSERT WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and event creators can update events" ON public.events
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for photos
CREATE POLICY "Users can view photos of accessible events" ON public.photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = photos.event_id 
      AND (events.visibility = 'public' OR auth.uid() IS NOT NULL)
    )
  );

CREATE POLICY "Admins and editors can upload photos" ON public.photos
  FOR INSERT WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and photo uploaders can update photos" ON public.photos
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    uploaded_by = auth.uid()
  );

CREATE POLICY "Admins can delete photos" ON public.photos
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for face_matches
CREATE POLICY "Users can view their own face matches" ON public.face_matches
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own face matches" ON public.face_matches
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all face matches" ON public.face_matches
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for activity_logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can view activity logs" ON public.activity_logs
  FOR SELECT USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    'viewer'::user_role
  );
  
  -- Log the user creation
  INSERT INTO public.activity_logs (user_id, activity_type, description)
  VALUES (NEW.id, 'user_created', 'New user registered');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

-- Storage policies for event photos
CREATE POLICY "Anyone can view event photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');

CREATE POLICY "Admins and editors can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-photos' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins and editors can update event photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-photos' AND 
    public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admins can delete event photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-photos' AND 
    public.has_role(auth.uid(), 'admin')
  );
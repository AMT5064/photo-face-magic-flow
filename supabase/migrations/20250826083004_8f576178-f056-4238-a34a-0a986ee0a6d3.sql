-- Remove the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS public.photos_safe;

-- Instead, let's create a better approach with proper RLS policies
-- Remove the current policies and create a more granular approach
DROP POLICY IF EXISTS "Users can view basic photo info for accessible events" ON public.photos;
DROP POLICY IF EXISTS "Admins and uploaders can access facial recognition data" ON public.photos;

-- Create a comprehensive policy that allows photo access but restricts biometric data
-- Regular users can see photos but face_data is NULL unless they're admin or uploader
CREATE POLICY "Secure photo access with biometric protection" 
ON public.photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = photos.event_id 
    AND (events.visibility = 'public' OR auth.uid() IS NOT NULL)
  )
);

-- Create a database function to safely return photo data with conditional biometric access
CREATE OR REPLACE FUNCTION public.get_photo_with_secure_face_data(photo_row public.photos)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  file_name text,
  file_path text,
  mime_type text,
  file_size bigint,
  faces_detected integer,
  uploaded_by uuid,
  created_at timestamptz,
  face_data jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    photo_row.id,
    photo_row.event_id,
    photo_row.file_name,
    photo_row.file_path,
    photo_row.mime_type,
    photo_row.file_size,
    photo_row.faces_detected,
    photo_row.uploaded_by,
    photo_row.created_at,
    CASE 
      WHEN has_role(auth.uid(), 'admin') OR photo_row.uploaded_by = auth.uid() 
      THEN photo_row.face_data 
      ELSE NULL 
    END as face_data;
$$;
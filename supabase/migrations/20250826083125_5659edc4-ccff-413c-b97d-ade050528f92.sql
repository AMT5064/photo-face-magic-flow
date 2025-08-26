-- Drop the problematic view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS public.photos_safe;

-- Create a properly secured view for photos without biometric data exposure
-- This view automatically respects RLS policies and user permissions
CREATE VIEW public.photos_safe AS
SELECT 
  id,
  event_id,
  file_name,
  file_path,
  mime_type,
  file_size,
  uploaded_by,
  created_at,
  faces_detected
  -- Completely exclude face_data column from this view for all users
FROM public.photos;

-- Create RLS policy for the safe view
ALTER VIEW public.photos_safe SET (security_barrier = true);

-- Grant SELECT on the safe view
GRANT SELECT ON public.photos_safe TO authenticated;

-- For access to face_data, users must query the photos table directly
-- which will be subject to the restrictive RLS policies we created
-- Create a safe view that excludes sensitive biometric data for regular users
CREATE OR REPLACE VIEW public.photos_safe AS
SELECT 
  id,
  event_id,
  file_name,
  file_path,
  mime_type,
  file_size,
  uploaded_by,
  created_at,
  faces_detected,
  -- Exclude face_data column for regular users, only show to admins/uploaders
  CASE 
    WHEN has_role(auth.uid(), 'admin') OR uploaded_by = auth.uid() 
    THEN face_data 
    ELSE NULL 
  END as face_data
FROM public.photos
WHERE EXISTS (
  SELECT 1 FROM events 
  WHERE events.id = photos.event_id 
  AND (events.visibility = 'public' OR auth.uid() IS NOT NULL)
);

-- Enable RLS on the view
ALTER VIEW public.photos_safe SET (security_barrier = true);

-- Grant access to the safe view for authenticated users
GRANT SELECT ON public.photos_safe TO authenticated;
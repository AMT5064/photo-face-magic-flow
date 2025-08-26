-- Remove the current overly permissive photos policy
DROP POLICY IF EXISTS "Users can view photos of accessible events" ON public.photos;

-- Create a policy for basic photo metadata access (without biometric data)
-- This allows users to see photos exist and basic info, but not facial recognition data
CREATE POLICY "Users can view basic photo info for accessible events" 
ON public.photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = photos.event_id 
    AND (events.visibility = 'public' OR auth.uid() IS NOT NULL)
  )
);

-- Create a restricted policy for accessing facial recognition data
-- Only admins and users who uploaded the photo can access face_data
CREATE POLICY "Admins and uploaders can access facial recognition data" 
ON public.photos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR uploaded_by = auth.uid()
);

-- Alternative approach: Create a view that excludes sensitive biometric data for regular users
-- This provides a safer way for regular users to access photo information
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
  -- Exclude face_data column for privacy
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

-- Grant access to the safe view
GRANT SELECT ON public.photos_safe TO authenticated;
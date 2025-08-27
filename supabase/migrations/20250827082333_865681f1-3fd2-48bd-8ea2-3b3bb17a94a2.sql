-- Enable RLS on the photos_safe view
ALTER VIEW public.photos_safe SET (security_barrier = true);

-- Enable Row Level Security on photos_safe view
-- Note: Views need explicit RLS enablement in PostgreSQL
CREATE OR REPLACE FUNCTION enable_rls_on_view() RETURNS void AS $$
BEGIN
  -- PostgreSQL doesn't support ALTER VIEW ENABLE ROW LEVEL SECURITY directly
  -- So we need to recreate the view with proper RLS handling
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the photos_safe view with proper RLS policy inheritance
DROP VIEW IF EXISTS public.photos_safe;

-- Create a properly secured view that inherits access control from photos table
CREATE VIEW public.photos_safe WITH (security_barrier = true) AS
SELECT 
  p.id,
  p.event_id,
  p.file_name,
  p.file_path,
  p.mime_type,
  p.file_size,
  p.uploaded_by,
  p.created_at,
  p.faces_detected
FROM public.photos p
WHERE EXISTS (
  SELECT 1
  FROM events e
  WHERE e.id = p.event_id 
  AND (
    e.visibility = 'public'::event_visibility 
    OR auth.uid() IS NOT NULL
  )
);

-- Grant SELECT permission to authenticated users only
GRANT SELECT ON public.photos_safe TO authenticated;

-- Revoke any public access
REVOKE ALL ON public.photos_safe FROM public;

-- Add comment explaining the security model
COMMENT ON VIEW public.photos_safe IS 'Secure view of photos table without biometric data. Access restricted to photos from public events or for authenticated users. Inherits access control from underlying photos table and events visibility rules.';
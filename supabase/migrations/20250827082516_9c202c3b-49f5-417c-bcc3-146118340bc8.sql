-- Drop the problematic view approach and use a function-based approach instead
DROP VIEW IF EXISTS public.photos_safe;

-- Create a secure function to get safe photo data
CREATE OR REPLACE FUNCTION public.get_safe_photos(event_id_filter uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  file_name text,
  file_path text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamp with time zone,
  faces_detected integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  JOIN public.events e ON e.id = p.event_id
  WHERE 
    -- Check event visibility and user authentication
    (e.visibility = 'public'::event_visibility OR auth.uid() IS NOT NULL)
    -- Optional event filter
    AND (event_id_filter IS NULL OR p.event_id = event_id_filter)
  ORDER BY p.created_at DESC;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_safe_photos(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_safe_photos(uuid) FROM public;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.get_safe_photos(uuid) IS 'Secure function to retrieve photo data without biometric information. Access restricted based on event visibility and user authentication. Use this instead of direct table access to ensure security.';
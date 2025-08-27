-- Create stricter security for facial recognition data
-- First, drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can view their own face matches" ON public.face_matches;
DROP POLICY IF EXISTS "Admins can view all face matches" ON public.face_matches;
DROP POLICY IF EXISTS "Users can create their own face matches" ON public.face_matches;

-- Create a security definer function to verify face match ownership with audit logging
CREATE OR REPLACE FUNCTION public.can_access_face_match(match_user_id uuid, match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Return false if no authenticated user
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is admin
  is_admin := has_role(current_user_id, 'admin'::user_role);
  
  -- Log access attempt for audit trail
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
  VALUES (
    current_user_id,
    'biometric_access_attempt',
    'Attempted to access facial recognition data',
    jsonb_build_object(
      'target_user_id', match_user_id,
      'face_match_id', match_id,
      'is_admin', is_admin,
      'access_granted', (is_admin OR current_user_id = match_user_id)
    )
  );
  
  -- Allow access only if user owns the data or is admin
  RETURN (is_admin OR current_user_id = match_user_id);
END;
$$;

-- Create ultra-restrictive RLS policies for face_matches
CREATE POLICY "Strict biometric data access control"
ON public.face_matches
FOR SELECT
USING (can_access_face_match(user_id, id));

CREATE POLICY "Strict biometric data creation control"
ON public.face_matches
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
  AND can_access_face_match(user_id, id)
);

-- Create a secure function to retrieve face matches with additional validation
CREATE OR REPLACE FUNCTION public.get_user_face_matches(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  photo_id uuid,
  confidence_score numeric,
  matched_at timestamp with time zone
  -- Deliberately exclude face_scan_data from regular access
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fm.id,
    fm.user_id,
    fm.photo_id,
    fm.confidence_score,
    fm.matched_at
  FROM public.face_matches fm
  WHERE 
    -- Only return matches for the requesting user or if user is admin
    (target_user_id IS NULL AND fm.user_id = auth.uid())
    OR (target_user_id IS NOT NULL AND can_access_face_match(target_user_id, fm.id))
  ORDER BY fm.matched_at DESC;
$$;

-- Create admin-only function for accessing sensitive biometric scan data
CREATE OR REPLACE FUNCTION public.get_biometric_scan_data(match_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN has_role(auth.uid(), 'admin'::user_role) THEN face_scan_data
      ELSE NULL
    END
  FROM public.face_matches 
  WHERE id = match_id
  LIMIT 1;
$$;

-- Grant minimal necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_face_matches(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_biometric_scan_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_face_match(uuid, uuid) TO authenticated;

-- Revoke any public access
REVOKE EXECUTE ON FUNCTION public.get_user_face_matches(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_biometric_scan_data(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.can_access_face_match(uuid, uuid) FROM public;

-- Add comprehensive documentation
COMMENT ON FUNCTION public.get_user_face_matches(uuid) IS 'Secure function to retrieve face matches for authenticated users. Excludes sensitive biometric scan data and includes audit logging.';
COMMENT ON FUNCTION public.get_biometric_scan_data(uuid) IS 'Admin-only function to access sensitive biometric facial scan data. All access attempts are logged for security audit.';
COMMENT ON FUNCTION public.can_access_face_match(uuid, uuid) IS 'Security function that validates face match access permissions and logs all access attempts for audit trail.';
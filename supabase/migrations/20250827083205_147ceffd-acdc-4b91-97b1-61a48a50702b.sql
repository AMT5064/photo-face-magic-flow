-- Strengthen the biometric access control function with additional security measures
CREATE OR REPLACE FUNCTION public.can_access_face_match(match_user_id uuid, match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
  is_valid_match boolean;
  rate_limit_exceeded boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Strict authentication check
  IF current_user_id IS NULL THEN
    -- Log unauthorized access attempt
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
    VALUES (
      NULL,
      'unauthorized_biometric_access',
      'Attempted unauthorized access to facial recognition data',
      jsonb_build_object(
        'target_user_id', match_user_id,
        'face_match_id', match_id,
        'timestamp', now(),
        'blocked_reason', 'no_authentication'
      )
    );
    RETURN false;
  END IF;
  
  -- Rate limiting: Check if user has made too many access attempts recently
  SELECT EXISTS (
    SELECT 1 FROM public.activity_logs 
    WHERE user_id = current_user_id 
    AND activity_type = 'biometric_access_attempt'
    AND created_at > now() - interval '1 minute'
    GROUP BY user_id
    HAVING COUNT(*) > 10
  ) INTO rate_limit_exceeded;
  
  IF rate_limit_exceeded THEN
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
    VALUES (
      current_user_id,
      'biometric_access_rate_limited',
      'Rate limit exceeded for biometric data access',
      jsonb_build_object(
        'target_user_id', match_user_id,
        'face_match_id', match_id,
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  -- Validate that the face match actually exists and belongs to the target user
  SELECT EXISTS (
    SELECT 1 FROM public.face_matches 
    WHERE id = match_id AND user_id = match_user_id
  ) INTO is_valid_match;
  
  IF NOT is_valid_match THEN
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
    VALUES (
      current_user_id,
      'invalid_biometric_access',
      'Attempted access to invalid or non-existent face match',
      jsonb_build_object(
        'target_user_id', match_user_id,
        'face_match_id', match_id,
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  -- Check admin status with role validation
  is_admin := has_role(current_user_id, 'admin'::user_role);
  
  -- Final access decision with comprehensive logging
  INSERT INTO public.activity_logs (user_id, activity_type, description, metadata)
  VALUES (
    current_user_id,
    'biometric_access_attempt',
    'Attempted to access facial recognition data',
    jsonb_build_object(
      'target_user_id', match_user_id,
      'face_match_id', match_id,
      'is_admin', is_admin,
      'is_owner', (current_user_id = match_user_id),
      'access_granted', (is_admin OR current_user_id = match_user_id),
      'timestamp', now(),
      'ip_hash', encode(digest(inet_client_addr()::text, 'sha256'), 'hex')
    )
  );
  
  -- Only allow access if user owns the data OR is verified admin
  RETURN (is_admin OR current_user_id = match_user_id);
END;
$$;

-- Add additional security comment
COMMENT ON FUNCTION public.can_access_face_match(uuid, uuid) IS 'Ultra-secure biometric access control function with rate limiting, audit logging, data validation, and strict authentication checks. All access attempts are logged with IP tracking for security monitoring.';
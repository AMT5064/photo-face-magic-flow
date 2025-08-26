-- Fix the function search path security warning
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
SET search_path = public
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
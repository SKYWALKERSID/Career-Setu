-- Phase 3D: private resume storage and evidence-aware score state
ALTER TABLE public.resumes ALTER COLUMN score DROP NOT NULL;
ALTER TABLE public.resumes ALTER COLUMN score DROP DEFAULT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('private-resumes', 'private-resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Students manage own private resumes" ON storage.objects
FOR ALL USING (
  bucket_id = 'private-resumes'
  AND (storage.foldername(name))[1] IN (
    SELECT sp.id::text FROM public.student_profiles sp WHERE sp.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'private-resumes'
  AND (storage.foldername(name))[1] IN (
    SELECT sp.id::text FROM public.student_profiles sp WHERE sp.user_id = auth.uid()
  )
);

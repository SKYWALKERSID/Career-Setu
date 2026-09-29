ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS target_role_id UUID REFERENCES public.career_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_student_target_role ON public.resumes(student_id, target_role_id, version DESC);

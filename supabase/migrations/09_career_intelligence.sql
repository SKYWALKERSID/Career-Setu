-- Persist personalized interpretation without duplicating catalog or profile data.
CREATE TABLE IF NOT EXISTS public.career_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  input_hash TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  insight JSONB NOT NULL,
  ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, role_id, input_hash)
);

CREATE INDEX IF NOT EXISTS idx_career_intelligence_student_role
  ON public.career_intelligence(student_id, role_id, created_at DESC);

ALTER TABLE public.career_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student read own career intelligence" ON public.career_intelligence;
CREATE POLICY "Student read own career intelligence" ON public.career_intelligence FOR SELECT USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));
DROP POLICY IF EXISTS "Student insert own career intelligence" ON public.career_intelligence;
CREATE POLICY "Student insert own career intelligence" ON public.career_intelligence FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));
DROP POLICY IF EXISTS "Student update own career intelligence" ON public.career_intelligence;
CREATE POLICY "Student update own career intelligence" ON public.career_intelligence FOR UPDATE USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

-- MP CareerSetu — Phase 3 Schema Enhancements
-- Migration: 02_phase3_enhancements.sql

-- ============================================================
-- 1. AI Runs Enhancements (traceability, error tracking, cost)
-- ============================================================

-- Attribute AI runs to students (optional — allows admin/system calls)
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.student_profiles(id) ON DELETE SET NULL;

-- Store error messages for failed runs
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Track token usage for cost monitoring
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS tokens_used INT;

-- ============================================================
-- 2. Traceability: Link AI-generated records back to their AI run
-- ============================================================

ALTER TABLE public.readiness_assessments ADD COLUMN IF NOT EXISTS ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL;
ALTER TABLE public.career_recommendations ADD COLUMN IF NOT EXISTS ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Indexes for efficient querying
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_runs_student_id ON public.ai_runs(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_feature ON public.ai_runs(feature);
CREATE INDEX IF NOT EXISTS idx_readiness_assessments_student_id ON public.readiness_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_career_recommendations_student_id ON public.career_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_student_id ON public.roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON public.interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_resumes_student_id ON public.resumes(student_id);

-- ============================================================
-- 4. RLS for ai_runs (students can read own, admins can read all)
-- ============================================================

CREATE POLICY "Student read own ai_runs" ON public.ai_runs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Insert ai_runs from server" ON public.ai_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read all ai_runs" ON public.ai_runs FOR SELECT USING (public.is_admin());

-- ============================================================
-- 5. Nullable component scores for readiness_assessments (NULL = pending/no evidence)
-- ============================================================

ALTER TABLE public.readiness_assessments ALTER COLUMN technical_score DROP NOT NULL;
ALTER TABLE public.readiness_assessments ALTER COLUMN academic_score DROP NOT NULL;
ALTER TABLE public.readiness_assessments ALTER COLUMN project_score DROP NOT NULL;
ALTER TABLE public.readiness_assessments ALTER COLUMN resume_score DROP NOT NULL;
ALTER TABLE public.readiness_assessments ALTER COLUMN interview_score DROP NOT NULL;
ALTER TABLE public.readiness_assessments ALTER COLUMN alignment_score DROP NOT NULL;


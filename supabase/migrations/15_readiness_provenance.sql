-- Distinguish user-triggered assessment records from automatic readiness snapshots.
ALTER TABLE public.readiness_assessments
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'legacy_unknown';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'readiness_assessments_source_check'
      AND conrelid = 'public.readiness_assessments'::regclass
  ) THEN
    ALTER TABLE public.readiness_assessments
      ADD CONSTRAINT readiness_assessments_source_check
      CHECK (source IN ('explicit_assessment', 'profile_update', 'resume_update', 'interview_completion', 'manual_recalculation', 'legacy_unknown'));
  END IF;
END $$;

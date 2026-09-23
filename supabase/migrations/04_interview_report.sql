-- Preserve the validated structured final report without replacing interview history.
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS report_json JSONB;

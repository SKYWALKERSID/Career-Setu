ALTER TABLE public.roadmap_tasks
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS evidence_note TEXT,
  ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMPTZ;

ALTER TABLE public.roadmap_tasks
  ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL;

ALTER TABLE public.roadmap_tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_skill_id ON public.roadmap_tasks(skill_id);

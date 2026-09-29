ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS primary_provider TEXT;
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS primary_model TEXT;
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS fallback_provider TEXT;
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS fallback_model TEXT;
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS error_category TEXT;
ALTER TABLE public.ai_runs ADD COLUMN IF NOT EXISTS fallback_reason TEXT;

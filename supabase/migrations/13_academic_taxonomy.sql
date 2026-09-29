-- Additive academic taxonomy identifiers. Legacy course/branch text remains for compatibility.
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS degree_id TEXT,
  ADD COLUMN IF NOT EXISTS branch_id TEXT,
  ADD COLUMN IF NOT EXISTS specialization_id TEXT,
  ADD COLUMN IF NOT EXISTS degree_other TEXT,
  ADD COLUMN IF NOT EXISTS branch_other TEXT,
  ADD COLUMN IF NOT EXISTS specialization_other TEXT;

COMMENT ON COLUMN public.student_profiles.degree_id IS 'Stable application taxonomy ID; source metadata is maintained in src/lib/academic/taxonomy.ts.';
COMMENT ON COLUMN public.student_profiles.branch_id IS 'Stable application taxonomy ID; technical nomenclature is based on AICTE APH 2024-2027 where applicable.';
COMMENT ON COLUMN public.student_profiles.specialization_id IS 'Stable application taxonomy ID; not a claim of an exhaustive national list.';

-- Complete the existing AI/ML Specialist catalog role without changing its ID.
WITH mappings(skill_name, importance) AS (
  VALUES
    ('Python', 'high'),
    ('Machine Learning Basics', 'high'),
    ('Pandas & NumPy', 'high'),
    ('Statistics & Probability', 'medium'),
    ('Deep Learning & PyTorch', 'medium'),
    ('SQL', 'medium'),
    ('Data Structures & Algorithms', 'medium')
)
INSERT INTO public.career_role_skills (role_id, skill_id, required, importance)
SELECT roles.id, skills.id, true, mappings.importance
FROM mappings
JOIN public.career_roles AS roles ON roles.title = 'AI/ML Specialist'
JOIN public.skills AS skills ON skills.name = mappings.skill_name
ON CONFLICT (role_id, skill_id) DO UPDATE
SET required = EXCLUDED.required, importance = EXCLUDED.importance;

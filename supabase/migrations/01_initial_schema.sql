-- MP CareerSetu — Initial Database Schema Migration
-- Database: Supabase PostgreSQL

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Application-level user role identity)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  college TEXT,
  course TEXT,
  branch TEXT,
  semester INT CHECK (semester BETWEEN 1 AND 10),
  cgpa NUMERIC(4,2) CHECK (cgpa BETWEEN 0.0 AND 10.0),
  location TEXT,
  interests TEXT[] DEFAULT '{}',
  target_careers TEXT[] DEFAULT '{}',
  readiness_score INT DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Skills Catalog Table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Student Skills Junction Table
CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency TEXT NOT NULL DEFAULT 'beginner' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
  evidence TEXT,
  evidence_type TEXT NOT NULL DEFAULT 'self_declared' CHECK (evidence_type IN ('self_declared', 'project', 'certification', 'assessment', 'resume')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, skill_id)
);

-- 5. Readiness Assessments Table (Score dimension breakdown history)
CREATE TABLE IF NOT EXISTS public.readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  technical_score INT NOT NULL CHECK (technical_score BETWEEN 0 AND 100),
  academic_score INT NOT NULL CHECK (academic_score BETWEEN 0 AND 100),
  project_score INT NOT NULL CHECK (project_score BETWEEN 0 AND 100),
  resume_score INT NOT NULL CHECK (resume_score BETWEEN 0 AND 100),
  interview_score INT NOT NULL CHECK (interview_score BETWEEN 0 AND 100),
  alignment_score INT NOT NULL CHECK (alignment_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Career Roles Catalog Table
CREATE TABLE IF NOT EXISTS public.career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  salary_range TEXT,
  growth_outlook TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Career Role Skills Junction Table (Normalized requirement mapping)
CREATE TABLE IF NOT EXISTS public.career_role_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT true,
  importance TEXT NOT NULL DEFAULT 'high' CHECK (importance IN ('high', 'medium', 'low')),
  UNIQUE (role_id, skill_id)
);

-- 8. Career Recommendations Cache Table
CREATE TABLE IF NOT EXISTS public.career_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  rationale TEXT NOT NULL,
  missing_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  target_role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  duration_days INT NOT NULL DEFAULT 90,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Roadmap Tasks Table
CREATE TABLE IF NOT EXISTS public.roadmap_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  week INT NOT NULL CHECK (week BETWEEN 1 AND 16),
  task_type TEXT NOT NULL CHECK (task_type IN ('learning', 'project', 'interview_prep')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  evidence_required TEXT
);

-- 11. Courses Catalog Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner',
  duration_hours INT,
  url TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Course Skills Junction Table
CREATE TABLE IF NOT EXISTS public.course_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE (course_id, skill_id)
);

-- 13. Opportunities Table (Jobs, Internships, Govt Exams, Apprenticeships)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job', 'internship', 'govt_exam', 'apprentice')),
  location TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  application_deadline DATE,
  employment_type TEXT DEFAULT 'full_time',
  organization_type TEXT DEFAULT 'private',
  education_requirements TEXT,
  experience_required TEXT,
  status TEXT DEFAULT 'active',
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Opportunity Skills Junction Table
CREATE TABLE IF NOT EXISTS public.opportunity_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  UNIQUE (opportunity_id, skill_id)
);

-- 15. Opportunity Matches Table
CREATE TABLE IF NOT EXISTS public.opportunity_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  hard_filter_status BOOLEAN NOT NULL DEFAULT true,
  semantic_score INT NOT NULL CHECK (semantic_score BETWEEN 0 AND 100),
  match_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, opportunity_id)
);

-- 16. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  parsed_json JSONB,
  score INT DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Mock Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  session_status TEXT NOT NULL DEFAULT 'pending' CHECK (session_status IN ('pending', 'active', 'completed')),
  overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
  feedback_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Mock Interview Turns Table
CREATE TABLE IF NOT EXISTS public.interview_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  rubric_score INT CHECK (rubric_score BETWEEN 0 AND 100),
  feedback TEXT
);

-- 19. AI Runs Audit Telemetry Table
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  latency_ms INT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_career_role_skills_role_id ON public.career_role_skills(role_id);
CREATE INDEX IF NOT EXISTS idx_course_skills_course_id ON public.course_skills(course_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_opportunity_id ON public.opportunity_skills(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_student_id ON public.opportunity_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_tasks_roadmap_id ON public.roadmap_tasks(roadmap_id);

-- AUTOMATIC TRIGGER FOR PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (new.id, 'student')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- Catalog Policies (Public Read, Admin Write)
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read career_roles" ON public.career_roles FOR SELECT USING (true);
CREATE POLICY "Public read career_role_skills" ON public.career_role_skills FOR SELECT USING (true);
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public read course_skills" ON public.course_skills FOR SELECT USING (true);
CREATE POLICY "Public read opportunities" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Public read opportunity_skills" ON public.opportunity_skills FOR SELECT USING (true);

-- User Profile Policies
CREATE POLICY "User select own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Student select own student_profile" ON public.student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Student insert own student_profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Student update own student_profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Student Dependent Table Policies (Verified via student_profiles.user_id = auth.uid())
CREATE POLICY "Student manage own student_skills" ON public.student_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own readiness_assessments" ON public.readiness_assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own career_recommendations" ON public.career_recommendations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own roadmaps" ON public.roadmaps FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own roadmap_tasks" ON public.roadmap_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.roadmaps r
    JOIN public.student_profiles sp ON r.student_id = sp.id
    WHERE r.id = roadmap_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Student manage own opportunity_matches" ON public.opportunity_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own resumes" ON public.resumes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own interviews" ON public.interviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.student_profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Student manage own interview_turns" ON public.interview_turns FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.interviews i
    JOIN public.student_profiles sp ON i.student_id = sp.id
    WHERE i.id = interview_id AND sp.user_id = auth.uid()
  )
);

-- Admin Global Access Policy Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admin select all student_profiles" ON public.student_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin select all readiness_assessments" ON public.readiness_assessments FOR SELECT USING (public.is_admin());

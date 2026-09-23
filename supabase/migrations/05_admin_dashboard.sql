-- Admin Dashboard: allow verified admins to read only the persisted records
-- required for aggregate reporting. No write access or student content access is added.
DROP POLICY IF EXISTS "Admin read all ai_runs" ON public.ai_runs;
CREATE POLICY "Admin read all ai_runs" ON public.ai_runs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin read all profiles" ON public.profiles;
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all student_skills" ON public.student_skills;
CREATE POLICY "Admin read all student_skills" ON public.student_skills FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all career_recommendations" ON public.career_recommendations;
CREATE POLICY "Admin read all career_recommendations" ON public.career_recommendations FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all roadmaps" ON public.roadmaps;
CREATE POLICY "Admin read all roadmaps" ON public.roadmaps FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all roadmap_tasks" ON public.roadmap_tasks;
CREATE POLICY "Admin read all roadmap_tasks" ON public.roadmap_tasks FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all resumes metadata" ON public.resumes;
CREATE POLICY "Admin read all resumes metadata" ON public.resumes FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all interviews metadata" ON public.interviews;
CREATE POLICY "Admin read all interviews metadata" ON public.interviews FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admin read all opportunity_matches" ON public.opportunity_matches;
CREATE POLICY "Admin read all opportunity_matches" ON public.opportunity_matches FOR SELECT USING (public.is_admin());

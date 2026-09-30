'use server';

import { createClient } from '@/lib/supabase/server';
import { getStudentProfile } from '@/lib/profile/actions';
import { calculateProfileCompletion } from '@/lib/profile/validation';

import { StudentProfile, StudentSkill, ReadinessAssessment, CareerRecommendation, Roadmap, RoadmapTask, Course, Opportunity } from '@/types';
import { resolveRoadmapTaskCourseTitles } from '@/lib/roadmap/course-display';

export interface DashboardData {
  studentProfile: StudentProfile | null;
  targetCareer: { id: string; title: string } | null;
  targetCareers: Array<{ id: string; title: string }>;
  studentSkills: StudentSkill[];
  completionScore: number;
  readinessAssessment: ReadinessAssessment | null;
  careerRecommendations: CareerRecommendation[];
  roadmap: Roadmap | null;
  roadmapTasks: RoadmapTask[];
  savedRoadmaps: Array<{ id: string; target_role_id: string; duration_days: number; generated_at: string; career_roles?: { title?: string } | null; task_count: number; completed_tasks: number }>;
  previewCourses: Course[];
  previewOpportunities: Opportunity[];
}

export async function getDashboardData(requestedRoleId?: string, requestedRoadmapId?: string): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized session' };
  }

  // 1. Fetch Profile & Skills via existing profile action helper
  const profileRes = await getStudentProfile();
  if (!profileRes.success || !profileRes.studentProfile) {
    return {
      success: true,
      data: {
        studentProfile: null,
        targetCareer: null,
        targetCareers: [],
        studentSkills: [],
        completionScore: 0,
        readinessAssessment: null,
        careerRecommendations: [],
        roadmap: null,
        roadmapTasks: [],
        savedRoadmaps: [],
        previewCourses: [],
        previewOpportunities: [],
      },
    };
  }

  const sp = profileRes.studentProfile;
  const skills = profileRes.studentSkills || [];

  const { data: targetCareers } = sp.target_careers?.length
    ? await supabase.from('career_roles').select('id, title').in('id', sp.target_careers)
    : { data: [] };
  const validTargets = (targetCareers || []) as Array<{ id: string; title: string }>;
  const activeRoleId = requestedRoleId ? (validTargets.some((role) => role.id === requestedRoleId) ? requestedRoleId : null) : validTargets[0]?.id || null;
  const { data: targetCareer } = activeRoleId
    ? await supabase.from('career_roles').select('id, title').eq('id', activeRoleId).maybeSingle()
    : { data: null };
  const { data: activeRoleSkills } = activeRoleId
    ? await supabase.from('career_role_skills').select('skill_id').eq('role_id', activeRoleId)
    : { data: [] };
  const activeRoleSkillIds = Array.from(new Set((activeRoleSkills || []).map((item) => item.skill_id)));

  const completionScore = calculateProfileCompletion({
    name: sp.name,
    location: sp.location,
    college: sp.college,
    course: sp.course,
    branch: sp.branch,
    semester: sp.semester,
    cgpa: sp.cgpa,
    skillsCount: skills.length,
    targetCareersCount: sp.target_careers?.length || 0,
    interestsCount: sp.interests?.length || 0,
  });

  // 2. Query Readiness Assessment (latest)
  const { data: readinessAssessment } = await supabase
    .from('readiness_assessments')
    .select('*')
    .eq('student_id', sp.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 3. Query AI Career Recommendations (if generated)
  const { data: careerRecommendations } = await supabase
    .from('career_recommendations')
    .select('*, career_roles(id, title, category, description)')
    .eq('student_id', sp.id)
    .order('score', { ascending: false })
    .limit(3);

  // 4. Query Roadmap & Tasks (if generated)
  let roadmapQuery = supabase
    .from('roadmaps')
    .select('*, career_roles(title)')
    .eq('student_id', sp.id);
  if (requestedRoadmapId) roadmapQuery = roadmapQuery.eq('id', requestedRoadmapId);
  else if (activeRoleId) roadmapQuery = roadmapQuery.eq('target_role_id', activeRoleId);
  else if (requestedRoleId) roadmapQuery = roadmapQuery.eq('target_role_id', requestedRoleId);
  const { data: roadmap } = await roadmapQuery.order('generated_at', { ascending: false }).limit(1).maybeSingle();

  const { data: savedRoadmapRows } = await supabase.from('roadmaps').select('id, target_role_id, duration_days, generated_at, career_roles(title), roadmap_tasks(status)').eq('student_id', sp.id).order('generated_at', { ascending: false });
  const savedRoadmaps = (savedRoadmapRows || []).map((item) => {
    const tasks = (item.roadmap_tasks || []) as Array<{ status: string }>;
    return { id: item.id, target_role_id: item.target_role_id, duration_days: item.duration_days, generated_at: item.generated_at, career_roles: Array.isArray(item.career_roles) ? item.career_roles[0] : item.career_roles, task_count: tasks.length, completed_tasks: tasks.filter((task) => task.status === 'completed').length };
  });

  let roadmapTasks: RoadmapTask[] = [];
  if (roadmap) {
    const { data: tasks } = await supabase
      .from('roadmap_tasks')
      .select('*')
      .eq('roadmap_id', roadmap.id)
      .order('week', { ascending: true })
      .limit(100);
    roadmapTasks = (tasks || []) as RoadmapTask[];
    const courseIds = Array.from(new Set(roadmapTasks.flatMap((task) => task.description.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi) || [])));
    if (courseIds.length) {
      const { data: roadmapCourses } = await supabase.from('courses').select('id, title').in('id', courseIds);
      roadmapTasks = resolveRoadmapTaskCourseTitles(roadmapTasks, roadmapCourses || []);
    }
  }

  // 5. Query catalog previews through the active role's canonical skill mappings.
  let previewCourses: Course[] = [];
  let previewOpportunities: Opportunity[] = [];
  if (activeRoleSkillIds.length) {
    const [{ data: courseSkillRows }, { data: opportunitySkillRows }] = await Promise.all([
      supabase.from('course_skills').select('course_id, courses(id, title, provider, level, is_free, price, url)').in('skill_id', activeRoleSkillIds),
      supabase.from('opportunity_skills').select('opportunity_id, opportunities(id, title, organization, type, location, application_deadline, is_verified, status)').in('skill_id', activeRoleSkillIds),
    ]);
    const courseMap = new Map<string, unknown>();
    for (const row of courseSkillRows || []) {
      const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      if (course) courseMap.set((course as { id: string }).id, course);
    }
    previewCourses = Array.from(courseMap.values()).slice(0, 3) as Course[];
    const opportunityMap = new Map<string, unknown>();
    for (const row of opportunitySkillRows || []) {
      const opportunity = Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities;
      if (opportunity && (opportunity as { status?: string; is_verified?: boolean }).status === 'active' && (opportunity as { is_verified?: boolean }).is_verified === true) {
        opportunityMap.set((opportunity as { id: string }).id, opportunity);
      }
    }
    previewOpportunities = Array.from(opportunityMap.values()).slice(0, 3) as Opportunity[];
  }

  return {
    success: true,
    data: {
      studentProfile: sp,
      targetCareer: targetCareer || null,
      targetCareers: validTargets,
      studentSkills: skills as unknown as StudentSkill[],
      completionScore,
      readinessAssessment: readinessAssessment || null,
      careerRecommendations: (careerRecommendations || []).map((recommendation) => ({
        ...recommendation,
        role: recommendation.career_roles,
      })) as unknown as CareerRecommendation[],
      roadmap: roadmap || null,
      roadmapTasks,
      savedRoadmaps,
      previewCourses: previewCourses || [],
      previewOpportunities: (previewOpportunities || []) as unknown as Opportunity[],
    },
  };
}

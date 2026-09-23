'use server';

import { createClient } from '@/lib/supabase/server';
import { getStudentProfile } from '@/lib/profile/actions';
import { calculateProfileCompletion } from '@/lib/profile/validation';

import { StudentProfile, StudentSkill, ReadinessAssessment, CareerRecommendation, Roadmap, RoadmapTask, Course, Opportunity } from '@/types';

export interface DashboardData {
  studentProfile: StudentProfile | null;
  studentSkills: StudentSkill[];
  completionScore: number;
  readinessAssessment: ReadinessAssessment | null;
  careerRecommendations: CareerRecommendation[];
  roadmap: Roadmap | null;
  roadmapTasks: RoadmapTask[];
  previewCourses: Course[];
  previewOpportunities: Opportunity[];
}

export async function getDashboardData(): Promise<{ success: boolean; data?: DashboardData; error?: string }> {
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
        studentSkills: [],
        completionScore: 0,
        readinessAssessment: null,
        careerRecommendations: [],
        roadmap: null,
        roadmapTasks: [],
        previewCourses: [],
        previewOpportunities: [],
      },
    };
  }

  const sp = profileRes.studentProfile;
  const skills = profileRes.studentSkills || [];

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
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*, career_roles(title)')
    .eq('student_id', sp.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let roadmapTasks: RoadmapTask[] = [];
  if (roadmap) {
    const { data: tasks } = await supabase
      .from('roadmap_tasks')
      .select('*')
      .eq('roadmap_id', roadmap.id)
      .order('week', { ascending: true })
      .limit(4);
    roadmapTasks = (tasks || []) as RoadmapTask[];
  }

  // 5. Query Catalog Courses Preview
  const { data: previewCourses } = await supabase
    .from('courses')
    .select('id, title, provider, level, is_free, price, url')
    .limit(3);

  // 6. Query Catalog Opportunities Preview
  const { data: previewOpportunities } = await supabase
    .from('opportunities')
    .select('id, title, organization, type, location, application_deadline, is_verified')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3);

  return {
    success: true,
    data: {
      studentProfile: sp,
      studentSkills: skills as unknown as StudentSkill[],
      completionScore,
      readinessAssessment: readinessAssessment || null,
      careerRecommendations: (careerRecommendations || []).map((recommendation) => ({
        ...recommendation,
        role: recommendation.career_roles,
      })) as unknown as CareerRecommendation[],
      roadmap: roadmap || null,
      roadmapTasks,
      previewCourses: previewCourses || [],
      previewOpportunities: (previewOpportunities || []) as unknown as Opportunity[],
    },
  };
}

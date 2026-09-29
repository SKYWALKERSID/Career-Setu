'use server';
import { createClient } from '@/lib/supabase/server';
import { buildProgressSnapshot } from './calculations';
import type { ReadinessAssessment, RoadmapTask } from '@/types';
import { getStudentSkillGaps } from '@/lib/skill-gap/actions';
import type { SkillGapResult } from '@/lib/skill-gap/types';

export async function getProgressSnapshot(requestedRoleId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const validRoleId = requestedRoleId && (student.target_careers || []).includes(requestedRoleId) ? requestedRoleId : student.target_careers?.[0];
  const [{ data: roadmap }, { data: readiness }, { data: role }, { data: targetCareers }, { count: currentSkills }, { count: completedInterviews }, { count: analyzedResumes }] = await Promise.all([
    supabase.from('roadmaps').select('id, target_role_id').eq('student_id', student.id).eq(validRoleId ? 'target_role_id' : 'student_id', validRoleId || student.id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('readiness_assessments').select('*').eq('student_id', student.id).order('created_at', { ascending: true }),
    validRoleId ? supabase.from('career_roles').select('id, title').eq('id', validRoleId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('career_roles').select('id, title').in('id', student.target_careers || []),
    supabase.from('student_skills').select('id', { count: 'exact', head: true }).eq('student_id', student.id),
    supabase.from('interviews').select('id', { count: 'exact', head: true }).eq('student_id', student.id).eq(validRoleId ? 'role_id' : 'student_id', validRoleId || student.id).eq('session_status', 'completed').not('overall_score', 'is', null),
    supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('student_id', student.id).eq(validRoleId ? 'target_role_id' : 'student_id', validRoleId || student.id).not('score', 'is', null),
  ]);
  const tasks: RoadmapTask[] | null = roadmap ? ((await supabase.from('roadmap_tasks').select('*').eq('roadmap_id', roadmap.id)).data || []) as RoadmapTask[] : null;
  let skillGaps: SkillGapResult[] = [];
  if (roadmap?.target_role_id) { const result = await getStudentSkillGaps(roadmap.target_role_id); if (result.success) skillGaps = result.gaps || []; }
  return { success: true, snapshot: buildProgressSnapshot({ activeRole: role || null, targetCareers: targetCareers || [], tasks, readiness: (readiness || []) as ReadinessAssessment[], currentSkills: currentSkills || 0, completedInterviews: completedInterviews || 0, analyzedResumes: analyzedResumes || 0, skillGaps }) };
}

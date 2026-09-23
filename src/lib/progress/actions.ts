'use server';
import { createClient } from '@/lib/supabase/server';
import { buildProgressSnapshot } from './calculations';
import type { ReadinessAssessment, RoadmapTask } from '@/types';

export async function getProgressSnapshot() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const [{ data: roadmap }, { data: readiness }, { count: currentSkills }, { count: completedInterviews }, { count: analyzedResumes }] = await Promise.all([
    supabase.from('roadmaps').select('id').eq('student_id', student.id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('readiness_assessments').select('*').eq('student_id', student.id).order('created_at', { ascending: true }),
    supabase.from('student_skills').select('id', { count: 'exact', head: true }).eq('student_id', student.id),
    supabase.from('interviews').select('id', { count: 'exact', head: true }).eq('student_id', student.id).eq('session_status', 'completed').not('overall_score', 'is', null),
    supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('student_id', student.id).not('score', 'is', null),
  ]);
  let tasks: RoadmapTask[] | null = null;
  if (roadmap) { const { data } = await supabase.from('roadmap_tasks').select('*').eq('roadmap_id', roadmap.id); tasks = (data || []) as RoadmapTask[]; }
  return { success: true, snapshot: buildProgressSnapshot({ tasks, readiness: (readiness || []) as ReadinessAssessment[], currentSkills: currentSkills || 0, completedInterviews: completedInterviews || 0, analyzedResumes: analyzedResumes || 0 }) };
}

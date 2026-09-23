'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateSkillGaps } from './scoring';
import type { SkillGapImportance } from './types';

export async function getStudentSkillGaps(roleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.', gaps: [] };
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.', gaps: [] };
  const { data: role } = await supabase.from('career_roles').select('id, title').eq('id', roleId).single();
  if (!role) return { success: false, error: 'Career role not found.', gaps: [] };
  const relevant = (student.target_careers || []).includes(roleId);
  const { data: recommendation } = await supabase.from('career_recommendations').select('role_id').eq('student_id', student.id).eq('role_id', roleId).maybeSingle();
  if (!relevant && !recommendation) return { success: false, error: 'Career role is not relevant to this student.', gaps: [] };
  const [{ data: requirements }, { data: studentSkills }, { data: courseSkills }] = await Promise.all([
    supabase.from('career_role_skills').select('skill_id, required, importance, skills(id, name)').eq('role_id', roleId),
    supabase.from('student_skills').select('skill_id, proficiency').eq('student_id', student.id),
    supabase.from('course_skills').select('skill_id, course_id'),
  ]);
  const proficiency = new Map((studentSkills || []).map((item) => [item.skill_id, item.proficiency as 'beginner' | 'intermediate' | 'advanced']));
  const courses = new Map<string, string[]>();
  const requirementIds = new Set((requirements || []).map((item) => item.skill_id));
  for (const item of courseSkills || []) if (requirementIds.has(item.skill_id)) courses.set(item.skill_id, [...(courses.get(item.skill_id) || []), item.course_id]);
  const requirementRows = (requirements || []) as unknown as Array<{ skill_id: string; required: boolean; importance: string; skills: { name: string } | Array<{ name: string }> | null }>;
  const gaps = calculateSkillGaps(requirementRows.map((item) => ({ skill_id: item.skill_id, skill_name: Array.isArray(item.skills) ? item.skills[0]?.name || item.skill_id : item.skills?.name || item.skill_id, importance: (item.importance || 'high') as SkillGapImportance, required: item.required, student_proficiency: proficiency.get(item.skill_id), course_ids: courses.get(item.skill_id) || [] })));
  return { success: true, role, gaps };
}

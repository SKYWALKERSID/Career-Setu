'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateSkillGaps } from '@/lib/skill-gap/scoring';
import type { SkillGapImportance } from '@/lib/skill-gap/types';
import { rankCourseMatches } from './scoring';
import type { CourseCatalogItem } from './types';

async function loadContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, student: null, context: null };
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers, interests').eq('user_id', user.id).single();
  if (!student) return { supabase, student: null, context: null };
  const [{ data: requirements }, { data: studentSkills }, { data: courseSkills }] = await Promise.all([
    supabase.from('career_role_skills').select('skill_id, required, importance, skills(id, name)').in('role_id', student.target_careers || []),
    supabase.from('student_skills').select('skill_id, proficiency').eq('student_id', student.id),
    supabase.from('course_skills').select('course_id, skill_id'),
  ]);
  const proficiency = new Map((studentSkills || []).map((item) => [item.skill_id, item.proficiency as 'beginner' | 'intermediate' | 'advanced']));
  const requirementRows = (requirements || []) as unknown as Array<{ skill_id: string; required: boolean; importance: string; skills: { name: string } | Array<{ name: string }> | null }>;
  const gaps = calculateSkillGaps(requirementRows.map((item) => ({ skill_id: item.skill_id, skill_name: Array.isArray(item.skills) ? item.skills[0]?.name || item.skill_id : item.skills?.name || item.skill_id, importance: (item.importance || 'high') as SkillGapImportance, required: item.required, student_proficiency: proficiency.get(item.skill_id) })));
  const courseSkillMap = new Map<string, string[]>();
  for (const row of courseSkills || []) courseSkillMap.set(row.course_id, [...(courseSkillMap.get(row.course_id) || []), row.skill_id]);
  return { supabase, student, context: { skills: studentSkills || [], gaps, targetRoleSkillIds: new Set((requirements || []).map((item) => item.skill_id)), interests: student.interests || [], courseSkillMap } };
}

async function discover(courseId?: string) {
  const { supabase, student, context } = await loadContext();
  if (!student || !context) return { success: false, error: 'Unauthorized or incomplete student profile.', courses: [] };
  const query = supabase.from('courses').select('*').eq(courseId ? 'id' : 'id', courseId || '00000000-0000-0000-0000-000000000000');
  const { data: rows, error } = courseId ? await query : await supabase.from('courses').select('*');
  if (error) return { success: false, error: 'Course catalog is unavailable.', courses: [] };
  if (courseId && !rows?.length) return { success: false, error: 'Course not found.', courses: [] };
  const ids = (rows || []).flatMap((row) => context.courseSkillMap.get(row.id) || []);
  const { data: skills } = ids.length ? await supabase.from('skills').select('id, name, category').in('id', [...new Set(ids)]) : { data: [] };
  const skillsByCourse = new Map<string, Array<{ id: string; name: string; category: string }>>();
  for (const row of rows || []) skillsByCourse.set(row.id, (context.courseSkillMap.get(row.id) || []).map((id) => (skills || []).find((skill) => skill.id === id)).filter((skill): skill is { id: string; name: string; category: string } => Boolean(skill)));
  const courses = (rows || []).map((row) => ({ ...row, skills: skillsByCourse.get(row.id) || [] })) as unknown as CourseCatalogItem[];
  return { success: true, courses: rankCourseMatches(courses, context) };
}

export async function getCourseRecommendations() { return discover(); }
export async function getCourseRecommendation(courseId: string) { return discover(courseId); }

'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateSkillGaps } from '@/lib/skill-gap/scoring';
import type { SkillGapImportance } from '@/lib/skill-gap/types';
import { rankCourseMatches } from './scoring';
import type { CourseCatalogItem } from './types';

export type CourseBrowseMode = 'all' | 'career' | 'skill';

async function loadContext(roleId?: string, skillId?: string, mode: CourseBrowseMode = 'all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, student: null, context: null };
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers, interests').eq('user_id', user.id).single();
  if (!student) return { supabase, student: null, context: null };
  const selectedRoleIds = roleId && (student.target_careers || []).includes(roleId) ? [roleId] : mode === 'career' ? [] : (student.target_careers || []);
  const [{ data: careerOptions }, { data: requirements }, { data: studentSkills }, { data: courseSkills }] = await Promise.all([
    student.target_careers?.length ? supabase.from('career_roles').select('id, title').in('id', student.target_careers) : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    supabase.from('career_role_skills').select('skill_id, required, importance, skills(id, name)').in('role_id', selectedRoleIds),
    supabase.from('student_skills').select('skill_id, proficiency, evidence_type, evidence, skills(id, name, category)').eq('student_id', student.id),
    supabase.from('course_skills').select('course_id, skill_id'),
  ]);
  const skillOptions = ((studentSkills || []).map((item) => {
    const skill = Array.isArray(item.skills) ? item.skills[0] : item.skills;
    return skill ? { id: skill.id, name: skill.name, category: skill.category || '' } : null;
  }).filter((skill): skill is { id: string; name: string; category: string } => Boolean(skill)));
  if (skillId && mode === 'skill') {
    // The explicit URL skill may be a role gap rather than a recorded student skill.
    // Keep it available as a truthful context option when it resolves canonically.
    const requestedSkillId = skillId;
    if (requestedSkillId && !skillOptions.some((skill) => skill.id === requestedSkillId)) {
      const { data: requestedSkill } = await supabase.from('skills').select('id, name, category').eq('id', requestedSkillId).maybeSingle();
      if (requestedSkill) skillOptions.push(requestedSkill);
    }
  }
  const studentSkillById = new Map((studentSkills || []).map((item) => [item.skill_id, item]));
  const requirementRows = (requirements || []) as unknown as Array<{ skill_id: string; required: boolean; importance: string; skills: { name: string } | Array<{ name: string }> | null }>;
  const gaps = calculateSkillGaps(requirementRows.map((item) => { const student = studentSkillById.get(item.skill_id); return { skill_id: item.skill_id, skill_name: Array.isArray(item.skills) ? item.skills[0]?.name || item.skill_id : item.skills?.name || item.skill_id, importance: (item.importance || 'high') as SkillGapImportance, required: item.required, student_proficiency: student?.proficiency as 'beginner' | 'intermediate' | 'advanced' | undefined, student_evidence_type: student?.evidence_type, student_evidence: student?.evidence }; }));
  const courseSkillMap = new Map<string, string[]>();
  for (const row of courseSkills || []) courseSkillMap.set(row.course_id, [...(courseSkillMap.get(row.course_id) || []), row.skill_id]);
  return { supabase, student, context: { skills: studentSkills || [], gaps, targetRoleSkillIds: new Set((requirements || []).map((item) => item.skill_id)), interests: student.interests || [], courseSkillMap, careerOptions: careerOptions || [], skillOptions } };
}

async function discover(courseId?: string, roleId?: string, skillId?: string, mode: CourseBrowseMode = 'all') {
  const { supabase, student, context } = await loadContext(roleId, skillId, mode);
  if (!student || !context) return { success: false, error: 'Unauthorized or incomplete student profile.', courses: [], careers: [], skills: [] };
  if (mode === 'career' && !context.targetRoleSkillIds.size) return { success: true, courses: [], careers: context.careerOptions, skills: context.skillOptions };
  if (mode === 'skill' && !skillId) return { success: true, courses: [], careers: context.careerOptions, skills: context.skillOptions };
  const query = supabase.from('courses').select('*').eq(courseId ? 'id' : 'id', courseId || '00000000-0000-0000-0000-000000000000');
  const { data: rows, error } = courseId ? await query : await supabase.from('courses').select('*');
  if (error) return { success: false, error: 'Course catalog is unavailable.', courses: [], careers: context.careerOptions, skills: context.skillOptions };
  if (courseId && !rows?.length) return { success: false, error: 'Course not found.', courses: [], careers: context.careerOptions, skills: context.skillOptions };
  const ids = (rows || []).flatMap((row) => context.courseSkillMap.get(row.id) || []);
  const { data: skills } = ids.length ? await supabase.from('skills').select('id, name, category').in('id', [...new Set(ids)]) : { data: [] };
  const skillsByCourse = new Map<string, Array<{ id: string; name: string; category: string }>>();
  for (const row of rows || []) skillsByCourse.set(row.id, (context.courseSkillMap.get(row.id) || []).map((id) => (skills || []).find((skill) => skill.id === id)).filter((skill): skill is { id: string; name: string; category: string } => Boolean(skill)));
  const courses = (rows || []).map((row) => ({ ...row, skills: skillsByCourse.get(row.id) || [] })) as unknown as CourseCatalogItem[];
  const relevantCourses = courses.filter((course) => {
    const courseSkillIds = (course.skills || []).map((skill) => skill.id);
    if (mode === 'career') return courseSkillIds.some((id) => context.targetRoleSkillIds.has(id));
    if (mode === 'skill') return courseSkillIds.includes(skillId as string);
    return true;
  });
  return { success: true, courses: rankCourseMatches(relevantCourses, context), careers: context.careerOptions, skills: context.skillOptions };
}

export async function getCourseRecommendations(roleId?: string, skillId?: string, mode: CourseBrowseMode = 'all') { return discover(undefined, roleId, skillId, mode); }
export async function getCourseRecommendation(courseId: string, roleId?: string) { return discover(courseId, roleId); }

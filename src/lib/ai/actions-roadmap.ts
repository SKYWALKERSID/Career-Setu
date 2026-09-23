'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { RoadmapSchema } from '@/lib/ai/schemas';
import { ROADMAP_PROMPT, ROADMAP_PROMPT_VERSION } from '@/lib/ai/prompts/roadmap';
import { validateRoadmap } from '@/lib/ai/roadmap';
import { calculateSkillGaps } from '@/lib/skill-gap/scoring';

type RoleRow = { id: string; title: string; description: string; career_role_skills: Array<{ skill_id: string; required: boolean; importance: string; skills: { id: string; name: string } | null }> };

export async function generateCareerRoadmap(): Promise<{ success: boolean; roadmapId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

  const { data: student } = await supabase.from('student_profiles').select('id, name, course, branch, interests, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const [{ data: roles }, { data: skills }, { data: recommendations }, { data: readiness }, { data: courses }] = await Promise.all([
    supabase.from('career_roles').select('id, title, description, career_role_skills(skill_id, required, importance, skills(id, name))'),
    supabase.from('student_skills').select('skill_id, proficiency, skills(id, name)').eq('student_id', student.id),
    supabase.from('career_recommendations').select('role_id, score').eq('student_id', student.id).order('score', { ascending: false }).limit(5),
    supabase.from('readiness_assessments').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('courses').select('id, title, provider, url, course_skills(skill_id)'),
  ]);
  const roleRows = (roles || []) as unknown as RoleRow[];
  const selected = (student.target_careers || []).find((id: string) => roleRows.some((role) => role.id === id)) || recommendations?.[0]?.role_id;
  const role = roleRows.find((candidate) => candidate.id === selected);
  if (!role) return { success: false, error: 'Select a target career or generate career recommendations first.' };
  const courseRows = (courses || []) as unknown as Array<{ id: string; title: string; provider: string; url: string; course_skills: Array<{ skill_id: string }> }>;
  const catalog = { roleIds: new Set(roleRows.map((item) => item.id)), skillIds: new Set(role.career_role_skills.map((item) => item.skill_id)), courseIds: new Set(courseRows.map((item) => item.id)) };
  const studentSkillRows = (skills || []) as unknown as Array<{ skill_id: string; proficiency: 'beginner' | 'intermediate' | 'advanced' }>;
  const skillGaps = calculateSkillGaps(role.career_role_skills.map((item) => ({ skill_id: item.skill_id, skill_name: item.skills?.name || item.skill_id, importance: (item.importance || 'high') as 'high' | 'medium' | 'low', required: item.required, student_proficiency: studentSkillRows.find((skill) => skill.skill_id === item.skill_id)?.proficiency })));
  const context = JSON.stringify({ student, selected_role: role, student_skills: skills || [], skill_gaps: skillGaps, recommendations: recommendations || [], readiness: readiness || null, courses: courseRows });
  const provider = aiClient.getProvider();
  const started = Date.now();
  let aiResult;
  try { aiResult = await provider.generateStructuredOutput(ROADMAP_PROMPT.replace('{{context}}', context), RoadmapSchema, 'You are a catalog-constrained roadmap service. Output JSON only.'); }
  catch { aiResult = { success: false, error: 'AI roadmap generation failed.', provider: provider.name, model: provider.modelName, latencyMs: Date.now() - started }; }
  const { data: run } = await supabase.from('ai_runs').insert({ feature: 'career_roadmap', model: provider.modelName, prompt_version: ROADMAP_PROMPT_VERSION, student_id: student.id, latency_ms: Date.now() - started, tokens_used: aiResult.tokensUsed ?? null, success: aiResult.success, error_message: aiResult.success ? null : aiResult.error }).select('id').single();
  if (!aiResult.success || !aiResult.data || !run?.id) return { success: false, error: 'Career roadmap is temporarily unavailable.' };
  const validated = validateRoadmap(aiResult.data, catalog);
  if (!validated.success) { await supabase.from('ai_runs').update({ success: false, error_message: validated.error }).eq('id', run.id); return { success: false, error: validated.error }; }
  const { data: existing } = await supabase.from('roadmaps').select('id').eq('student_id', student.id).eq('target_role_id', role.id).maybeSingle();
  let roadmapId = existing?.id;
  if (roadmapId) { await supabase.from('roadmap_tasks').delete().eq('roadmap_id', roadmapId); await supabase.from('roadmaps').update({ duration_days: 90, ai_run_id: run.id, generated_at: new Date().toISOString() }).eq('id', roadmapId); }
  else { const { data: created, error } = await supabase.from('roadmaps').insert({ student_id: student.id, target_role_id: role.id, duration_days: 90, ai_run_id: run.id }).select('id').single(); if (error || !created) return { success: false, error: 'Career roadmap could not be saved.' }; roadmapId = created.id; }
  const { error: taskError } = await supabase.from('roadmap_tasks').insert(validated.data.tasks.map((task) => ({ roadmap_id: roadmapId, week: task.week, task_type: task.task_type, title: task.title, description: `${task.description}${task.skill_ids.length ? ` Skills: ${task.skill_ids.join(', ')}` : ''}${task.course_ids.length ? ` Courses: ${task.course_ids.join(', ')}` : ''}`, status: 'pending' })));
  if (taskError) return { success: false, error: 'Career roadmap tasks could not be saved.' };
  revalidatePath('/roadmap'); revalidatePath('/dashboard');
  return { success: true, roadmapId };
}

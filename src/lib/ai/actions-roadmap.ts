'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { RoadmapSchema } from '@/lib/ai/schemas';
import { ROADMAP_PROMPT, ROADMAP_PROMPT_VERSION } from '@/lib/ai/prompts/roadmap';
import { validateRoadmap } from '@/lib/ai/roadmap';
import { buildRoadmapContext, type RoadmapCourse } from '@/lib/ai/roadmap-context';
import { calculateSkillGaps } from '@/lib/skill-gap/scoring';
import { resolveTargetCareerIds } from '@/lib/career/target-roles';

type RoleRow = { id: string; title: string; description: string; career_role_skills: Array<{ skill_id: string; required: boolean; importance: string; skills: { id: string; name: string } | null }> };

export async function generateCareerRoadmap(roleId: string): Promise<{ success: boolean; roadmapId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

  const { data: student } = await supabase.from('student_profiles').select('id, name, course, branch, degree_id, branch_id, specialization_id, degree_other, branch_other, specialization_other, interests, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const [{ data: roles }, { data: skills }, { data: readiness }] = await Promise.all([
    supabase.from('career_roles').select('id, title, description, career_role_skills(skill_id, required, importance, skills(id, name))'),
    supabase.from('student_skills').select('skill_id, proficiency, evidence_type, evidence, skills(id, name)').eq('student_id', student.id),
    supabase.from('readiness_assessments').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const roleRows = (roles || []) as unknown as RoleRow[];
  const targetRoleIds = resolveTargetCareerIds(student.target_careers || [], roleRows);
  const role = roleRows.find((candidate) => candidate.id === roleId && targetRoleIds.includes(candidate.id));
  if (!role) return { success: false, error: 'Select a target career or generate career recommendations first.' };
  const studentSkillRows = (skills || []) as unknown as Array<{ skill_id: string; proficiency: 'beginner' | 'intermediate' | 'advanced'; evidence_type?: 'self_declared' | 'project' | 'certification' | 'assessment' | 'resume'; evidence?: string | null }>;
  const skillInputs = [...new Map(role.career_role_skills.map((item) => [item.skill_id, item])).values()];
  const skillGaps = calculateSkillGaps(skillInputs.map((item) => { const student = studentSkillRows.find((skill) => skill.skill_id === item.skill_id); return { skill_id: item.skill_id, skill_name: item.skills?.name || item.skill_id, importance: (item.importance || 'high') as 'high' | 'medium' | 'low', required: item.required, student_proficiency: student?.proficiency, student_evidence_type: student?.evidence_type, student_evidence: student?.evidence }; }));
  const relevantSkillIds = [...new Set(skillGaps.filter((gap) => gap.status !== 'acquired').map((gap) => gap.skill_id))];
  const { data: courseSkillRows } = relevantSkillIds.length
    ? await supabase.from('course_skills').select('course_id, skill_id').in('skill_id', relevantSkillIds)
    : { data: [] as Array<{ course_id: string; skill_id: string }> };
  const courseIds = [...new Set((courseSkillRows || []).map((row) => row.course_id))];
  const { data: relevantCourses } = courseIds.length
    ? await supabase.from('courses').select('id, title, provider, url').in('id', courseIds)
    : { data: [] as Array<{ id: string; title: string; provider: string; url: string }> };
  const courseRows: RoadmapCourse[] = (relevantCourses || []).map((course) => ({ ...course, skill_ids: [...new Set((courseSkillRows || []).filter((row) => row.course_id === course.id).map((row) => row.skill_id))] }));
  const catalog = { roleIds: new Set(roleRows.map((item) => item.id)), skillIds: new Set(skillInputs.map((item) => item.skill_id)), courseIds: new Set(courseRows.map((course) => course.id)) };
  const relevantStudentSkills = studentSkillRows.filter((skill) => skillGaps.some((gap) => gap.skill_id === skill.skill_id));
  const context = JSON.stringify(buildRoadmapContext({
    student,
    role: { id: role.id, title: role.title, description: role.description },
    studentSkills: relevantStudentSkills,
    skillGaps,
    courses: courseRows,
    readiness: readiness ? { overall_score: readiness.overall_score, pending: ['project_score', 'resume_score', 'interview_score'].filter((key) => readiness[key as keyof typeof readiness] == null) } : null,
  }));
  const provider = aiClient.getProvider();
  const started = Date.now();
  let aiResult;
  const systemInstruction = 'You are a catalog-constrained roadmap service. Output JSON only.';
  try { aiResult = await provider.generateStructuredOutput(ROADMAP_PROMPT.replace('{{context}}', context), RoadmapSchema, systemInstruction); }
  catch { aiResult = { success: false, error: 'AI roadmap generation failed.', provider: provider.name, model: provider.modelName, latencyMs: Date.now() - started }; }
  // Groq can reject a large JSON-mode generation before schema validation. A
  // single compact retry keeps the operation provider-backed while reducing
  // ambiguity and explicitly bounding every array to the domain contract.
  if (!aiResult.success && !aiResult.fallbackFrom) {
    const compactContext = JSON.stringify({
      target_role: { id: role.id, title: role.title, description: role.description },
      gaps: skillGaps.map((gap) => ({ skill_id: gap.skill_id, skill_name: gap.skill_name, status: gap.status, importance: gap.importance })),
      student_skills: relevantStudentSkills.map((skill) => ({ skill_id: skill.skill_id, proficiency: skill.proficiency })),
      courses: courseRows.slice(0, 12),
      readiness: readiness ? { overall_score: readiness.overall_score, pending: ['project_score', 'resume_score', 'interview_score'].filter((key) => readiness[key as keyof typeof readiness] == null) } : null,
    });
    const compactPrompt = `Return exactly one JSON object with these top-level keys: target_role_id, duration_days, rationale, tasks. Use target_role_id "${role.id}" and duration_days 90. Create exactly 6 tasks across weeks 1, 3, 5, 7, 9, and 11. Each task must have task_type learning, project, or interview_prep; title; description; skill_ids with at most 2 IDs from the supplied gaps; and course_ids with at most 1 ID from the supplied courses. Use only supplied UUIDs. Do not invent IDs, markdown, nested objects, or extra keys. Keep rationale under 200 characters and descriptions under 300 characters. Context: ${compactContext}`;
    try { aiResult = await provider.generateStructuredOutput(compactPrompt, RoadmapSchema, systemInstruction); }
    catch { aiResult = { success: false, error: 'AI roadmap generation failed.', provider: provider.name, model: provider.modelName, latencyMs: Date.now() - started }; }
  }
  const { data: run } = await supabase.from('ai_runs').insert({ feature: 'career_roadmap', model: aiResult.model, provider: aiResult.provider, primary_provider: aiResult.attempts?.[0]?.provider || aiResult.provider, primary_model: aiResult.attempts?.[0]?.model || aiResult.model, fallback_provider: aiResult.attempts?.[1]?.provider || null, fallback_model: aiResult.attempts?.[1]?.model || null, fallback_reason: aiResult.fallbackReason || null, error_category: aiResult.errorCategory || null, prompt_version: ROADMAP_PROMPT_VERSION, student_id: student.id, latency_ms: Date.now() - started, tokens_used: aiResult.tokensUsed ?? null, success: aiResult.success, error_message: aiResult.success ? null : `${aiResult.errorCategory || 'AI_UNKNOWN_ERROR'}: ${aiResult.error || 'Career roadmap generation failed.'}` }).select('id').single();
  if (!aiResult.success || !aiResult.data || !run?.id) return { success: false, error: 'Career roadmap is temporarily unavailable.' };
  const validated = validateRoadmap(aiResult.data, catalog);
  if (!validated.success) { await supabase.from('ai_runs').update({ success: false, error_message: validated.error }).eq('id', run.id); return { success: false, error: validated.error }; }
  const { data: existing } = await supabase.from('roadmaps').select('id').eq('student_id', student.id).eq('target_role_id', role.id).maybeSingle();
  let roadmapId = existing?.id;
  if (roadmapId) { await supabase.from('roadmap_tasks').delete().eq('roadmap_id', roadmapId); await supabase.from('roadmaps').update({ duration_days: 90, ai_run_id: run.id, generated_at: new Date().toISOString() }).eq('id', roadmapId); }
  else { const { data: created, error } = await supabase.from('roadmaps').insert({ student_id: student.id, target_role_id: role.id, duration_days: 90, ai_run_id: run.id }).select('id').single(); if (error || !created) return { success: false, error: 'Career roadmap could not be saved.' }; roadmapId = created.id; }
  const { error: taskError } = await supabase.from('roadmap_tasks').insert(validated.data.tasks.map((task) => ({ roadmap_id: roadmapId, week: task.week, task_type: task.task_type, title: task.title, description: `${task.description}${task.course_ids.length ? ` Courses: ${task.course_ids.join(', ')}` : ''}`, skill_id: task.skill_ids[0] || null, evidence_required: task.evidence_required || null, status: 'pending' })));
  if (taskError) return { success: false, error: 'Career roadmap tasks could not be saved.' };
  revalidatePath('/roadmap'); revalidatePath('/dashboard');
  return { success: true, roadmapId };
}

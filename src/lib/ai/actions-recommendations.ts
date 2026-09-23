'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { CareerRecommendationsSchema } from '@/lib/ai/schemas';
import { CAREER_RECOMMENDATIONS_PROMPT, CAREER_RECOMMENDATIONS_PROMPT_VERSION } from '@/lib/ai/prompts/career-recommendations';
import { validateCareerRecommendations } from '@/lib/ai/recommendations';

type RoleRow = { id: string; title: string; category: string; description: string; career_role_skills: Array<{ skill_id: string; required: boolean; importance: string; skills: { id: string; name: string } | null }> };

function publicError(error: unknown): string {
  return error instanceof Error && error.message.includes('configured')
    ? error.message
    : 'Career recommendations are temporarily unavailable.';
}

export async function generateCareerRecommendations(): Promise<{ success: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

  const { data: student, error: studentError } = await supabase
    .from('student_profiles')
    .select('id, name, college, course, branch, semester, cgpa, interests, target_careers')
    .eq('user_id', user.id)
    .single();
  if (studentError || !student) return { success: false, error: 'Student profile not found.' };

  const [{ data: skills }, { data: roles }, { data: readiness }] = await Promise.all([
    supabase.from('student_skills').select('skill_id, proficiency, skills(id, name)').eq('student_id', student.id),
    supabase.from('career_roles').select('id, title, category, description, career_role_skills(skill_id, required, importance, skills(id, name))'),
    supabase.from('readiness_assessments').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const roleRows = (roles || []) as unknown as RoleRow[];
  if (roleRows.length === 0) return { success: false, error: 'Career catalog is unavailable.' };

  const roleCatalog = roleRows.map((role) => ({
    id: role.id,
    title: role.title,
    skillIds: new Set(role.career_role_skills.map((skill) => skill.skill_id)),
  }));
  const studentSkillRows = (skills || []) as unknown as Array<{ skill_id: string; proficiency: string; skills: { name: string } | Array<{ name: string }> | null }>;
  const context = JSON.stringify({
    student: { name: student.name, college: student.college, course: student.course, branch: student.branch, semester: student.semester, cgpa: student.cgpa, interests: student.interests || [], target_careers: student.target_careers || [] },
    skills: studentSkillRows.map((skill) => ({ skill_id: skill.skill_id, proficiency: skill.proficiency, name: Array.isArray(skill.skills) ? skill.skills[0]?.name : skill.skills?.name })),
    readiness: readiness ? { overall_score: readiness.overall_score, technical_score: readiness.technical_score, academic_score: readiness.academic_score, project_score: readiness.project_score, resume_score: readiness.resume_score, interview_score: readiness.interview_score, alignment_score: readiness.alignment_score, pending_dimensions: ['project_score', 'resume_score', 'interview_score'].filter((key) => readiness[key] === null) } : null,
    career_roles: roleRows.map((role) => ({ id: role.id, title: role.title, category: role.category, description: role.description, requirements: role.career_role_skills.map((skill) => ({ skill_id: skill.skill_id, skill_name: skill.skills?.name, required: skill.required, importance: skill.importance })) })),
  });

  const provider = aiClient.getProvider();
  const startedAt = Date.now();
  let aiResult;
  try {
    aiResult = await provider.generateStructuredOutput(
      CAREER_RECOMMENDATIONS_PROMPT.replace('{{context}}', context),
      CareerRecommendationsSchema,
      'You are a catalog-constrained recommendation service. Output JSON only.',
    );
  } catch (error) {
    aiResult = { success: false, error: publicError(error), provider: provider.name, model: provider.modelName, latencyMs: Date.now() - startedAt };
  }
  const latencyMs = Date.now() - startedAt;

  const { data: aiRun } = await supabase.from('ai_runs').insert({ feature: 'career_recommendations', model: provider.modelName, prompt_version: CAREER_RECOMMENDATIONS_PROMPT_VERSION, student_id: student.id, latency_ms: latencyMs, tokens_used: aiResult.tokensUsed ?? null, success: aiResult.success, error_message: aiResult.success ? null : aiResult.error || 'AI recommendation generation failed.' }).select('id').single();
  const aiRunId = aiRun?.id;

  if (!aiResult.success || !aiResult.data) return { success: false, error: publicError(aiResult.error) };
  const validated = validateCareerRecommendations(aiResult.data, roleCatalog);
  if (!validated.success) {
    if (aiRunId) await supabase.from('ai_runs').update({ success: false, error_message: validated.error }).eq('id', aiRunId);
    return { success: false, error: validated.error };
  }
  if (!aiRunId) return { success: false, error: 'Career recommendations could not be recorded.' };

  const { error: deleteError } = await supabase.from('career_recommendations').delete().eq('student_id', student.id);
  if (deleteError) return { success: false, error: 'Career recommendations could not be refreshed.' };

  const { error: insertError } = await supabase.from('career_recommendations').insert(validated.data.recommendations.map((recommendation) => ({ student_id: student.id, role_id: recommendation.role_id, score: recommendation.score, rationale: recommendation.rationale, missing_skills: recommendation.missing_skill_ids, ai_run_id: aiRunId })));
  if (insertError) return { success: false, error: 'Career recommendations could not be saved.' };

  revalidatePath('/dashboard');
  revalidatePath('/career');
  return { success: true, count: validated.data.recommendations.length };
}

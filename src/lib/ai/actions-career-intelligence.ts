'use server';

import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { CareerIntelligenceSchema, type CareerIntelligenceResult } from '@/lib/ai/schemas';
import { CAREER_INTELLIGENCE_PROMPT, CAREER_INTELLIGENCE_PROMPT_VERSION } from '@/lib/ai/prompts/career-intelligence';
import { calculateSkillGaps } from '@/lib/skill-gap/scoring';

type RoleSkill = { skill_id: string; required: boolean; importance: 'high' | 'medium' | 'low'; skills?: { id: string; name: string } | Array<{ id: string; name: string }> | null };
type StudentSkill = { skill_id: string; proficiency: 'beginner' | 'intermediate' | 'advanced'; evidence_type?: 'self_declared' | 'project' | 'certification' | 'assessment' | 'resume'; evidence?: string | null; skills?: { name?: string } | null };

export async function getCareerIntelligence(roleId: string): Promise<{ success: boolean; data?: CareerIntelligenceResult; cached?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

  const [{ data: student }, { data: role }] = await Promise.all([
    supabase.from('student_profiles').select('id, college, course, branch, degree_id, branch_id, specialization_id, degree_other, branch_other, specialization_other, semester, cgpa, interests, target_careers').eq('user_id', user.id).single(),
    supabase.from('career_roles').select('id, title, category, description, growth_outlook, salary_range, career_role_skills(skill_id, required, importance, skills(id, name))').eq('id', roleId).single(),
  ]);
  if (!student || !role) return { success: false, error: 'Career context is unavailable.' };

  const { data: studentSkills } = await supabase.from('student_skills').select('skill_id, proficiency, evidence_type, evidence, skills(name)').eq('student_id', student.id);
  const requirements = (role.career_role_skills || []) as unknown as RoleSkill[];
  const currentSkills = (studentSkills || []) as StudentSkill[];
  const skillGaps = calculateSkillGaps(requirements.map((item) => { const skill = Array.isArray(item.skills) ? item.skills[0] : item.skills; const student = currentSkills.find((studentSkill) => studentSkill.skill_id === item.skill_id); return { skill_id: item.skill_id, skill_name: skill?.name || item.skill_id, required: item.required, importance: item.importance, student_proficiency: student?.proficiency, student_evidence_type: student?.evidence_type, student_evidence: student?.evidence }; }));
  const missing = skillGaps.filter((gap) => gap.status !== 'acquired');
  const context = {
    student: { college: student.college, course: student.course, branch: student.branch, degree_id: student.degree_id, branch_id: student.branch_id, specialization_id: student.specialization_id, degree_other: student.degree_other, branch_other: student.branch_other, specialization_other: student.specialization_other, semester: student.semester, cgpa: student.cgpa, interests: student.interests || [], target_careers: student.target_careers || [] },
    current_skills: currentSkills.map((skill) => ({ skill_id: skill.skill_id, name: skill.skills?.name, proficiency: skill.proficiency })),
    career: { id: role.id, title: role.title, category: role.category, description: role.description, growth_outlook: role.growth_outlook, salary_range: role.salary_range, required_skills: requirements.map((item) => ({ skill_id: item.skill_id, name: (Array.isArray(item.skills) ? item.skills[0] : item.skills)?.name, importance: item.importance, required: item.required })) },
    deterministic_skill_gaps: skillGaps.map((gap) => ({ skill_id: gap.skill_id, skill_name: gap.skill_name, status: gap.status, priority: gap.priority })),
  };
  const inputHash = createHash('sha256').update(JSON.stringify(context)).digest('hex');
  const { data: cached } = await supabase.from('career_intelligence').select('insight').eq('student_id', student.id).eq('role_id', role.id).eq('input_hash', inputHash).maybeSingle();
  if (cached?.insight) {
    const parsed = CareerIntelligenceSchema.safeParse(cached.insight);
    if (parsed.success) return { success: true, data: parsed.data, cached: true };
  }

  const provider = aiClient.getProvider();
  const startedAt = Date.now();
  const result = await provider.generateStructuredOutput(CAREER_INTELLIGENCE_PROMPT.replace('{{context}}', JSON.stringify(context)), CareerIntelligenceSchema, 'You are a fact-preserving career intelligence service. Output JSON only.');
  const { data: aiRun } = await supabase.from('ai_runs').insert({ feature: 'career_intelligence', model: provider.modelName, prompt_version: CAREER_INTELLIGENCE_PROMPT_VERSION, student_id: student.id, latency_ms: Date.now() - startedAt, tokens_used: result.tokensUsed ?? null, success: result.success, error_message: result.success ? null : `${result.errorCategory || 'AI_UNKNOWN_ERROR'}: ${result.error || 'Career intelligence failed.'}` }).select('id').single();
  if (!result.success || !result.data) return { success: false, error: 'AI insight unavailable right now.' };

  const validMissingIds = new Set(missing.map((gap) => gap.skill_id));
  const gapNames = new Map(missing.map((gap) => [gap.skill_id, gap.skill_name]));
  const validated = CareerIntelligenceSchema.safeParse({ ...result.data, priority_gaps: result.data.priority_gaps.filter((gap) => validMissingIds.has(gap.skill_id)).map((gap) => ({ ...gap, skill_name: gapNames.get(gap.skill_id) || gap.skill_name })) });
  if (!validated.success) return { success: false, error: 'AI insight did not match the catalog.' };
  const { error: saveError } = await supabase.from('career_intelligence').insert({ student_id: student.id, role_id: role.id, input_hash: inputHash, provider: result.provider, model: result.model, insight: validated.data, ai_run_id: aiRun?.id || null });
  if (saveError && !saveError.message.toLowerCase().includes('duplicate')) return { success: false, error: 'AI insight could not be saved.' };
  revalidatePath(`/career/${roleId}`);
  return { success: true, data: validated.data, cached: false };
}

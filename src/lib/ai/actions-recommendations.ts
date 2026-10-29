'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { CareerRecommendationsSchema } from '@/lib/ai/schemas';
import { CAREER_RECOMMENDATIONS_PROMPT, CAREER_RECOMMENDATIONS_PROMPT_VERSION } from '@/lib/ai/prompts/career-recommendations';
import { validateCareerRecommendations } from '@/lib/ai/recommendations';
import { buildVersionedPromptTag } from '@/lib/ai/cache';

type RoleRow = { id: string; title: string; category: string; description: string; career_role_skills: Array<{ skill_id: string; required: boolean; importance: string; skills: { id: string; name: string } | null }> };
function publicError(error: unknown): string {
  return error instanceof Error && error.message.includes('configured')
    ? error.message
    : 'Career recommendations are temporarily unavailable.';
}

  export async function generateCareerRecommendations(forceRegenerate = false): Promise<{ success: boolean; count?: number; cached?: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

    const { data: student, error: studentError } = await supabase
      .from('student_profiles')
      .select('id, name, college, course, branch, degree_id, branch_id, specialization_id, degree_other, branch_other, specialization_other, semester, cgpa, interests, target_careers')
      .eq('user_id', user.id)
      .single();
    if (studentError || !student) return { success: false, error: 'Student profile not found.' };

  const [{ data: skills }, { data: roles }, { data: readiness }, { data: existingRecs }] = await Promise.all([
      supabase.from('student_skills').select('skill_id, proficiency, skills(id, name)').eq('student_id', student.id),
      supabase.from('career_roles').select('id, title, category, description, career_role_skills(skill_id, required, importance, skills(id, name))'),
      supabase.from('readiness_assessments').select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('career_recommendations').select('id, ai_run_id').eq('student_id', student.id),
    ]);

    const roleRows = ((roles || []) as unknown as RoleRow[]).slice().sort((a, b) => a.id.localeCompare(b.id));
    if (roleRows.length === 0) return { success: false, error: 'Career catalog is unavailable.' };

    const roleCatalog = roleRows.map((role) => ({
      id: role.id,
      title: role.title,
      skillIds: new Set(role.career_role_skills.map((skill) => skill.skill_id)),
    }));
    const studentSkillRows = ((skills || []) as unknown as Array<{ skill_id: string; proficiency: string; skills: { name: string } | Array<{ name: string }> | null }>)
      .slice()
      .sort((a, b) => a.skill_id.localeCompare(b.skill_id));

    const studentSkillSet = new Set(studentSkillRows.map((s) => s.skill_id));
    const sortedInterests = [...(student.interests || [])].sort();
    const sortedTargetCareers = [...(student.target_careers || [])].sort();

    const promptTag = buildVersionedPromptTag(CAREER_RECOMMENDATIONS_PROMPT_VERSION, {
      course: student.course,
      branch: student.branch,
      semester: student.semester,
      cgpa: student.cgpa,
      interests: sortedInterests,
      target_careers: sortedTargetCareers,
      skills: studentSkillRows.map((s) => ({ id: s.skill_id, p: s.proficiency })),
      readiness_score: readiness?.overall_score ?? null,
    });

    if (!forceRegenerate && existingRecs && existingRecs.length > 0) {
      const runId = existingRecs[0]?.ai_run_id;
      if (runId) {
        const { data: prevRun } = await supabase.from('ai_runs').select('prompt_version').eq('id', runId).maybeSingle();
        if (prevRun?.prompt_version === promptTag) {
          return { success: true, count: existingRecs.length, cached: true };
        }
      }
    }

    const context = JSON.stringify({
      student: {
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        cgpa: student.cgpa,
        interests: sortedInterests,
        target_careers: sortedTargetCareers,
      },
      skills: studentSkillRows.map((skill) => ({ proficiency: skill.proficiency, name: Array.isArray(skill.skills) ? skill.skills[0]?.name : skill.skills?.name })),
      readiness: readiness ? { overall_score: readiness.overall_score, technical_score: readiness.technical_score, academic_score: readiness.academic_score, project_score: readiness.project_score, resume_score: readiness.resume_score, interview_score: readiness.interview_score, alignment_score: readiness.alignment_score, pending_dimensions: ['project_score', 'resume_score', 'interview_score'].filter((key) => readiness[key] === null) } : null,
      career_roles: roleRows.map((role) => {
        const sortedSkills = role.career_role_skills.slice().sort((a, b) => a.skill_id.localeCompare(b.skill_id));
        return {
          id: role.id,
          title: role.title,
          category: role.category,
          matched_skills: sortedSkills.filter((s) => studentSkillSet.has(s.skill_id)).map((s) => s.skills?.name).filter(Boolean),
          missing_skills: sortedSkills.filter((s) => !studentSkillSet.has(s.skill_id)).map((s) => s.skills?.name).filter(Boolean),
        };
      }),
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

    const { data: aiRun } = await supabase.from('ai_runs').insert({ feature: 'career_recommendations', model: aiResult.model, provider: aiResult.provider, primary_provider: aiResult.attempts?.[0]?.provider || aiResult.provider, primary_model: aiResult.attempts?.[0]?.model || aiResult.model, fallback_provider: aiResult.attempts?.[1]?.provider || null, fallback_model: aiResult.attempts?.[1]?.model || null, fallback_reason: aiResult.fallbackReason || null, error_category: aiResult.errorCategory || null, prompt_version: promptTag, student_id: student.id, latency_ms: latencyMs, tokens_used: aiResult.tokensUsed ?? null, success: aiResult.success, error_message: aiResult.success ? null : `${aiResult.errorCategory || 'AI_UNKNOWN_ERROR'}: ${aiResult.error || 'AI recommendation generation failed.'}` }).select('id').single();
    const aiRunId = aiRun?.id;

    if (!aiResult.success || !aiResult.data) return { success: false, error: publicError(aiResult.error) };
    const roleMap = new Map(roleCatalog.map((role) => [role.id, role]));
    const roleRowMap = new Map(roleRows.map((role) => [role.id, role]));
    const seenRoleIds = new Set<string>();
    const sanitizedData = {
      recommendations: aiResult.data.recommendations
        .filter((item) => {
          if (!roleMap.has(item.role_id) || seenRoleIds.has(item.role_id)) return false;
          seenRoleIds.add(item.role_id);
          return true;
        })
        .map((item) => {
          const allowedSkills = roleMap.get(item.role_id)!.skillIds;
          const roleRow = roleRowMap.get(item.role_id)!;
          const catalogStrengths = roleRow.career_role_skills
            .filter((s) => studentSkillSet.has(s.skill_id))
            .map((s) => s.skill_id)
            .slice(0, 10);
          const catalogMissing = roleRow.career_role_skills
            .filter((s) => !studentSkillSet.has(s.skill_id))
            .map((s) => s.skill_id)
            .slice(0, 20);
          const filteredStrengths = [...new Set(item.strengths.filter((id) => allowedSkills.has(id)))];
          const filteredMissing = [...new Set(item.missing_skill_ids.filter((id) => allowedSkills.has(id)))];
          return {
            ...item,
            strengths: filteredStrengths.length > 0 ? filteredStrengths : catalogStrengths,
            missing_skill_ids: filteredMissing.length > 0 ? filteredMissing : catalogMissing,
          };
        }),
    };
    const validated = validateCareerRecommendations(sanitizedData, roleCatalog);
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

  export async function ensureCareerRecommendations(): Promise<{ success: boolean; count?: number; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

    const { data: student } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!student) return { success: false, error: 'Student profile not found.' };

    const { data: existing, error: existingError } = await supabase
      .from('career_recommendations')
      .select('id')
      .eq('student_id', student.id);
    if (existingError) return { success: false, error: 'Career recommendations could not be loaded.' };
    // Any persisted catalog-backed result is preferable to spending provider
    // quota regenerating on a passive career-page load. Explicit profile saves
    // and the dashboard action remain the deliberate refresh paths.
    if (!existing || existing.length === 0) {
      return await generateCareerRecommendations();
    }
    return { success: true, count: existing.length };
  }

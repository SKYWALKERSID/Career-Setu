'use server';

import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { ResumeParseSchema } from '@/lib/ai/schemas';
import { RESUME_ANALYSIS_VERSION, RESUME_PROMPT, RESUME_PROMPT_VERSION } from '@/lib/ai/prompts/resume';
import { calculateResumeScore, RESUME_SCORING_VERSION } from './scoring';
import type { ResumeParsedData } from './types';
import { buildDeterministicResume, extractResumeText, ResumeExtractionError } from './parser';
import { resolveTargetCareerIds } from '@/lib/career/target-roles';
import { calculateAndSaveReadinessAssessment } from '@/lib/readiness/actions';
import { isReusableResumeAnalysis } from '@/lib/ai/cache';

const MAX_BYTES = 5 * 1024 * 1024;
function logResumeUploadStage(stage: string, metadata: Record<string, string | number | boolean | null>) {
  console.info('[resume-upload]', { stage, runtime: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown', ...metadata });
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 96);
}

export async function getLatestResume(roleId?: string) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, resume: null, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
  if (!student) return { success: false, resume: null, error: 'Student profile not found.' };
  let query = supabase.from('resumes').select('*').eq('student_id', student.id);
  if (roleId) query = query.eq('target_role_id', roleId);
  const { data: resume } = await query.order('version', { ascending: false }).limit(1).maybeSingle();
  return { success: true, resume };
}

export async function triggerResumeAiAnalysis(
  resumeId?: string,
  requestedRoleId?: string,
  forceReanalysis = false
): Promise<{ success: boolean; resumeId?: string; error?: string; warning?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id, course, branch, degree_id, branch_id, specialization_id, degree_other, branch_other, specialization_other, target_careers')
    .eq('user_id', user.id)
    .single();
  if (!student) return { success: false, error: 'Student profile not found.' };

  let targetResumeRecord: { id: string; target_role_id: string; extracted_text: string; version: number; parsed_json: ResumeParsedData | null; score: number | null } | null = null;

  if (resumeId) {
    const { data } = await supabase
      .from('resumes')
      .select('id, target_role_id, extracted_text, version, parsed_json, score')
      .eq('id', resumeId)
      .eq('student_id', student.id)
      .maybeSingle();
    targetResumeRecord = data;
  }

  if (!targetResumeRecord) {
    let query = supabase.from('resumes').select('id, target_role_id, extracted_text, version, parsed_json, score').eq('student_id', student.id);
    if (requestedRoleId) query = query.eq('target_role_id', requestedRoleId);
    const { data } = await query.order('version', { ascending: false }).limit(1).maybeSingle();
    targetResumeRecord = data;
  }

  if (!targetResumeRecord || !targetResumeRecord.extracted_text) {
    return { success: false, error: 'No extracted resume text found. Please upload a resume first.' };
  }

  const roleId = requestedRoleId || targetResumeRecord.target_role_id || student.target_careers?.[0];
  if (!roleId) return { success: false, error: 'No target career selected.' };

  const analysisContextHash = createHash('sha256')
    .update(JSON.stringify({ roleId, analysisVersion: RESUME_ANALYSIS_VERSION, promptVersion: RESUME_PROMPT_VERSION, scoringVersion: RESUME_SCORING_VERSION }))
    .digest('hex');

  const text = targetResumeRecord.extracted_text;

  if (!forceReanalysis && isReusableResumeAnalysis(targetResumeRecord, text, RESUME_ANALYSIS_VERSION, analysisContextHash)) {
    return { success: true, resumeId: targetResumeRecord.id };
  }

  const [{ data: skills }, { data: allRoles }] = await Promise.all([
    supabase.from('skills').select('id, name, aliases'),
    supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))'),
  ]);

  const targetRoleIds = resolveTargetCareerIds([roleId], allRoles || []);
  const roles = (allRoles || []).filter((role) => targetRoleIds.includes(role.id));
  const roleSkills = [...new Set((roles || []).flatMap((role) => role.career_role_skills || []).map((item) => item.skill_id))];
  const selectedRole = roles[0] || (roles || []).find((r) => r.id === roleId);
  const selectedRoleTitle = selectedRole?.title || 'selected target career';

  const deterministicParsed = buildDeterministicResume(text, skills || [], roleSkills, selectedRoleTitle);
  const roleSkillNames = (selectedRole?.career_role_skills || [])
    .map((item) => (item.skills as unknown as { name: string })?.name)
    .filter(Boolean);

  const deterministicScore = calculateResumeScore(deterministicParsed);
  const context = JSON.stringify({
    academic: {
      course: student.course,
      branch: student.branch,
      degree_id: student.degree_id,
      branch_id: student.branch_id,
      specialization_id: student.specialization_id,
      degree_other: student.degree_other,
      branch_other: student.branch_other,
      specialization_other: student.specialization_other,
    },
    target_role: {
      id: roleId,
      title: selectedRoleTitle,
      required_skills: roleSkillNames,
    },
    role_required_skill_ids: roleSkills,
    deterministic_score: deterministicScore,
    deterministic_resume_facts: {
      name: deterministicParsed.name,
      summary: deterministicParsed.summary,
      education: deterministicParsed.education,
      skills: deterministicParsed.skills,
      projects: deterministicParsed.projects,
      experience: deterministicParsed.experience,
      certifications: deterministicParsed.certifications,
      achievements: deterministicParsed.achievements,
    },
    deterministic_findings: {
      strengths: deterministicParsed.strengths,
      improvement_areas: deterministicParsed.improvement_areas,
    },
    deterministic_gaps: {
      evidenced_skill_ids: deterministicParsed.evidenced_skill_ids,
      not_evidenced_skill_ids: deterministicParsed.not_evidenced_skill_ids,
    },
  });

  const provider = aiClient.getProvider();
  const started = Date.now();
  const resumePrompt = RESUME_PROMPT.replace('{{context}}', context).replace('{{resume}}', text);

  let result = await provider.generateStructuredOutput(resumePrompt, ResumeParseSchema, 'Fact-preserving structured resume parser.');
  if (!result.success && !result.fallbackFrom && result.errorCategory === 'AI_PROVIDER_ERROR' && result.error?.includes('HTTP 400')) {
    const retryPrompt = `${RESUME_PROMPT}\n\nReturn valid JSON only and preserve every required deep-analysis field.\nCATALOG: ${context}\nRESUME: ${text}`;
    result = await provider.generateStructuredOutput(retryPrompt, ResumeParseSchema, 'Return valid JSON only for a fact-preserving resume parser.');
  }

  await supabase.from('ai_runs').insert({
    feature: 'resume_parse',
    model: result.model,
    provider: result.provider,
    primary_provider: result.attempts?.[0]?.provider || result.provider,
    primary_model: result.attempts?.[0]?.model || result.model,
    fallback_provider: result.attempts?.[1]?.provider || null,
    fallback_model: result.attempts?.[1]?.model || null,
    fallback_reason: result.fallbackReason || null,
    error_category: result.errorCategory || null,
    prompt_version: RESUME_PROMPT_VERSION,
    student_id: student.id,
    latency_ms: Date.now() - started,
    tokens_used: result.tokensUsed ?? null,
    success: result.success,
    error_message: result.success ? null : `${result.errorCategory || 'AI_UNKNOWN_ERROR'}: ${result.error || 'Resume analysis failed.'}`,
  });

  if (!result.success || !result.data) {
    if (!targetResumeRecord.parsed_json || targetResumeRecord.parsed_json.analysis_source === 'deterministic_fallback') {
      const fallbackParsed: ResumeParsedData = {
        ...deterministicParsed,
        analysis_source: 'deterministic_fallback',
        analysis_version: RESUME_ANALYSIS_VERSION,
        analysis_context_hash: analysisContextHash,
      };
      const score = calculateResumeScore(fallbackParsed);
      await supabase.from('resumes').update({ parsed_json: fallbackParsed, score, target_role_id: roleId }).eq('id', targetResumeRecord.id);
    }
    return { success: false, resumeId: targetResumeRecord.id, error: 'Deep AI analysis is currently unavailable. Deterministic checks and score remain displayed.' };
  }

  const aiParsed = result.data as ResumeParsedData;
  const catalogSkillIds = new Set((skills || []).map((skill) => skill.id));
  const validRoleSkills = new Set(roleSkills);

  aiParsed.evidenced_skill_ids = (aiParsed.evidenced_skill_ids || []).filter((id) => catalogSkillIds.has(id));
  aiParsed.role_required_skill_ids = (aiParsed.role_required_skill_ids || []).filter((id) => validRoleSkills.has(id));
  aiParsed.not_evidenced_skill_ids = (aiParsed.not_evidenced_skill_ids || []).filter((id) => validRoleSkills.has(id));

  const parsed: ResumeParsedData = {
    ...deterministicParsed,
    analysis_source: 'ai',
    analysis_version: RESUME_ANALYSIS_VERSION,
    analysis_context_hash: analysisContextHash,
    strengths: aiParsed.strengths.length ? aiParsed.strengths : deterministicParsed.strengths,
    improvement_areas: aiParsed.improvement_areas.length ? aiParsed.improvement_areas : deterministicParsed.improvement_areas,
    suggestions: aiParsed.suggestions.length ? aiParsed.suggestions : deterministicParsed.suggestions,
    overall_assessment: aiParsed.overall_assessment,
    biggest_opportunity: aiParsed.biggest_opportunity,
    priority_issues: aiParsed.priority_issues,
    section_analysis: aiParsed.section_analysis,
    bullet_improvements: aiParsed.bullet_improvements,
    ats_keywords: aiParsed.ats_keywords,
    career_alignment_analysis: aiParsed.career_alignment_analysis,
    resume_strategy: aiParsed.resume_strategy,
    action_plan: aiParsed.action_plan,
    reanalysis_focus: aiParsed.reanalysis_focus,
  };

  const score = calculateResumeScore(parsed);
  const { error: analysisSaveError } = await supabase
    .from('resumes')
    .update({ parsed_json: parsed, score, target_role_id: roleId })
    .eq('id', targetResumeRecord.id)
    .eq('student_id', student.id);

  if (analysisSaveError) {
    return { success: false, resumeId: targetResumeRecord.id, error: 'Resume analysis could not be persisted.' };
  }

  await calculateAndSaveReadinessAssessment('resume_update');
  revalidatePath('/resume');
  revalidatePath('/progress');
  revalidatePath('/dashboard');

  return { success: true, resumeId: targetResumeRecord.id };
}

export async function uploadAndAnalyzeResume(formData: FormData, requestedRoleId?: string, forceReanalysis = false): Promise<{ success: boolean; resumeId?: string; error?: string; warning?: string }> {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const file = formData.get('file');
  if (!(file instanceof File)) return { success: false, error: 'Resume file is required.' };
  if (file.size > MAX_BYTES) return { success: false, error: 'Resume file must be 5 MB or smaller.' };
  const buffer = Buffer.from(await file.arrayBuffer());
  const hasPdfSignature = buffer.subarray(0, 5).equals(Buffer.from('%PDF-'));
  const isPlainText = !hasPdfSignature && file.type === 'text/plain';
  if (!hasPdfSignature && !isPlainText) return { success: false, error: 'Upload a valid PDF or plain-text resume.' };
  const extension = hasPdfSignature ? '.pdf' : '.txt';
  const { data: student } = await supabase.from('student_profiles').select('id, course, branch, degree_id, branch_id, specialization_id, degree_other, branch_other, specialization_other, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const { data: targetRole } = requestedRoleId && (student.target_careers || []).includes(requestedRoleId)
    ? await supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))').eq('id', requestedRoleId).maybeSingle()
    : { data: null };
  if (requestedRoleId && !targetRole) return { success: false, error: 'That target career is not selected for this student.' };
  const roleId = targetRole?.id || student.target_careers?.[0];
  if (!roleId) return { success: false, error: 'No target career selected. Choose a career before analyzing your resume.' };
  const analysisContextHash = createHash('sha256').update(JSON.stringify({ roleId, analysisVersion: RESUME_ANALYSIS_VERSION, promptVersion: RESUME_PROMPT_VERSION, scoringVersion: RESUME_SCORING_VERSION })).digest('hex');
  const byteHash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  logResumeUploadStage('server_bytes_received', { filename: safeFilename(file.name), received_mime: file.type, byte_length: buffer.length, byte_hash: byteHash, pdf_signature: hasPdfSignature });
  let text: string;
  try {
    logResumeUploadStage('pdfjs_open_start', { byte_length: buffer.length, byte_hash: byteHash, pdf_signature: hasPdfSignature });
    text = (await extractResumeText(buffer, hasPdfSignature ? 'application/pdf' : 'text/plain')).slice(0, 50000);
    if (!text) throw new ResumeExtractionError('unreadable_pdf', 'This PDF contains no readable text. Please upload a text-readable PDF.');
    logResumeUploadStage('text_extraction_succeeded', { extracted_text_length: text.length });
  } catch (error) {
    const errorName = error && typeof error === 'object' && 'name' in error ? String(error.name) : null;
    const errorMessage = error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ').slice(0, 180) : null;
    logResumeUploadStage('text_extraction_failed', { error_category: error instanceof ResumeExtractionError ? error.code : 'pdfjs_or_parser_error', error_name: errorName, error_message: errorMessage, pdf_signature: hasPdfSignature, byte_length: buffer.length, byte_hash: byteHash });
    return { success: false, error: error instanceof Error ? error.message : 'Resume text extraction failed.' };
  }
  const { data: reusableRows } = await supabase
    .from('resumes')
    .select('id, extracted_text, parsed_json, score')
    .eq('student_id', student.id)
    .eq('target_role_id', roleId)
    .not('parsed_json', 'is', null)
    .not('score', 'is', null)
    .order('version', { ascending: false });
  const reusable = (reusableRows || []).find((record) => isReusableResumeAnalysis(record, text, RESUME_ANALYSIS_VERSION, analysisContextHash));
  if (!forceReanalysis && reusable && isReusableResumeAnalysis(reusable, text, RESUME_ANALYSIS_VERSION, analysisContextHash)) {
    return { success: true, resumeId: reusable.id };
  }
  const { data: latest } = await supabase.from('resumes').select('version').eq('student_id', student.id).order('version', { ascending: false }).limit(1).maybeSingle();
  const version = (latest?.version || 0) + 1; const storagePath = `${student.id}/${version}-${crypto.randomUUID()}${extension}`;
  const { error: uploadError } = await supabase.storage.from('private-resumes').upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) { logResumeUploadStage('storage_upload_failed', { error_category: 'storage_upload_failed', byte_length: buffer.length, byte_hash: byteHash, storage_path_hash: createHash('sha256').update(storagePath).digest('hex').slice(0, 16) }); return { success: false, error: 'Resume upload failed.' }; }
  logResumeUploadStage('storage_upload_succeeded', { byte_length: buffer.length, byte_hash: byteHash, storage_path_hash: createHash('sha256').update(storagePath).digest('hex').slice(0, 16) });
  
  const [{ data: skills }, { data: allRoles }] = await Promise.all([
    supabase.from('skills').select('id, name, aliases'),
    supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))'),
  ]);
  const targetRoleIds = resolveTargetCareerIds([roleId], allRoles || []);
  const roles = (allRoles || []).filter((role) => targetRoleIds.includes(role.id));
  const roleSkills = [...new Set((roles || []).flatMap((role) => role.career_role_skills || []).map((item) => item.skill_id))];
  const selectedRoleTitle = roles[0]?.title || 'selected target career';
  const deterministicParsed = buildDeterministicResume(text, skills || [], roleSkills, selectedRoleTitle);
  const fallbackParsed: ResumeParsedData = {
    ...deterministicParsed,
    analysis_source: 'deterministic_fallback',
    analysis_version: RESUME_ANALYSIS_VERSION,
    analysis_context_hash: analysisContextHash,
  };
  const score = calculateResumeScore(fallbackParsed);

  const { data: resume, error: resumeError } = await supabase.from('resumes').insert({
    student_id: student.id,
    target_role_id: roleId,
    storage_path: storagePath,
    extracted_text: text,
    parsed_json: fallbackParsed,
    score,
    version,
  }).select('id').single();

  if (resumeError || !resume) {
    await supabase.storage.from('private-resumes').remove([storagePath]);
    return { success: false, error: 'Resume record could not be created.' };
  }

  // Attempt AI Analysis on the extracted structured text
  const aiAnalysisResult = await triggerResumeAiAnalysis(resume.id, roleId, forceReanalysis);
  if (!aiAnalysisResult.success) {
    return { success: true, resumeId: resume.id, warning: 'Resume extracted successfully. Deep AI analysis is currently unavailable.' };
  }

  return { success: true, resumeId: resume.id };
}

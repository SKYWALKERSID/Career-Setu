'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { ResumeParseSchema } from '@/lib/ai/schemas';
import { RESUME_PROMPT, RESUME_PROMPT_VERSION } from '@/lib/ai/prompts/resume';
import { calculateResumeScore } from './scoring';
import type { ResumeParsedData } from './types';
import { resolveTargetCareerIds } from '@/lib/career/target-roles';
import { calculateAndSaveReadinessAssessment } from '@/lib/readiness/actions';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([['application/pdf', '.pdf'], ['text/plain', '.txt']]);

type ResumeCatalogSkill = { id: string; name: string; aliases?: string[] | null };

function deterministicResumeFallback(
  text: string,
  skills: ResumeCatalogSkill[],
  roleRequiredSkillIds: string[],
  roleTitle: string,
): ResumeParsedData {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const links = [...text.matchAll(/https?:\/\/[^\s)]+/gi)].map((match) => match[0].replace(/[.,;]+$/, '')).slice(0, 10);
  const evidenced = skills.filter((skill) => {
    const names = [skill.name, ...(skill.aliases || [])].filter(Boolean).map((value) => value.toLowerCase());
    return names.some((name) => name.length > 2 && lowerText.includes(name));
  });
  const required = skills.filter((skill) => roleRequiredSkillIds.includes(skill.id));
  const missing = required.filter((skill) => !evidenced.some((item) => item.id === skill.id));
  const skillsLine = lines.find((line) => /^skills?\s*:/i.test(line));
  const projects = lines.filter((line) => /^(project|projects?)\s*:/i.test(line) || /\b(project|built|developed|created)\b/i.test(line)).slice(0, 20);
  const education = lines.filter((line) => /\b(b\.?tech|b\.?e\.?|b\.?sc|bca|mca|university|college|institute|school)\b/i.test(line)).slice(0, 10);
  const experience = lines.filter((line) => /\b(experience|intern(ship)?|worked|employment|developer|engineer|analyst)\b/i.test(line)).slice(0, 20);
  const certifications = lines.filter((line) => /\b(certif|course|credential)\b/i.test(line)).slice(0, 20);
  const achievements = lines.filter((line) => /\b(achievement|award|hackathon|winner|honou?r)\b/i.test(line)).slice(0, 20);
  const missingNames = missing.slice(0, 5).map((skill) => skill.name);

  return {
    analysis_source: 'deterministic_fallback',
    contact: { email, phone, links },
    education,
    skills: skillsLine ? skillsLine.replace(/^skills?\s*:/i, '').split(/,|;/).map((item) => item.trim()).filter(Boolean).slice(0, 50) : evidenced.map((skill) => skill.name).slice(0, 50),
    projects,
    experience,
    certifications,
    achievements,
    evidenced_skill_ids: evidenced.map((skill) => skill.id),
    role_required_skill_ids: roleRequiredSkillIds,
    not_evidenced_skill_ids: missing.map((skill) => skill.id),
    strengths: [
      evidenced.length ? `The resume explicitly mentions ${evidenced.slice(0, 4).map((skill) => skill.name).join(', ')}.` : 'No catalog skills were explicitly evidenced in the extracted text.',
      projects.length ? `${projects.length} project evidence item${projects.length === 1 ? '' : 's'} were extracted.` : 'No project evidence was extracted.',
    ],
    improvement_areas: [
      ...(missingNames.length ? [`For ${roleTitle}, the resume does not explicitly evidence: ${missingNames.join(', ')}.`] : []),
      ...(!experience.length ? ['No work-experience evidence was extracted.'] : []),
      ...(!email ? ['No email address was extracted from the resume.'] : []),
    ].slice(0, 10),
    suggestions: [
      ...(missingNames.length ? [`Add factual evidence for ${missingNames.slice(0, 3).join(', ')} if you have it for the ${roleTitle} path.`] : []),
      ...(projects.length ? ['Strengthen the project bullets with real outcomes or measurements where available.'] : ['Add a project with a clear problem, contribution, and evidence of the result.']),
      ...(!experience.length ? ['Add work or internship evidence only if it exists in your actual background.'] : []),
    ].slice(0, 15),
  };
}

function extractText(buffer: Buffer, type: string): string {
  if (type === 'text/plain') return buffer.toString('utf8').trim();
  if (type === 'application/pdf') {
    const raw = buffer.toString('latin1');
    // Extract text from (text) Tj commands
    const tjMatches = [...raw.matchAll(/\(([^()]*)\)\s*Tj/g)].map((m) => m[1].replace(/\\([()\\])/g, '$1'));
    // Extract text from [(text1) -10 (text2)] TJ commands
    const arrayMatches = [...raw.matchAll(/\[\s*((?:\((?:[^()]*)\)|[^\]])*)\]\s*TJ/g)]
      .flatMap((m) => [...m[1].matchAll(/\(([^()]*)\)/g)].map((sub) => sub[1].replace(/\\([()\\])/g, '$1')));

    let extracted = [...tjMatches, ...arrayMatches].join(' ').trim();

    // Fallback: If regex extraction yields less than 20 characters, extract printable ASCII sequences from the stream
    if (extracted.length < 20) {
      const asciiClean = raw
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // Filter out PDF syntax keywords
      extracted = asciiClean
        .split(' ')
        .filter((w) => w.length > 1 && !/^(obj|endobj|stream|endstream|xref|trailer|startxref|Catalog|Pages|Parent|Type|Font|Length|Filter)$/i.test(w))
        .join(' ');
    }

    return extracted.trim();
  }
  throw new Error('Unsupported format. Please upload a PDF or text resume.');
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

export async function uploadAndAnalyzeResume(formData: FormData, requestedRoleId?: string): Promise<{ success: boolean; resumeId?: string; error?: string; warning?: string }> {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const file = formData.get('file');
  if (!(file instanceof File)) return { success: false, error: 'Resume file is required.' };
  const extension = ALLOWED.get(file.type);
  if (!extension) return { success: false, error: 'Unsupported file type. Upload PDF or plain text.' };
  if (file.size > MAX_BYTES) return { success: false, error: 'Resume file must be 5 MB or smaller.' };
  const { data: student } = await supabase.from('student_profiles').select('id, course, branch, degree_id, branch_id, specialization_id, degree_other, branch_other, specialization_other, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const { data: targetRole } = requestedRoleId && (student.target_careers || []).includes(requestedRoleId)
    ? await supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))').eq('id', requestedRoleId).maybeSingle()
    : { data: null };
  if (requestedRoleId && !targetRole) return { success: false, error: 'That target career is not selected for this student.' };
  const roleId = targetRole?.id || student.target_careers?.[0];
  if (!roleId) return { success: false, error: 'No target career selected. Choose a career before analyzing your resume.' };
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type === 'application/pdf' && !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) return { success: false, error: 'The uploaded PDF signature is invalid.' };
  let text: string;
  try { text = extractText(buffer, file.type).slice(0, 50000); if (!text) throw new Error('No readable text was found in the uploaded resume.'); }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Resume text extraction failed.' }; }
  const { data: reusable } = await supabase
    .from('resumes')
    .select('id, extracted_text, parsed_json, score')
    .eq('student_id', student.id)
    .eq('target_role_id', roleId)
    .not('parsed_json', 'is', null)
    .not('score', 'is', null)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reusable?.extracted_text === text && reusable.parsed_json && reusable.score !== null) {
    return { success: true, resumeId: reusable.id };
  }
  const { data: latest } = await supabase.from('resumes').select('version').eq('student_id', student.id).order('version', { ascending: false }).limit(1).maybeSingle();
  const version = (latest?.version || 0) + 1; const storagePath = `${student.id}/${version}-${crypto.randomUUID()}${extension}`;
  const { error: uploadError } = await supabase.storage.from('private-resumes').upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: 'Resume upload failed.' };
  const { data: resume, error: resumeError } = await supabase.from('resumes').insert({ student_id: student.id, target_role_id: roleId, storage_path: storagePath, extracted_text: text, score: null, version }).select('id').single();
  if (resumeError || !resume) { await supabase.storage.from('private-resumes').remove([storagePath]); return { success: false, error: 'Resume record could not be created.' }; }
  const [{ data: skills }, { data: allRoles }] = await Promise.all([
    supabase.from('skills').select('id, name, aliases'),
    supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))'),
  ]);
  const targetRoleIds = resolveTargetCareerIds([roleId], allRoles || []);
  const roles = (allRoles || []).filter((role) => targetRoleIds.includes(role.id));
  const roleSkills = [...new Set((roles || []).flatMap((role) => role.career_role_skills || []).map((item) => item.skill_id))];
  const selectedRoleTitle = roles[0]?.title || 'selected target career';
  const context = JSON.stringify({ academic: { course: student.course, branch: student.branch, degree_id: student.degree_id, branch_id: student.branch_id, specialization_id: student.specialization_id, degree_other: student.degree_other, branch_other: student.branch_other, specialization_other: student.specialization_other }, skills: skills || [], target_roles: roles || [], role_required_skill_ids: roleSkills });
  const provider = aiClient.getProvider(); const started = Date.now();
  const resumePrompt = RESUME_PROMPT.replace('{{context}}', context).replace('{{resume}}', text);
  let result = await provider.generateStructuredOutput(resumePrompt, ResumeParseSchema, 'Fact-preserving structured resume parser.');
  if (!result.success && !result.fallbackFrom && result.errorCategory === 'AI_PROVIDER_ERROR' && result.error?.includes('HTTP 400')) {
    const retryPrompt = `Return one valid JSON object only. Extract only facts explicitly present in this resume. Use empty arrays for absent sections. Every list item must be a plain string. Use only supplied UUIDs for evidence arrays. Exact keys: contact, education, skills, projects, experience, certifications, achievements, evidenced_skill_ids, role_required_skill_ids, not_evidenced_skill_ids, strengths, improvement_areas, suggestions.\nCATALOG: ${context}\nRESUME: ${text}`;
    result = await provider.generateStructuredOutput(retryPrompt, ResumeParseSchema, 'Return valid JSON only for a fact-preserving resume parser.');
  }
  const { data: run } = await supabase.from('ai_runs').insert({ feature: 'resume_parse', model: result.model, provider: result.provider, primary_provider: result.attempts?.[0]?.provider || result.provider, primary_model: result.attempts?.[0]?.model || result.model, fallback_provider: result.attempts?.[1]?.provider || null, fallback_model: result.attempts?.[1]?.model || null, fallback_reason: result.fallbackReason || null, error_category: result.errorCategory || null, prompt_version: RESUME_PROMPT_VERSION, student_id: student.id, latency_ms: Date.now() - started, tokens_used: result.tokensUsed ?? null, success: result.success, error_message: result.success ? null : `${result.errorCategory || 'AI_UNKNOWN_ERROR'}: ${result.error || 'Resume analysis failed.'}` }).select('id').single();
  let usedFallback = false;
  let parsed: ResumeParsedData;
  if (!result.success || !result.data) {
    usedFallback = true;
    parsed = deterministicResumeFallback(text, skills || [], roleSkills, selectedRoleTitle);
  } else {
    parsed = { ...(result.data as ResumeParsedData), analysis_source: 'ai' };
  }
  const catalogSkillIds = new Set((skills || []).map((skill) => skill.id)); const validRoleSkills = new Set(roleSkills);
  if (!usedFallback && (parsed.evidenced_skill_ids.some((id) => !catalogSkillIds.has(id)) || parsed.role_required_skill_ids.some((id) => !validRoleSkills.has(id)) || parsed.not_evidenced_skill_ids.some((id) => !validRoleSkills.has(id)))) {
    usedFallback = true;
    parsed = deterministicResumeFallback(text, skills || [], roleSkills, selectedRoleTitle);
    if (run?.id) await supabase.from('ai_runs').update({ success: false, error_message: 'AI_SCHEMA_ERROR: Resume parser returned unsupported catalog entities; deterministic fallback persisted.' }).eq('id', run.id);
  }
  const score = calculateResumeScore(parsed);
  const { error: analysisSaveError } = await supabase.from('resumes').update({ parsed_json: parsed, score }).eq('id', resume.id).eq('student_id', student.id);
  if (analysisSaveError) return { success: false, resumeId: resume.id, error: 'Resume analysis could not be persisted. The uploaded file was preserved; please retry.' };
  // Resume evidence changes the readiness inputs; refresh the persisted
  // assessment only after the parsed result has been saved.
  await calculateAndSaveReadinessAssessment();
  revalidatePath('/resume'); revalidatePath('/progress'); revalidatePath('/dashboard');
  return { success: true, resumeId: resume.id, warning: usedFallback ? 'AI insight unavailable right now. Deterministic resume checks were saved.' : undefined };
}

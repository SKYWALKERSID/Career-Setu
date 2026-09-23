'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { ResumeParseSchema } from '@/lib/ai/schemas';
import { RESUME_PROMPT, RESUME_PROMPT_VERSION } from '@/lib/ai/prompts/resume';
import { calculateResumeScore } from './scoring';
import type { ResumeParsedData } from './types';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([['application/pdf', '.pdf'], ['text/plain', '.txt']]);

function extractText(buffer: Buffer, type: string): string {
  if (type === 'text/plain') return buffer.toString('utf8').trim();
  if (type === 'application/pdf') {
    const raw = buffer.toString('latin1');
    return [...raw.matchAll(/\(([^()]*)\)\s*Tj/g)].map((match) => match[1].replace(/\\([()\\])/g, '$1')).join(' ').trim();
  }
  throw new Error('DOCX text extraction is not available in the current runtime. Please upload a PDF or text resume.');
}

export async function getLatestResume() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, resume: null, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
  if (!student) return { success: false, resume: null, error: 'Student profile not found.' };
  const { data: resume } = await supabase.from('resumes').select('*').eq('student_id', student.id).order('version', { ascending: false }).limit(1).maybeSingle();
  return { success: true, resume };
}

export async function uploadAndAnalyzeResume(formData: FormData): Promise<{ success: boolean; resumeId?: string; error?: string }> {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const file = formData.get('file');
  if (!(file instanceof File)) return { success: false, error: 'Resume file is required.' };
  const extension = ALLOWED.get(file.type);
  if (!extension) return { success: false, error: 'Unsupported file type. Upload PDF or plain text.' };
  if (file.size > MAX_BYTES) return { success: false, error: 'Resume file must be 5 MB or smaller.' };
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type === 'application/pdf' && !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) return { success: false, error: 'The uploaded PDF signature is invalid.' };
  let text: string;
  try { text = extractText(buffer, file.type).slice(0, 50000); if (!text) throw new Error('No readable text was found in the uploaded resume.'); }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Resume text extraction failed.' }; }
  const { data: latest } = await supabase.from('resumes').select('version').eq('student_id', student.id).order('version', { ascending: false }).limit(1).maybeSingle();
  const version = (latest?.version || 0) + 1; const storagePath = `${student.id}/${version}-${crypto.randomUUID()}${extension}`;
  const { error: uploadError } = await supabase.storage.from('private-resumes').upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: 'Resume upload failed.' };
  const { data: resume, error: resumeError } = await supabase.from('resumes').insert({ student_id: student.id, storage_path: storagePath, extracted_text: text, score: null, version }).select('id').single();
  if (resumeError || !resume) { await supabase.storage.from('private-resumes').remove([storagePath]); return { success: false, error: 'Resume record could not be created.' }; }
  const [{ data: skills }, { data: roles }] = await Promise.all([
    supabase.from('skills').select('id, name'),
    supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))').in('id', student.target_careers || []),
  ]);
  const roleSkills = (roles || []).flatMap((role) => role.career_role_skills || []).map((item) => item.skill_id);
  const context = JSON.stringify({ skills: skills || [], target_roles: roles || [], role_required_skill_ids: roleSkills });
  const provider = aiClient.getProvider(); const started = Date.now();
  const result = await provider.generateStructuredOutput(RESUME_PROMPT.replace('{{context}}', context).replace('{{resume}}', text), ResumeParseSchema, 'Fact-preserving structured resume parser.');
  const { data: run } = await supabase.from('ai_runs').insert({ feature: 'resume_parse', model: provider.modelName, prompt_version: RESUME_PROMPT_VERSION, student_id: student.id, latency_ms: Date.now() - started, tokens_used: result.tokensUsed ?? null, success: result.success, error_message: result.success ? null : result.error || 'Resume analysis failed.' }).select('id').single();
  if (!result.success || !result.data) return { success: false, resumeId: resume.id, error: 'Resume analysis is temporarily unavailable. The uploaded file was preserved without a score.' };
  const parsed = result.data as ResumeParsedData;
  const catalogSkillIds = new Set((skills || []).map((skill) => skill.id)); const validRoleSkills = new Set(roleSkills);
  if (parsed.evidenced_skill_ids.some((id) => !catalogSkillIds.has(id)) || parsed.role_required_skill_ids.some((id) => !validRoleSkills.has(id)) || parsed.not_evidenced_skill_ids.some((id) => !validRoleSkills.has(id))) { if (run?.id) await supabase.from('ai_runs').update({ success: false, error_message: 'Resume parser returned unsupported catalog entities.' }).eq('id', run.id); return { success: false, resumeId: resume.id, error: 'Resume analysis returned unsupported catalog data.' }; }
  const score = calculateResumeScore(parsed);
  await supabase.from('resumes').update({ parsed_json: parsed, score }).eq('id', resume.id).eq('student_id', student.id);
  revalidatePath('/resume'); revalidatePath('/progress'); revalidatePath('/dashboard');
  return { success: true, resumeId: resume.id };
}

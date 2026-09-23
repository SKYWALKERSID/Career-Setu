'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/client';
import { InterviewEvaluationSchema, InterviewQuestionSchema, InterviewReportSchema } from '@/lib/ai/schemas';
import { INTERVIEW_EVALUATION_PROMPT, INTERVIEW_EVALUATION_PROMPT_VERSION, INTERVIEW_QUESTION_PROMPT, INTERVIEW_QUESTION_PROMPT_VERSION, INTERVIEW_REPORT_PROMPT, INTERVIEW_REPORT_PROMPT_VERSION } from '@/lib/ai/prompts/interview';

const MAX_QUESTIONS = 5;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
type Difficulty = typeof DIFFICULTIES[number];

async function authStudent(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: student } = await supabase.from('student_profiles').select('id, target_careers').eq('user_id', user.id).single();
  return student;
}

async function aiCall<T>(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string, feature: string, promptVersion: string, prompt: string, schema: z.ZodSchema<T>) {
  const provider = aiClient.getProvider(); const started = Date.now();
  const result = await provider.generateStructuredOutput(prompt, schema, 'You are a safe structured mock interview service.');
  const { data: run } = await supabase.from('ai_runs').insert({ feature, model: provider.modelName, prompt_version: promptVersion, student_id: studentId, latency_ms: Date.now() - started, tokens_used: result.tokensUsed ?? null, success: result.success, error_message: result.success ? null : result.error || 'Interview AI operation failed.' }).select('id').single();
  return { result, runId: run?.id };
}

export async function startInterview(roleId: string, difficulty: string) {
  const supabase = await createClient(); const student = await authStudent(supabase);
  if (!student) return { success: false, error: 'Unauthorized: Authentication required.' };
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) return { success: false, error: 'Invalid interview difficulty.' };
  const [{ data: role }, { data: recommendation }] = await Promise.all([
    supabase.from('career_roles').select('id, title, description, career_role_skills(skill_id, skills(id, name))').eq('id', roleId).single(),
    supabase.from('career_recommendations').select('role_id').eq('student_id', student.id).eq('role_id', roleId).maybeSingle(),
  ]);
  if (!role || (!(student.target_careers || []).includes(roleId) && !recommendation)) return { success: false, error: 'Career role is not valid for this student.' };
  const context = JSON.stringify({ role, difficulty, previous_turns: [], known_student_skills: [] });
  const { result } = await aiCall(supabase, student.id, 'interview_question', INTERVIEW_QUESTION_PROMPT_VERSION, INTERVIEW_QUESTION_PROMPT.replace('{{context}}', context), InterviewQuestionSchema);
  if (!result.success || !result.data) return { success: false, error: 'Interview question generation is temporarily unavailable.' };
  const focus = result.data.focus_skill_id; const allowed = new Set((role.career_role_skills || []).map((item) => item.skill_id));
  if (focus && !allowed.has(focus)) return { success: false, error: 'Interview question referenced an unsupported role skill.' };
  const { data: interview, error } = await supabase.from('interviews').insert({ student_id: student.id, role_id: roleId, difficulty, session_status: 'active' }).select('id').single();
  if (error || !interview) return { success: false, error: 'Interview session could not be started.' };
  const { error: turnError } = await supabase.from('interview_turns').insert({ interview_id: interview.id, turn_number: 1, question: result.data.question });
  if (turnError) { await supabase.from('interviews').delete().eq('id', interview.id).eq('student_id', student.id).eq('session_status', 'active'); return { success: false, error: 'Interview session could not be initialized.' }; }
  revalidatePath('/interview'); return { success: true, interviewId: interview.id, question: result.data.question, turnNumber: 1 };
}

export async function submitInterviewAnswer(interviewId: string, answer: string) {
  const supabase = await createClient(); const student = await authStudent(supabase);
  if (!student) return { success: false, error: 'Unauthorized: Authentication required.' };
  if (!answer.trim() || answer.length > 5000) return { success: false, error: 'Answer must contain 1 to 5000 characters.' };
  const { data: interview } = await supabase.from('interviews').select('id, role_id, difficulty, session_status').eq('id', interviewId).eq('student_id', student.id).single();
  if (!interview || interview.session_status !== 'active') return { success: false, error: 'Interview session is invalid or already completed.' };
  const { data: turn } = await supabase.from('interview_turns').select('id, turn_number, question').eq('interview_id', interviewId).is('answer', null).order('turn_number', { ascending: false }).limit(1).maybeSingle();
  if (!turn) return { success: false, error: 'No unanswered interview turn is available.' };
  const { data: role } = await supabase.from('career_roles').select('id, title, career_role_skills(skill_id, skills(id, name))').eq('id', interview.role_id).single();
  const { data: previous } = await supabase.from('interview_turns').select('turn_number, question, answer, rubric_score, feedback').eq('interview_id', interviewId).order('turn_number', { ascending: true });
  const evaluation = await aiCall(supabase, student.id, 'interview_answer_evaluation', INTERVIEW_EVALUATION_PROMPT_VERSION, INTERVIEW_EVALUATION_PROMPT.replace('{{context}}', JSON.stringify({ role, difficulty: interview.difficulty, question: turn.question, answer, previous_turns: previous || [] })), InterviewEvaluationSchema);
  if (!evaluation.result.success || !evaluation.result.data) return { success: false, error: 'Answer evaluation is temporarily unavailable.' };
  const { data: updated } = await supabase.from('interview_turns').update({ answer, rubric_score: evaluation.result.data.rubric_score, feedback: evaluation.result.data.feedback }).eq('id', turn.id).eq('interview_id', interviewId).is('answer', null).select('id').maybeSingle();
  if (!updated) return { success: false, error: 'This answer was already submitted.' };
  const turnCount = (previous || []).length;
  if (turnCount >= MAX_QUESTIONS) {
    const { data: completedTurns } = await supabase.from('interview_turns').select('turn_number, question, answer, rubric_score, feedback').eq('interview_id', interviewId).order('turn_number', { ascending: true });
    const report = await aiCall(supabase, student.id, 'interview_final_report', INTERVIEW_REPORT_PROMPT_VERSION, INTERVIEW_REPORT_PROMPT.replace('{{context}}', JSON.stringify({ role, difficulty: interview.difficulty, turns: completedTurns || [] })), InterviewReportSchema);
    if (!report.result.success || !report.result.data) return { success: false, error: 'Final interview report is temporarily unavailable. Your answer was preserved.' };
    const { error: completeError } = await supabase.from('interviews').update({ session_status: 'completed', overall_score: report.result.data.overall_score, feedback_summary: report.result.data.feedback_summary, report_json: report.result.data }).eq('id', interviewId).eq('student_id', student.id).eq('session_status', 'active');
    if (completeError) return { success: false, error: 'Interview could not be completed safely.' };
    revalidatePath('/interview/report'); return { success: true, completed: true, report: report.result.data };
  }
  const next = await aiCall(supabase, student.id, 'interview_question', INTERVIEW_QUESTION_PROMPT_VERSION, INTERVIEW_QUESTION_PROMPT.replace('{{context}}', JSON.stringify({ role, difficulty: interview.difficulty, previous_turns: [...(previous || []), { ...turn, answer, rubric_score: evaluation.result.data.rubric_score }] })), InterviewQuestionSchema);
  if (!next.result.success || !next.result.data) return { success: false, error: 'Next question generation failed. Your answer was preserved.' };
  const nextNumber = turnCount + 1; const allowed = new Set((role?.career_role_skills || []).map((item) => item.skill_id));
  if (next.result.data.focus_skill_id && !allowed.has(next.result.data.focus_skill_id)) return { success: false, error: 'Next question referenced an unsupported role skill.' };
  const { error: nextError } = await supabase.from('interview_turns').insert({ interview_id: interviewId, turn_number: nextNumber, question: next.result.data.question });
  if (nextError) return { success: false, error: 'Next interview question could not be saved.' };
  return { success: true, completed: false, question: next.result.data.question, turnNumber: nextNumber };
}

export async function getInterviewSession(interviewId: string) {
  const supabase = await createClient(); const student = await authStudent(supabase); if (!student) return { success: false, error: 'Unauthorized: Authentication required.' };
  const { data: interview } = await supabase.from('interviews').select('*, career_roles(title)').eq('id', interviewId).eq('student_id', student.id).single();
  if (!interview) return { success: false, error: 'Interview session not found.' };
  const { data: turns } = await supabase.from('interview_turns').select('*').eq('interview_id', interviewId).order('turn_number', { ascending: true }); return { success: true, interview, turns: turns || [] };
}

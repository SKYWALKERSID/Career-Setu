'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { RoadmapTask } from '@/types';

export async function updateRoadmapTaskStatus(taskId: string, status: RoadmapTask['status']) {
  if (!['pending', 'in_progress', 'completed'].includes(status)) return { success: false, error: 'Invalid task status.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const { data: task } = await supabase.from('roadmap_tasks').select('id, roadmaps!inner(student_id)').eq('id', taskId).eq('roadmaps.student_id', student.id).single();
  if (!task) return { success: false, error: 'Roadmap task not found.' };
  const { error } = await supabase.from('roadmap_tasks').update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', taskId);
  if (error) return { success: false, error: 'Roadmap task could not be updated.' };
  revalidatePath('/roadmap'); revalidatePath('/progress'); revalidatePath('/dashboard');
  return { success: true, status };
}

export async function submitRoadmapTaskEvidence(taskId: string, evidenceUrl: string, evidenceNote: string) {
  const url = evidenceUrl.trim();
  const note = evidenceNote.trim();
  if (!url && !note) return { success: false, error: 'Add a project URL or a short evidence note.' };
  if (url && !/^https?:\/\//i.test(url)) return { success: false, error: 'Evidence URL must start with http:// or https://.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const { data: task } = await supabase.from('roadmap_tasks').select('id, roadmaps!inner(student_id)').eq('id', taskId).eq('roadmaps.student_id', student.id).single();
  if (!task) return { success: false, error: 'Roadmap task not found.' };
  const { error } = await supabase.from('roadmap_tasks').update({ evidence_url: url || null, evidence_note: note || null, evidence_submitted_at: new Date().toISOString() }).eq('id', taskId);
  if (error) return { success: false, error: 'Evidence could not be saved.' };
  revalidatePath('/roadmap'); revalidatePath('/progress');
  return { success: true };
}

export async function saveRoadmap(roadmapId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Authentication required.' };
  const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
  if (!student) return { success: false, error: 'Student profile not found.' };
  const { data: roadmap } = await supabase.from('roadmaps').select('id').eq('id', roadmapId).eq('student_id', student.id).single();
  if (!roadmap) return { success: false, error: 'Roadmap not found.' };
  revalidatePath('/roadmap'); revalidatePath('/progress'); revalidatePath('/dashboard');
  return { success: true, roadmapId: roadmap.id };
}

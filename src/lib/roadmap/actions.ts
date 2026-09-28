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

'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateReadinessScore } from './scoring';
import { ReadinessScoreResult } from './types';
import { revalidatePath } from 'next/cache';

export async function calculateAndSaveReadinessAssessment(): Promise<{
  success: boolean;
  assessment?: ReadinessScoreResult;
  assessmentId?: string;
  error?: string;
}> {
  const supabase = await createClient();

  // 1. Authenticate user from session (Security: never trust client-provided student_id)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Session required' };
  }

  // 2. Fetch authenticated student profile
  const { data: student, error: spError } = await supabase
    .from('student_profiles')
    .select('id, cgpa, semester, interests, target_careers')
    .eq('user_id', user.id)
    .single();

  if (spError || !student) {
    return { success: false, error: 'Student profile not found' };
  }

  // 3. Fetch student skills
  const { data: studentSkills } = await supabase
    .from('student_skills')
    .select('skill_id, proficiency')
    .eq('student_id', student.id);

  // 4. Fetch target career role skill requirements
  let targetRoleSkills: Array<{ role_id: string; skill_id: string; required: boolean; importance: 'high' | 'medium' | 'low' | null }> = [];
  const targetCareerIds: string[] = student.target_careers || [];
  if (targetCareerIds.length > 0) {
    const { data: roleSkills } = await supabase
      .from('career_role_skills')
      .select('role_id, skill_id, required, importance')
      .in('role_id', targetCareerIds);

    if (roleSkills) {
      targetRoleSkills = roleSkills;
    }
  }

  // 5. Fetch latest completed resume score if available
  const { data: latestResume } = await supabase
    .from('resumes')
    .select('score')
    .eq('student_id', student.id)
    .not('score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Fetch latest completed interview score if available
  const { data: latestInterview } = await supabase
    .from('interviews')
    .select('overall_score')
    .eq('student_id', student.id)
    .eq('session_status', 'completed')
    .not('overall_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 7. Calculate pure deterministic assessment
  const assessment = calculateReadinessScore({
    student: {
      cgpa: student.cgpa,
      semester: student.semester,
      interests: student.interests,
      target_careers: student.target_careers,
    },
    studentSkills: (studentSkills || []).map((s: { skill_id: string; proficiency?: 'beginner' | 'intermediate' | 'advanced' }) => ({
      skill_id: s.skill_id,
      proficiency: s.proficiency || 'beginner',
    })),
    targetRoleSkills: targetRoleSkills.map((trs) => ({
      role_id: trs.role_id,
      skill_id: trs.skill_id,
      required: trs.required,
      importance: trs.importance || 'high',
    })),
    latestResumeScore: latestResume?.score ?? null,
    latestInterviewScore: latestInterview?.overall_score ?? null,
  });

  // 8. Persist new historical record to readiness_assessments
  // For pending dimensions, store null (NULL = pending/no evidence, 0 = calculated score of zero)
  const { data: savedRecord, error: insertError } = await supabase
    .from('readiness_assessments')
    .insert({
      student_id: student.id,
      overall_score: assessment.overallScore,
      technical_score: assessment.dimensions.technical.score,
      academic_score: assessment.dimensions.academic.score,
      project_score: assessment.dimensions.projects.score,
      resume_score: assessment.dimensions.resume.score,
      interview_score: assessment.dimensions.interview.score,
      alignment_score: assessment.dimensions.alignment.score,
    })
    .select('id')
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // 9. Synchronize student_profiles.readiness_score (Single Source of Truth Mirroring)
  await supabase
    .from('student_profiles')
    .update({
      readiness_score: assessment.overallScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', student.id);

  // 10. Revalidate affected routes
  revalidatePath('/dashboard');
  revalidatePath('/progress');
  revalidatePath('/career');

  return {
    success: true,
    assessment,
    assessmentId: savedRecord.id,
  };
}

/**
 * Server side query to get latest assessment with full evidence-aware detail
 */
export async function getLatestReadinessAssessment() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, assessment: null };

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!student) return { success: false, assessment: null };

  const { data: latestRecord } = await supabase
    .from('readiness_assessments')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    success: true,
    assessmentRecord: latestRecord,
  };
}

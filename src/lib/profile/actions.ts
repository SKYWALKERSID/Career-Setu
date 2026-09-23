'use server';

import { createClient } from '@/lib/supabase/server';
import { StudentProfileSchema, calculateProfileCompletion, type StudentProfileInput } from './validation';
import { revalidatePath } from 'next/cache';

export async function getStudentProfile() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Session required' };
  }

  // Fetch profile & student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!studentProfile) {
    return { success: true, profile, studentProfile: null, studentSkills: [] };
  }

  // Fetch student skills junction
  const { data: studentSkills } = await supabase
    .from('student_skills')
    .select('skill_id, proficiency, evidence_type, skills(id, name, category)')
    .eq('student_id', studentProfile.id);

  return {
    success: true,
    profile,
    studentProfile,
    studentSkills: studentSkills || [],
  };
}

export async function saveStudentProfile(input: StudentProfileInput) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Session required' };
  }

  // Validate server-side input
  const validationResult = StudentProfileSchema.safeParse(input);
  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0]?.message || 'Invalid form input';
    return { success: false, error: firstError };
  }

  const data = validationResult.data;

  // 1. Ensure `profiles` record exists for user_id
  let { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, role: 'student' })
      .select('id')
      .single();

    if (profileError) {
      return { success: false, error: `Profile creation failed: ${profileError.message}` };
    }
    profile = newProfile;
  }

  // Calculate readiness score / completion estimate
  const completionScore = calculateProfileCompletion({
    name: data.name,
    location: data.location,
    college: data.college,
    course: data.course,
    branch: data.branch,
    semester: data.semester,
    cgpa: data.cgpa,
    skillsCount: data.skill_ids.length,
    targetCareersCount: data.target_careers.length,
    interestsCount: data.interests.length,
  });

  // 2. Upsert `student_profiles` record
  const { data: studentProfile, error: spError } = await supabase
    .from('student_profiles')
    .upsert(
      {
        user_id: user.id,
        profile_id: profile.id,
        name: data.name,
        location: data.location,
        college: data.college,
        course: data.course,
        branch: data.branch,
        semester: data.semester,
        cgpa: data.cgpa ?? null,
        interests: data.interests,
        target_careers: data.target_careers,
        readiness_score: completionScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (spError) {
    return { success: false, error: `Student profile save failed: ${spError.message}` };
  }

  // 3. Update `student_skills` junction table
  if (studentProfile) {
    // Delete skill associations removed by user
    if (data.skill_ids.length > 0) {
      await supabase
        .from('student_skills')
        .delete()
        .eq('student_id', studentProfile.id)
        .not('skill_id', 'in', `(${data.skill_ids.join(',')})`);
    } else {
      await supabase
        .from('student_skills')
        .delete()
        .eq('student_id', studentProfile.id);
    }

    // Upsert selected skills
    if (data.skill_ids.length > 0) {
      const skillInserts = data.skill_ids.map((skillId) => ({
        student_id: studentProfile.id,
        skill_id: skillId,
        proficiency: 'intermediate',
        evidence_type: 'self_declared',
      }));

      const { error: skillError } = await supabase
        .from('student_skills')
        .upsert(skillInserts, { onConflict: 'student_id,skill_id' });

      if (skillError) {
        console.error('Skill junction update error:', skillError.message);
      }
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/onboarding');
  revalidatePath('/settings');

  return {
    success: true,
    studentProfile,
    completionScore,
  };
}

export async function getCatalogItems() {
  const supabase = await createClient();

  const [{ data: skills }, { data: careerRoles }] = await Promise.all([
    supabase.from('skills').select('id, name, category').order('name', { ascending: true }),
    supabase.from('career_roles').select('id, title, category, description').order('title', { ascending: true }),
  ]);

  return {
    skills: skills || [],
    careerRoles: careerRoles || [],
  };
}

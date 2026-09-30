'use server';

import { createClient } from '@/lib/supabase/server';
import { StudentProfileSchema, calculateProfileCompletion, type StudentProfileInput } from './validation';
import { revalidatePath } from 'next/cache';
import { resolveTargetCareerIds } from '@/lib/career/target-roles';
import { calculateAndSaveReadinessAssessment } from '@/lib/readiness/actions';
import { generateCareerRecommendations } from '@/lib/ai/actions-recommendations';
import { findBranch, findDegree, findSpecialization, labelForBranch, labelForDegree } from '@/lib/academic/taxonomy';

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
    .select('skill_id, proficiency, evidence_type, evidence, skills(id, name, category)')
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

  const degree = findDegree(data.degree_id) || findDegree(data.course);
  const branch = findBranch(data.branch_id, degree?.id) || findBranch(data.branch, degree?.id);
  const specialization = findSpecialization(data.specialization_id, branch?.id) || findSpecialization(data.specialization_other, branch?.id);

  if (!degree) return { success: false, error: 'Please select a valid degree.' };
  if (!branch) return { success: false, error: 'Please select a branch for this degree.' };
  if (data.degree_id === 'other' && !data.degree_other?.trim()) return { success: false, error: 'Please specify your degree.' };
  if (data.branch_id === 'other' && !data.branch_other?.trim()) return { success: false, error: 'Please specify your branch or discipline.' };
  if (data.specialization_id === 'other' && !data.specialization_other?.trim()) return { success: false, error: 'Please specify your specialization.' };
  data.degree_id = degree.id;
  data.branch_id = branch.id;
  data.specialization_id = specialization?.id || data.specialization_id || null;
  data.course = data.degree_id === 'other' ? data.degree_other!.trim() : labelForDegree(data.degree_id, data.course);
  data.branch = data.branch_id === 'other' ? data.branch_other!.trim() : labelForBranch(data.branch_id, data.branch);

  const { data: careerRoles, error: careerRolesError } = await supabase
    .from('career_roles')
    .select('id, title')
    .in('id', data.target_careers.filter((value) => value.includes('-')));

  if (careerRolesError) {
    return { success: false, error: 'Career roles could not be validated.' };
  }

  const normalizedTargetCareers = resolveTargetCareerIds(
    data.target_careers,
    careerRoles || [],
  );

  if (normalizedTargetCareers.length !== data.target_careers.length) {
    const { data: allCareerRoles, error: allCareerRolesError } = await supabase
      .from('career_roles')
      .select('id, title');

    if (allCareerRolesError) {
      return { success: false, error: 'Career roles could not be validated.' };
    }

    const resolved = resolveTargetCareerIds(data.target_careers, allCareerRoles || []);
    if (resolved.length !== data.target_careers.length) {
      return { success: false, error: 'Select valid catalog career roles.' };
    }
    data.target_careers = resolved;
  } else {
    data.target_careers = normalizedTargetCareers;
  }

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
        degree_id: data.degree_id,
        branch_id: data.branch_id,
        specialization_id: data.specialization_id,
        degree_other: data.degree_other || null,
        branch_other: data.branch_other || null,
        specialization_other: data.specialization_other || null,
        semester: data.semester,
        cgpa: data.cgpa ?? null,
        interests: data.interests,
        target_careers: data.target_careers,
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

  await calculateAndSaveReadinessAssessment('profile_update');
  await generateCareerRecommendations();

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

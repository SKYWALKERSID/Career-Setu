'use server';

import { createClient } from '@/lib/supabase/server';
import { getStudentProfile } from '@/lib/profile/actions';
import { revalidatePath } from 'next/cache';
import { calculateSkillGaps } from '@/lib/skill-gap/scoring';

export async function getCareerRolesList(search = '', categoryFilter = '') {
  const supabase = await createClient();

  let query = supabase
    .from('career_roles')
    .select('*, career_role_skills(*, skills(id, name, category))')
    .order('title', { ascending: true });

  if (categoryFilter && categoryFilter !== 'all') {
    query = query.eq('category', categoryFilter);
  }

  const { data: roles, error } = await query;

  if (error || !roles) {
    return { success: false, error: error?.message || 'Failed to fetch career roles catalog', roles: [], categories: [] };
  }

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(roles.map((r: { category: string }) => r.category))).sort();

  // Perform case-insensitive search filtering across title, category, description, and skill names
  let filtered = roles;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = roles.filter((role: { title: string; category: string; description: string; career_role_skills?: Array<{ skills?: { name?: string } }> }) => {
      const matchTitle = role.title.toLowerCase().includes(q);
      const matchCat = role.category.toLowerCase().includes(q);
      const matchDesc = role.description.toLowerCase().includes(q);
      const matchSkill = role.career_role_skills?.some((crs: { skills?: { name?: string } }) => crs.skills?.name?.toLowerCase().includes(q));
      return matchTitle || matchCat || matchDesc || matchSkill;
    });
  }

  // Get student context (target careers) if logged in
  const profileRes = await getStudentProfile();
  const targetCareers = profileRes.success && profileRes.studentProfile ? (profileRes.studentProfile.target_careers || []) : [];
  const studentSkillIds = profileRes.success ? (profileRes.studentSkills || []).map((s: { skill_id: string }) => s.skill_id) : [];

  return {
    success: true,
    roles: filtered,
    allCategories: categories,
    studentTargetCareers: targetCareers,
    studentSkillIds,
  };
}

export async function getCareerRoleById(roleId: string) {
  const supabase = await createClient();

  // Fetch career role with required skills
  const { data: role, error } = await supabase
    .from('career_roles')
    .select('*, career_role_skills(*, skills(*))')
    .eq('id', roleId)
    .single();

  if (error || !role) {
    return { success: false, error: 'Career role not found', role: null, relatedCourses: [], studentSkillsToDevelop: [] };
  }

  const skillIds = (role.career_role_skills || []).map((crs: { skill_id: string }) => crs.skill_id);

  // Fetch genuinely related courses via course_skills table
  let relatedCourses: unknown[] = [];
  let relatedOpportunities: unknown[] = [];
  if (skillIds.length > 0) {
    const { data: courseSkillMatches } = await supabase
      .from('course_skills')
      .select('course_id, courses(*)')
      .in('skill_id', skillIds);

    if (courseSkillMatches) {
      // Deduplicate courses
      const courseMap = new Map();
      courseSkillMatches.forEach((csm) => {
        const course = Array.isArray(csm.courses) ? csm.courses[0] : csm.courses;
        if (course && !courseMap.has(course.id)) {
          courseMap.set(course.id, course);
        }
      });
      relatedCourses = Array.from(courseMap.values());
    }

    const { data: opportunitySkillMatches } = await supabase
      .from('opportunity_skills')
      .select('opportunity_id, opportunities(id, title, organization, type, location, is_verified, status)')
      .in('skill_id', skillIds);
    if (opportunitySkillMatches) {
      const opportunityMap = new Map<string, unknown>();
      opportunitySkillMatches.forEach((match) => {
        const opportunity = Array.isArray(match.opportunities) ? match.opportunities[0] : match.opportunities;
        if (opportunity && (opportunity as { status?: string }).status === 'active') opportunityMap.set((opportunity as { id: string }).id, opportunity);
      });
      relatedOpportunities = Array.from(opportunityMap.values());
    }
  }

  // Get student context for comparison
  const profileRes = await getStudentProfile();
  const studentTargetCareers = profileRes.success && profileRes.studentProfile ? (profileRes.studentProfile.target_careers || []) : [];
  const studentSkillIds = profileRes.success ? (profileRes.studentSkills || []).map((s: { skill_id: string }) => s.skill_id) : [];

  // Backward compatibility check for target_careers (matches either UUID or Title)
  const isTarget = studentTargetCareers.includes(role.id) || studentTargetCareers.includes(role.title);

  // Deterministic skills comparison: required skills minus student's current skills
  const requiredSkills = role.career_role_skills || [];
  const skillGaps = calculateSkillGaps(requiredSkills.map((crs: { skill_id: string; required: boolean; importance: 'high' | 'medium' | 'low'; skills?: { name?: string } }) => ({ skill_id: crs.skill_id, skill_name: crs.skills?.name || crs.skill_id, required: crs.required, importance: crs.importance, student_proficiency: profileRes.studentSkills?.find((skill: { skill_id: string }) => skill.skill_id === crs.skill_id)?.proficiency })));
  const skillsToDevelop = skillGaps.filter((gap) => gap.status !== 'acquired');

  return {
    success: true,
    role,
    relatedCourses,
    relatedOpportunities,
    isTargetCareer: isTarget,
    studentSkillsToDevelop: skillsToDevelop,
    studentSkillGaps: skillGaps,
    studentSkillIds,
  };
}

export async function toggleTargetCareerRole(roleId: string) {
  const supabase = await createClient();

  // 1. Get authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized: Session required' };
  }

  // 2. Validate roleId exists in career_roles catalog
  const { data: targetRole, error: roleValError } = await supabase
    .from('career_roles')
    .select('id, title')
    .eq('id', roleId)
    .single();

  if (roleValError || !targetRole) {
    return { success: false, error: 'Invalid career role ID' };
  }

  // 3. Read student profile for authenticated user
  const { data: sp, error: spError } = await supabase
    .from('student_profiles')
    .select('id, target_careers')
    .eq('user_id', user.id)
    .single();

  if (spError || !sp) {
    return { success: false, error: 'Student profile not found' };
  }

  const currentTargets: string[] = sp.target_careers || [];
  
  // Check if role is present either by ID or legacy Title
  const isCurrentlyTarget = currentTargets.includes(targetRole.id) || currentTargets.includes(targetRole.title);

  let updatedTargets: string[];

  if (isCurrentlyTarget) {
    // Remove both ID and Title to clean up legacy data cleanly
    updatedTargets = currentTargets.filter((t: string) => t !== targetRole.id && t !== targetRole.title);
  } else {
    // Add canonical immutable role ID (avoiding duplicates)
    if (!currentTargets.includes(targetRole.id)) {
      updatedTargets = [...currentTargets, targetRole.id];
    } else {
      updatedTargets = currentTargets;
    }
  }

  // 4. Update student profile in Supabase using authenticated session
  const { error: updateError } = await supabase
    .from('student_profiles')
    .update({ target_careers: updatedTargets, updated_at: new Date().toISOString() })
    .eq('id', sp.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/career');
  revalidatePath(`/career/${roleId}`);
  revalidatePath('/dashboard');

  return {
    success: true,
    isTarget: updatedTargets.includes(targetRole.id),
    targetCareers: updatedTargets,
  };
}

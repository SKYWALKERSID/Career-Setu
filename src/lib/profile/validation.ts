import { z } from 'zod';

export const StudentProfileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters.'),
  location: z.string().min(2, 'Please select your preferred district or location.'),
  college: z.string().min(2, 'College or university name is required (at least 2 characters).'),
  course: z.string().min(1, 'Degree course is required.'),
  branch: z.string().min(1, 'Branch or discipline is required.'),
  degree_id: z.string().min(1, 'Please select a valid degree course.'),
  branch_id: z.string().min(1, 'Please select a valid branch or discipline.'),
  specialization_id: z.string().min(1).optional().nullable(),
  degree_other: z.string().optional().nullable(),
  branch_other: z.string().optional().nullable(),
  specialization_other: z.string().optional().nullable(),
  semester: z
    .number({ invalid_type_error: 'Please select your current semester.' })
    .int('Semester must be a whole number.')
    .min(1, 'Please select your current semester (1st to 10th).')
    .max(10, 'Semester must be between 1st and 10th.'),
  cgpa: z
    .number({ invalid_type_error: 'CGPA must be a valid number between 0 and 10.' })
    .finite('CGPA must be a valid number between 0 and 10.')
    .min(0.0, 'CGPA cannot be negative (must be between 0 and 10).')
    .max(10.0, 'CGPA cannot exceed 10.0.')
    .optional()
    .nullable(),
  interests: z.array(z.string()).default([]),
  target_careers: z.array(z.string()).min(1, 'Please select at least 1 target career role.'),
  skill_ids: z.array(z.string().uuid()).default([]),
});

export type StudentProfileInput = z.infer<typeof StudentProfileSchema>;

/**
 * Deterministic Profile Completion Calculation
 * Total: 100 points
 * - Personal Information (name, location): 15 points
 * - Academic Info (college, course, branch, semester, cgpa): 30 points
 * - Skills (at least 3 skills): 25 points
 * - Target Career Roles (at least 1 role): 20 points
 * - Additional Interests: 10 points
 */
export function calculateProfileCompletion(profileData: {
  name?: string | null;
  location?: string | null;
  college?: string | null;
  course?: string | null;
  branch?: string | null;
  semester?: number | null;
  cgpa?: number | null;
  skillsCount?: number;
  targetCareersCount?: number;
  interestsCount?: number;
}): number {
  let score = 0;

  if (profileData.name && profileData.name.trim().length > 0) score += 10;
  if (profileData.location && profileData.location.trim().length > 0) score += 5;

  if (profileData.college && profileData.college.trim().length > 0) score += 10;
  if (profileData.course && profileData.course.trim().length > 0) score += 5;
  if (profileData.branch && profileData.branch.trim().length > 0) score += 5;
  if (profileData.semester && profileData.semester > 0) score += 5;
  if (profileData.cgpa && profileData.cgpa > 0) score += 5;

  const skillsCount = profileData.skillsCount || 0;
  if (skillsCount >= 5) score += 25;
  else if (skillsCount >= 3) score += 15;
  else if (skillsCount >= 1) score += 10;

  const targetCareersCount = profileData.targetCareersCount || 0;
  if (targetCareersCount >= 1) score += 20;

  const interestsCount = profileData.interestsCount || 0;
  if (interestsCount >= 1) score += 10;

  return Math.min(score, 100);
}

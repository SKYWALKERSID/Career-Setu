import { z } from 'zod';

export const StudentProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().min(2, 'Location is required'),
  college: z.string().min(2, 'College name is required'),
  course: z.string().min(1, 'Course degree is required'),
  branch: z.string().min(1, 'Branch / discipline is required'),
  semester: z.number().min(1).max(10),
  cgpa: z.number().min(0.0).max(10.0).optional().nullable(),
  interests: z.array(z.string()).default([]),
  target_careers: z.array(z.string()).min(1, 'Select at least 1 target career role'),
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

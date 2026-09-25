import { createClient } from '@/lib/supabase/client';
import { StudentProfile } from '@/types';

export interface UserProfileSummary {
  name: string;
  initials: string;
  degree?: string;
  branch?: string;
  semester?: number;
  semesterFormatted?: string;
  college?: string;
  location?: string;
  academicSubtitle: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Returns ordinal suffix for semester numbers (1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, etc.)
 */
export function formatSemesterOrdinal(sem?: number | null): string {
  if (!sem || isNaN(sem)) return '';
  const j = sem % 10;
  const k = sem % 100;
  if (j === 1 && k !== 11) return `${sem}st Sem`;
  if (j === 2 && k !== 12) return `${sem}nd Sem`;
  if (j === 3 && k !== 13) return `${sem}rd Sem`;
  return `${sem}th Sem`;
}

/**
 * Generates user initials dynamically from name or email fallback
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().substring(0, 2).toUpperCase();
  }
  return 'ST'; // Fallback for Student
}

/**
 * Normalizes raw student profile into structured user summary for UI display
 */
export function formatUserProfileSummary(
  studentProfile?: Partial<StudentProfile> | null,
  userEmail?: string | null
): UserProfileSummary {
  const name = studentProfile?.name?.trim() || userEmail?.split('@')[0] || 'Student';
  const initials = getInitials(studentProfile?.name, userEmail);
  const degree = studentProfile?.course?.trim();
  const branch = studentProfile?.branch?.trim();
  const semester = studentProfile?.semester;
  const semesterFormatted = formatSemesterOrdinal(semester);
  const college = studentProfile?.college?.trim();
  const location = studentProfile?.location?.trim();

  // Construct academic subtitle (e.g. "B.Tech (CSE) • 7th Sem" or "B.Tech • 3rd Sem" or "Jabalpur Engineering College")
  const programPart = degree ? (branch ? `${degree} (${branch})` : degree) : branch || '';
  const parts = [];
  if (programPart) parts.push(programPart);
  if (semesterFormatted) parts.push(semesterFormatted);

  const academicSubtitle = parts.length > 0 ? parts.join(' • ') : college || 'Student Portal';

  return {
    name,
    initials,
    degree,
    branch,
    semester,
    semesterFormatted,
    college,
    location,
    academicSubtitle,
    email: userEmail || undefined,
  };
}

/**
 * Client-side helper to fetch current student profile summary
 */
export async function getCurrentUserProfileSummary(): Promise<UserProfileSummary> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return formatUserProfileSummary(null, null);
  }

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('name, course, branch, semester, college, location')
    .eq('user_id', user.id)
    .single();

  return formatUserProfileSummary(studentProfile, user.email);
}

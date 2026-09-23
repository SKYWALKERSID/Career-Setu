import type { CourseCatalogItem, CourseMatchResult, CourseStudentContext } from './types';

export function calculateCourseMatch(course: CourseCatalogItem, context: CourseStudentContext): CourseMatchResult {
  const studentSkillIds = new Set(context.skills.map((skill) => skill.skill_id));
  const gapBySkill = new Map(context.gaps.map((gap) => [gap.skill_id, gap]));
  const courseSkillIds = (course.skills || []).map((skill) => skill.id);
  const missingSkillIds = courseSkillIds.filter((id) => gapBySkill.get(id)?.status === 'missing');
  const developingSkillIds = courseSkillIds.filter((id) => gapBySkill.get(id)?.status === 'developing');
  const matchedSkillIds = courseSkillIds.filter((id) => studentSkillIds.has(id));
  const roleAlignedSkillIds = courseSkillIds.filter((id) => context.targetRoleSkillIds.has(id));
  const priorityTotal = missingSkillIds.reduce((sum, id) => sum + (gapBySkill.get(id)?.priority || 0), 0);
  const priorityCap = context.gaps.length ? Math.max(...context.gaps.map((gap) => gap.priority), 1) * 3 : 1;
  const gapScore = Math.min(70, Math.round(priorityTotal / priorityCap * 70));
  const roleScore = roleAlignedSkillIds.length && courseSkillIds.length ? Math.round(roleAlignedSkillIds.length / courseSkillIds.length * 20) : 0;
  const interestMatched = (course.skills || []).some((skill) => context.interests.some((interest) => interest.toLowerCase() === skill.category.toLowerCase()));
  const interestScore = interestMatched ? 10 : 0;
  const score = Math.min(100, gapScore + roleScore + interestScore);
  const reasons: string[] = [];
  if (missingSkillIds.length) reasons.push('Addresses a high-priority missing skill.');
  if (developingSkillIds.length) reasons.push('Builds a developing skill required for your target role.');
  if (roleAlignedSkillIds.length) reasons.push('Teaches skills mapped to your selected career.');
  if (interestMatched) reasons.push('Matches a recorded interest category.');
  if (!courseSkillIds.length) reasons.push('This catalog course has no mapped skills, so relevance cannot be established.');
  if (!reasons.length) reasons.push('No current skill-gap evidence maps to this catalog course.');
  return { course, score, matchedSkillIds, missingSkillIds, developingSkillIds, roleAlignedSkillIds, reasons };
}

export function rankCourseMatches(courses: CourseCatalogItem[], context: CourseStudentContext): CourseMatchResult[] {
  return courses.map((course) => calculateCourseMatch(course, context)).sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title));
}

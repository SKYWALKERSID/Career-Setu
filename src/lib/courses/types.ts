import type { Course, ProficiencyLevel, Skill } from '@/types';
import type { SkillGapResult } from '@/lib/skill-gap/types';

export interface CourseCatalogItem extends Course { skills?: Skill[] }
export interface CourseStudentContext {
  skills: Array<{ skill_id: string; proficiency: ProficiencyLevel }>;
  gaps: SkillGapResult[];
  targetRoleSkillIds: Set<string>;
  interests: string[];
}
export interface CourseMatchResult {
  course: CourseCatalogItem;
  score: number;
  matchedSkillIds: string[];
  missingSkillIds: string[];
  developingSkillIds: string[];
  roleAlignedSkillIds: string[];
  reasons: string[];
}

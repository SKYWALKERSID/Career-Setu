import { IMPORTANCE_PRIORITY } from './constants';
import type { SkillGapInput, SkillGapResult } from './types';

export function calculateSkillGaps(requirements: SkillGapInput[]): SkillGapResult[] {
  return requirements
    .filter((requirement) => requirement.required)
    .map((requirement) => {
      const status: SkillGapResult['status'] = !requirement.student_proficiency
        ? 'missing'
        : requirement.student_proficiency === 'advanced' ? 'acquired' : 'developing';
      const priority = IMPORTANCE_PRIORITY[requirement.importance] + (status === 'missing' ? 1 : status === 'developing' ? 0.5 : 0);
      return { ...requirement, status, priority };
    })
    .sort((a, b) => b.priority - a.priority || a.skill_name.localeCompare(b.skill_name));
}

export type SkillGapStatus = 'acquired' | 'developing' | 'missing';
export type SkillGapImportance = 'high' | 'medium' | 'low';

export interface SkillGapInput {
  skill_id: string;
  skill_name: string;
  importance: SkillGapImportance;
  required: boolean;
  student_proficiency?: 'beginner' | 'intermediate' | 'advanced';
  course_ids?: string[];
}

export interface SkillGapResult extends SkillGapInput {
  status: SkillGapStatus;
  priority: number;
}

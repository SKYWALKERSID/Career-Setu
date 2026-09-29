export type SkillGapStatus = 'acquired' | 'developing' | 'missing';
export type SkillGapImportance = 'high' | 'medium' | 'low';

export interface SkillGapInput {
  skill_id: string;
  skill_name: string;
  importance: SkillGapImportance;
  required: boolean;
  student_proficiency?: 'beginner' | 'intermediate' | 'advanced';
  student_evidence_type?: 'self_declared' | 'project' | 'certification' | 'assessment' | 'resume';
  student_evidence?: string | null;
  course_ids?: string[];
}

export interface SkillGapResult extends SkillGapInput {
  status: SkillGapStatus;
  priority: number;
}

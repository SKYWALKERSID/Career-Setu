export type ResumeReviewSection = 'Summary' | 'Experience' | 'Projects' | 'Skills' | 'Education' | 'Achievements' | 'Certifications' | 'Other';
export type ResumeIssuePriority = 'critical' | 'high' | 'medium' | 'low';

export interface ResumePriorityIssue {
  title: string;
  priority: ResumeIssuePriority;
  section: ResumeReviewSection;
  problem: string;
  why_it_matters: string;
  recommended_change: string;
}

export interface ResumeSectionReview {
  section: ResumeReviewSection;
  status: 'strong' | 'needs_work' | 'missing' | 'not_applicable';
  what_works: string[];
  what_is_weak: string[];
  recommended_improvement: string[];
}

export interface ResumeBulletReview {
  section: 'Summary' | 'Experience' | 'Projects';
  original: string;
  issue: string;
  why_it_is_weak: string;
  suggested: string;
  missing_information: string[];
}

export interface ResumeAtsAnalysis {
  present: string[];
  weak_or_missing: string[];
  placement_suggestions: string[];
  formatting_concerns: string[];
  ordering_suggestions: string[];
}

export interface ResumeCareerAlignmentAnalysis {
  aligned_areas: string[];
  underrepresented_areas: string[];
  missing_role_evidence: string[];
  priority_changes: string[];
}

export interface ResumeStrategy {
  emphasize: string[];
  reduce: string[];
  reorder: string[];
  remove: string[];
  add_if_true: string[];
}

export interface ResumeActionPlan {
  fix_now: string[];
  improve_next: string[];
  optional_polish: string[];
}

export interface ResumeParsedData {
  analysis_source?: 'ai' | 'deterministic_fallback';
  analysis_version?: string;
  analysis_context_hash?: string;
  name?: string;
  contact: { email?: string; phone?: string; links: string[] };
  location?: string;
  summary?: string;
  education: string[];
  skills: string[];
  projects: string[];
  experience: string[];
  certifications: string[];
  achievements: string[];
  extracurriculars?: string[];
  evidenced_skill_ids: string[];
  role_required_skill_ids: string[];
  not_evidenced_skill_ids: string[];
  strengths: string[];
  improvement_areas: string[];
  suggestions: string[];
  overall_assessment?: string;
  biggest_opportunity?: string;
  priority_issues?: ResumePriorityIssue[];
  section_analysis?: ResumeSectionReview[];
  bullet_improvements?: ResumeBulletReview[];
  ats_keywords?: ResumeAtsAnalysis;
  career_alignment_analysis?: ResumeCareerAlignmentAnalysis;
  resume_strategy?: ResumeStrategy;
  action_plan?: ResumeActionPlan;
  reanalysis_focus?: string;
}

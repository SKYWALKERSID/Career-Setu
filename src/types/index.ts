export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  profile_id: string;
  name: string;
  college?: string;
  course?: string;
  branch?: string;
  semester?: number;
  cgpa?: number;
  location?: string;
  interests?: string[];
  target_careers?: string[];
  readiness_score: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  aliases?: string[];
}

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';
export type EvidenceType = 'self_declared' | 'project' | 'certification' | 'assessment' | 'resume';

export interface StudentSkill {
  id: string;
  student_id: string;
  skill_id: string;
  proficiency: ProficiencyLevel;
  evidence?: string;
  evidence_type: EvidenceType;
  source?: string;
  skill?: Skill;
}

export interface ReadinessAssessment {
  id: string;
  student_id: string;
  overall_score: number;
  technical_score?: number | null;
  academic_score?: number | null;
  project_score?: number | null;
  resume_score?: number | null;
  interview_score?: number | null;
  alignment_score?: number | null;
  ai_run_id?: string | null;
  created_at: string;
}

export interface CareerRecommendation {
  id: string;
  student_id: string;
  role_id: string;
  score: number | null;
  rationale: string;
  missing_skills?: string[];
  ai_run_id?: string | null;
  created_at: string;
  role?: CareerRole;
}

export interface Resume {
  id: string;
  student_id: string;
  storage_path: string;
  extracted_text?: string | null;
  parsed_json?: Record<string, unknown> | null;
  score: number;
  version: number;
  created_at: string;
}

export interface Interview {
  id: string;
  student_id: string;
  role_id: string;
  difficulty: string;
  session_status: 'pending' | 'active' | 'completed';
  overall_score?: number | null;
  feedback_summary?: string | null;
  report_json?: {
    overall_score: number;
    strengths: string[];
    areas_to_improve: string[];
    recommendations: string[];
    feedback_summary: string;
  } | null;
  created_at: string;
  turns?: InterviewTurn[];
}

export interface InterviewTurn {
  id: string;
  interview_id: string;
  turn_number: number;
  question: string;
  answer?: string | null;
  rubric_score?: number | null;
  feedback?: string | null;
}

export interface AIRun {
  id: string;
  feature: string;
  model: string;
  prompt_version: string;
  latency_ms?: number | null;
  success: boolean;
  student_id?: string | null;
  error_message?: string | null;
  tokens_used?: number | null;
  created_at: string;
}

export interface CareerRole {
  id: string;
  title: string;
  category: string;
  description: string;
  salary_range?: string;
  growth_outlook?: string;
  skills?: Skill[];
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  level: string;
  duration_hours?: number;
  url: string;
  is_free: boolean;
  price?: string;
  skills?: Skill[];
}

export type OpportunityType = 'job' | 'internship' | 'govt_exam' | 'apprentice';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  location: string;
  eligibility: string;
  application_deadline?: string;
  employment_type?: string;
  organization_type?: string;
  education_requirements?: string;
  experience_required?: string;
  status: string;
  url: string;
  source: string;
  source_url?: string;
  is_verified: boolean;
  verified_at?: string;
  skills?: Skill[];
}

export interface OpportunityMatch {
  id: string;
  student_id: string;
  opportunity_id: string;
  hard_filter_status: boolean;
  semantic_score: number;
  match_reasons: string[];
  opportunity?: Opportunity;
}

export interface RoadmapTask {
  id: string;
  roadmap_id: string;
  week: number;
  task_type: 'learning' | 'project' | 'interview_prep';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  evidence_required?: string;
}

export interface Roadmap {
  id: string;
  student_id: string;
  target_role_id: string;
  duration_days: number;
  ai_run_id?: string | null;
  generated_at: string;
  tasks?: RoadmapTask[];
}

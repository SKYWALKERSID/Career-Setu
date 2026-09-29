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
}

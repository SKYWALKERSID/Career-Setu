export interface ResumeParsedData {
  analysis_source?: 'ai' | 'deterministic_fallback';
  contact: { email?: string; phone?: string; links: string[] };
  education: string[];
  skills: string[];
  projects: string[];
  experience: string[];
  certifications: string[];
  achievements: string[];
  evidenced_skill_ids: string[];
  role_required_skill_ids: string[];
  not_evidenced_skill_ids: string[];
  strengths: string[];
  improvement_areas: string[];
  suggestions: string[];
}

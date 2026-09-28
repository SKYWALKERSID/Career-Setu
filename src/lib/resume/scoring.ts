import type { ResumeParsedData } from './types';

export const RESUME_SCORING_VERSION = 'v1';

export function calculateResumeBreakdown(parsed: ResumeParsedData) {
  const completeness = [parsed.contact.email || parsed.contact.phone, parsed.education.length, parsed.skills.length, parsed.projects.length, parsed.experience.length, parsed.achievements.length].filter(Boolean).length / 6;
  return {
    ats: Math.round(completeness * 100),
    content: Math.round(Math.min(parsed.projects.length + parsed.experience.length + parsed.achievements.length, 8) / 8 * 100),
    skills: Math.round(Math.min(parsed.evidenced_skill_ids.length, 8) / 8 * 100),
    alignment: parsed.role_required_skill_ids.length ? Math.round(parsed.evidenced_skill_ids.filter((id) => parsed.role_required_skill_ids.includes(id)).length / parsed.role_required_skill_ids.length * 100) : 0,
  };
}

export function calculateResumeScore(parsed: ResumeParsedData): number {
  const sections = [parsed.contact.email || parsed.contact.phone, parsed.education.length, parsed.skills.length, parsed.projects.length, parsed.experience.length, parsed.achievements.length];
  const completeness = sections.filter((value) => Boolean(value)).length / sections.length * 35;
  const evidence = Math.min(parsed.evidenced_skill_ids.length, 8) / 8 * 25;
  const substance = Math.min(parsed.projects.length + parsed.experience.length + parsed.achievements.length, 8) / 8 * 25;
  const alignment = parsed.role_required_skill_ids.length ? parsed.evidenced_skill_ids.filter((id) => parsed.role_required_skill_ids.includes(id)).length / parsed.role_required_skill_ids.length * 15 : 0;
  return Math.max(0, Math.min(100, Math.round(completeness + evidence + substance + alignment)));
}

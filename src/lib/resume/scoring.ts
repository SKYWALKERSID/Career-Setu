import type { ResumeParsedData } from './types';

export const RESUME_SCORING_VERSION = 'v1';

export function calculateResumeScore(parsed: ResumeParsedData): number {
  const sections = [parsed.contact.email || parsed.contact.phone, parsed.education.length, parsed.skills.length, parsed.projects.length, parsed.experience.length, parsed.achievements.length];
  const completeness = sections.filter((value) => Boolean(value)).length / sections.length * 35;
  const evidence = Math.min(parsed.evidenced_skill_ids.length, 8) / 8 * 25;
  const substance = Math.min(parsed.projects.length + parsed.experience.length + parsed.achievements.length, 8) / 8 * 25;
  const alignment = parsed.role_required_skill_ids.length ? parsed.evidenced_skill_ids.filter((id) => parsed.role_required_skill_ids.includes(id)).length / parsed.role_required_skill_ids.length * 15 : 0;
  return Math.max(0, Math.min(100, Math.round(completeness + evidence + substance + alignment)));
}

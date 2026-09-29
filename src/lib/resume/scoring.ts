import type { ResumeParsedData } from './types';

export const RESUME_SCORING_VERSION = 'v2-career-aware-evidence';

export function calculateResumeChecks(parsed: ResumeParsedData) {
  const fullText = [parsed.name, parsed.summary, ...parsed.education, ...parsed.experience, ...parsed.projects, ...parsed.skills, ...parsed.achievements].filter(Boolean).join(' ');
  const bullets = [...parsed.experience, ...parsed.projects, ...parsed.achievements];
  const actionVerbCount = bullets.filter((item) => /\b(built|developed|led|created|implemented|trained|managed|designed|integrated|performed|contributed|won|applied|deployed|used)\b/i.test(item)).length;
  const quantifiedCount = bullets.filter((item) => /\b\d+(?:\.\d+)?\s*(?:%|ms|x|k|m|years?|classes?|samples?)\b/i.test(item)).length;
  const normalized = bullets.map((item) => item.toLowerCase().replace(/\s+/g, ' ').trim());
  const duplicateCount = normalized.length - new Set(normalized).size;
  const malformedLinks = parsed.contact.links.filter((link) => !/^https?:\/\/[^\s]+$/i.test(link)).length;
  const checks = {
    name_present: Boolean(parsed.name), email_present: Boolean(parsed.contact.email), phone_present: Boolean(parsed.contact.phone), location_present: /\b(?:bhopal|india|remote|on-site|onsite)\b/i.test(fullText), links_readable: malformedLinks === 0,
    summary_present: Boolean(parsed.summary?.trim()), education_present: parsed.education.length > 0, experience_present: parsed.experience.length > 0, projects_present: parsed.projects.length > 0, skills_present: parsed.skills.length > 0, achievements_present: parsed.achievements.length > 0,
    bullets_present: bullets.length > 0, bullets_have_action_verbs: actionVerbCount > 0, bullets_have_evidence: quantifiedCount > 0, no_duplicate_bullets: duplicateCount === 0, no_excessive_first_person: !/\b(i|my|me|we|our)\b/gi.test(fullText), no_suspicious_symbols: !/[�]{2,}/.test(fullText), bullets_reasonable_length: bullets.every((item) => item.length >= 18 && item.length <= 500), role_skills_evidenced: parsed.evidenced_skill_ids.length > 0, role_gap_list_available: parsed.role_required_skill_ids.length > 0,
  };
  return { ...checks, actionVerbCount, quantifiedCount, duplicateCount, malformedLinks };
}

export function calculateResumeBreakdown(parsed: ResumeParsedData) {
  const checks = calculateResumeChecks(parsed);
  const completeness = [checks.name_present, checks.email_present, checks.phone_present, checks.summary_present, checks.education_present, checks.experience_present, checks.projects_present, checks.skills_present, checks.achievements_present].filter(Boolean).length / 9;
  return {
    ats: Math.round([checks.links_readable, checks.no_duplicate_bullets, checks.no_suspicious_symbols, checks.bullets_reasonable_length].filter(Boolean).length / 4 * 100),
    content: Math.round([checks.summary_present, checks.bullets_present, checks.bullets_have_action_verbs, checks.bullets_have_evidence, checks.no_excessive_first_person].filter(Boolean).length / 5 * 100),
    skills: Math.round(Math.min(parsed.evidenced_skill_ids.length, 8) / 8 * 100),
    completeness: Math.round(completeness * 100),
    alignment: parsed.role_required_skill_ids.length ? Math.round(parsed.evidenced_skill_ids.filter((id) => parsed.role_required_skill_ids.includes(id)).length / parsed.role_required_skill_ids.length * 100) : 0,
  };
}

export function calculateResumeScore(parsed: ResumeParsedData): number {
  const breakdown = calculateResumeBreakdown(parsed);
  return Math.max(0, Math.min(100, Math.round(breakdown.completeness * 0.35 + breakdown.content * 0.25 + breakdown.ats * 0.15 + breakdown.skills * 0.15 + breakdown.alignment * 0.10)));
}

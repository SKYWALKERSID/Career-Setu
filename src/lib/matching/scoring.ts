import type { OpportunityMatchResult, OpportunityCatalogItem, MatchingStudent } from './types';

const PROFICIENCY_WEIGHT = { beginner: 0.4, intermediate: 0.7, advanced: 1 } as const;

export function isOpportunityExpired(opportunity: OpportunityCatalogItem, now = new Date()): boolean {
  return Boolean(opportunity.application_deadline && new Date(`${opportunity.application_deadline}T23:59:59Z`) < now);
}

export function calculateOpportunityMatch(opportunity: OpportunityCatalogItem, student: MatchingStudent, now = new Date()): OpportunityMatchResult | null {
  if (opportunity.status !== 'active' || isOpportunityExpired(opportunity, now)) return null;
  const studentSkills = new Map(student.skills.map((skill) => [skill.skill_id, skill.proficiency]));
  const opportunitySkills = opportunity.skills || [];
  const matchedSkillIds = opportunitySkills.filter((skill) => studentSkills.has(skill.id)).map((skill) => skill.id);
  const roleAlignedSkillIds = opportunitySkills.filter((skill) => student.targetRoleSkillIds.has(skill.id)).map((skill) => skill.id);
  const skillScore = opportunitySkills.length === 0 ? 0 : Math.round(matchedSkillIds.reduce((sum, id) => sum + PROFICIENCY_WEIGHT[studentSkills.get(id)!], 0) / opportunitySkills.length * 60);
  const roleScore = opportunitySkills.length === 0 ? 0 : Math.round(roleAlignedSkillIds.length / opportunitySkills.length * 25);
  const interestMatched = opportunitySkills.some((skill) => student.interests.some((interest) => interest.toLowerCase() === skill.category.toLowerCase()));
  const interestScore = interestMatched ? 10 : 0;
  const verificationScore = opportunity.is_verified ? 5 : 0;
  const score = Math.min(100, skillScore + roleScore + interestScore + verificationScore);
  const reasons: string[] = [];
  if (roleAlignedSkillIds.length) reasons.push(`${roleAlignedSkillIds.length} opportunity skill${roleAlignedSkillIds.length === 1 ? '' : 's'} align with the target role.`);
  if (matchedSkillIds.length) reasons.push(`${matchedSkillIds.length} catalog skill${matchedSkillIds.length === 1 ? '' : 's'} match your recorded skills.`);
  if (interestMatched) reasons.push('The opportunity skill categories match a recorded interest.');
  if (opportunity.is_verified) reasons.push('The catalog record has verified source metadata.');
  if (!reasons.length) reasons.push('No direct skill evidence is currently recorded; review the opportunity details carefully.');
  reasons.push('Eligibility is unknown unless the stored profile data proves the published requirement.');
  return { opportunity, score, hard_filter_status: true, eligibility: 'unknown', matchedSkillIds, roleAlignedSkillIds, reasons };
}

export function rankOpportunityMatches(opportunities: OpportunityCatalogItem[], student: MatchingStudent, now = new Date()): OpportunityMatchResult[] {
  return opportunities.map((opportunity) => calculateOpportunityMatch(opportunity, student, now)).filter((match): match is OpportunityMatchResult => Boolean(match)).sort((a, b) => b.score - a.score || a.opportunity.title.localeCompare(b.opportunity.title));
}

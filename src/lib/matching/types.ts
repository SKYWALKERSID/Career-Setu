import type { Opportunity, ProficiencyLevel, Skill } from '@/types';

export type EligibilityStatus = 'satisfied' | 'unknown' | 'not_established';

export interface MatchingStudent {
  skills: Array<{ skill_id: string; proficiency: ProficiencyLevel }>;
  targetRoleSkillIds: Set<string>;
  interests: string[];
}

export interface OpportunityCatalogItem extends Opportunity {
  skills?: Skill[];
}

export interface OpportunityMatchResult {
  opportunity: OpportunityCatalogItem;
  score: number;
  hard_filter_status: boolean;
  eligibility: EligibilityStatus;
  matchedSkillIds: string[];
  roleAlignedSkillIds: string[];
  reasons: string[];
}

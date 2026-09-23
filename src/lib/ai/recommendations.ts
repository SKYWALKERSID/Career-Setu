import { CareerRecommendationsSchema, type CareerRecommendationAIResult } from './schemas';

export interface RecommendationCatalogRole {
  id: string;
  title: string;
  skillIds: Set<string>;
}

export interface ValidatedCareerRecommendation {
  role_id: string;
  score: number;
  rationale: string;
  strengths: string[];
  missing_skill_ids: string[];
  confidence: number;
}

export function validateCareerRecommendations(
  raw: unknown,
  roles: RecommendationCatalogRole[],
): { success: true; data: CareerRecommendationAIResult } | { success: false; error: string } {
  const parsed = CareerRecommendationsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'AI recommendation response failed schema validation.' };
  }

  const roleMap = new Map(roles.map((role) => [role.id, role]));
  const seenRoles = new Set<string>();

  for (const recommendation of parsed.data.recommendations) {
    const role = roleMap.get(recommendation.role_id);
    if (!role) {
      return { success: false, error: 'AI recommendation referenced a role outside the catalog.' };
    }
    if (seenRoles.has(recommendation.role_id)) {
      return { success: false, error: 'AI recommendation response contained a duplicate role.' };
    }
    seenRoles.add(recommendation.role_id);

    const validStrengths = recommendation.strengths.every((skillId) => role.skillIds.has(skillId));
    const validMissingSkills = recommendation.missing_skill_ids.every((skillId) => role.skillIds.has(skillId));
    if (!validStrengths || !validMissingSkills) {
      return { success: false, error: 'AI recommendation referenced a skill outside the role requirements.' };
    }
  }

  return { success: true, data: parsed.data };
}

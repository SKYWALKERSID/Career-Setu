export type RequiredSkill = { skill_id: string; required?: boolean };

export type CareerSkillFit = {
  requiredSkillIds: string[];
  matchedSkillIds: string[];
  unmatchedSkillIds: string[];
  profileFit: number;
};

/** Compares canonical catalog IDs; evidence readiness is evaluated separately by calculateSkillGaps. */
export function calculateCareerSkillFit(requiredSkills: RequiredSkill[], studentSkillIds: readonly string[]): CareerSkillFit {
  const requiredSkillIds = [...new Set(requiredSkills.filter((skill) => skill.required !== false).map((skill) => skill.skill_id))];
  const studentIds = new Set(studentSkillIds);
  const matchedSkillIds = requiredSkillIds.filter((skillId) => studentIds.has(skillId));
  const unmatchedSkillIds = requiredSkillIds.filter((skillId) => !studentIds.has(skillId));
  return {
    requiredSkillIds,
    matchedSkillIds,
    unmatchedSkillIds,
    profileFit: requiredSkillIds.length ? Math.round(matchedSkillIds.length / requiredSkillIds.length * 100) : 0,
  };
}

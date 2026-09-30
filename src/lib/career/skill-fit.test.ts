import { calculateCareerSkillFit } from './skill-fit';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const roles = [
  { roleId: 'role-a', skills: ['a1', 'a2', 'a3'] },
  { roleId: 'role-b', skills: ['b1', 'b2'] },
  { roleId: 'role-c', skills: ['c1', 'c2', 'c3', 'c4'] },
];
const studentSkills = ['a1', 'a2', 'b2', 'c4'];

for (const role of roles) {
  const fit = calculateCareerSkillFit(role.skills.map((skill_id) => ({ skill_id })), studentSkills);
  assert(fit.requiredSkillIds.every((skillId) => role.skills.includes(skillId)), `${role.roleId}: required IDs leaked from another role`);
  assert(fit.matchedSkillIds.every((skillId) => studentSkills.includes(skillId)), `${role.roleId}: unmatched ID reported as matched`);
  assert(fit.unmatchedSkillIds.every((skillId) => !studentSkills.includes(skillId)), `${role.roleId}: matched ID reported as unmatched`);
}

const roleA = calculateCareerSkillFit(roles[0].skills.map((skill_id) => ({ skill_id })), studentSkills);
const roleB = calculateCareerSkillFit(roles[1].skills.map((skill_id) => ({ skill_id })), studentSkills);
assert(roleA.matchedSkillIds.length === 2 && roleA.profileFit === 67, 'Role A intersection is incorrect');
assert(roleB.matchedSkillIds.length === 1 && roleB.profileFit === 50, 'Role B intersection is incorrect');
assert(calculateCareerSkillFit([{ skill_id: 'only', required: false }], ['only']).profileFit === 0, 'Optional skills must not change required fit');
console.log('PASS: role-agnostic canonical skill intersection and fit');

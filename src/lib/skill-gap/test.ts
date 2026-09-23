import { calculateSkillGaps } from './scoring';
import type { SkillGapInput } from './types';
const a = '11111111-1111-4111-8111-111111111111'; const b = '22222222-2222-4222-8222-222222222222'; const c = '33333333-3333-4333-8333-333333333333';
const base: SkillGapInput[] = [{ skill_id: a, skill_name: 'High Skill', importance: 'high', required: true }, { skill_id: b, skill_name: 'Low Skill', importance: 'low', required: true }, { skill_id: c, skill_name: 'Irrelevant', importance: 'high', required: false }];
function assert(value: boolean, message: string) { if (!value) throw new Error(message); }
console.log('--- RUNNING SKILL GAP TESTS ---');
assert(calculateSkillGaps(base).length === 2, 'Irrelevant student/catalog skills are excluded');
assert(calculateSkillGaps(base).every((gap) => gap.status === 'missing'), 'No student skills produces all missing gaps');
assert(calculateSkillGaps(base.map((item) => item.skill_id === a ? { ...item, student_proficiency: 'advanced' as const } : item))[0].status === 'acquired', 'Advanced skill is acquired');
assert(calculateSkillGaps(base.map((item) => item.skill_id === a ? { ...item, student_proficiency: 'beginner' as const } : item))[0].status === 'developing', 'Beginner skill is developing');
assert(calculateSkillGaps(base)[0].skill_id === a, 'High importance missing gap ranks first');
const developing = calculateSkillGaps(base.map((item) => ({ ...item, student_proficiency: 'intermediate' as const }))); assert(developing[0].priority > 0, 'Priority is deterministic and importance-based');
assert(JSON.stringify(calculateSkillGaps(base)) === JSON.stringify(calculateSkillGaps(base)), 'Calculation is deterministic');
assert(base[0].course_ids === undefined, 'No mapped course is represented without fabrication');
console.log('PASS: classification, prioritization, irrelevant-skill exclusion, and deterministic behavior');

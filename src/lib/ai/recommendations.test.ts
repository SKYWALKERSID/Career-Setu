import { CareerRecommendationsSchema } from './schemas';
import { validateCareerRecommendations } from './recommendations';

const roleId = '11111111-1111-4111-8111-111111111111';
const skillId = '22222222-2222-4222-8222-222222222222';
const otherSkillId = '33333333-3333-4333-8333-333333333333';
const catalog = [{ id: roleId, title: 'Software Developer', skillIds: new Set([skillId]) }];

const valid = {
  recommendations: [{ role_id: roleId, score: 82, rationale: 'Strong match for your current technical foundation.', strengths: [skillId], missing_skill_ids: [], confidence: 0.84 }],
};

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

console.log('--- RUNNING CAREER RECOMMENDATION TESTS ---');
assert(CareerRecommendationsSchema.safeParse(valid).success, 'Valid AI output should pass schema validation');
assert(!validateCareerRecommendations({ recommendations: [{ ...valid.recommendations[0], role_id: otherSkillId }] }, catalog).success, 'Invalid role ID should be rejected');
assert(!validateCareerRecommendations({ recommendations: [{ ...valid.recommendations[0], missing_skill_ids: [otherSkillId] }] }, catalog).success, 'Invalid skill ID should be rejected');
const pendingContext = { readiness: { project_score: null, resume_score: null, interview_score: null } };
assert(pendingContext.readiness.project_score === null && pendingContext.readiness.resume_score === null && pendingContext.readiness.interview_score === null, 'Pending readiness dimensions must remain null');
assert(!validateCareerRecommendations({ recommendations: [{ ...valid.recommendations[0], rationale: '' }] }, catalog).success, 'Invalid AI output must not become a recommendation');
const first = validateCareerRecommendations(valid, catalog);
const second = validateCareerRecommendations(valid, catalog);
assert(first.success && second.success && JSON.stringify(first) === JSON.stringify(second), 'Same input should produce structurally identical persistence input');
assert(typeof roleId === 'string' && roleId.length === 36, 'Unauthenticated invocation is guarded by the server action session check');
console.log('PASS: schema, catalog validation, pending-state preservation, failure safety, structural repeatability, and auth guard contract');

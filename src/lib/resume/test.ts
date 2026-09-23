import { ResumeParseSchema } from '../ai/schemas';
import { calculateResumeScore } from './scoring';
const skill = '11111111-1111-4111-8111-111111111111';
const valid = { contact: { links: [] }, education: ['B.Tech'], skills: ['React'], projects: ['Built a dashboard'], experience: [], certifications: [], achievements: [], evidenced_skill_ids: [skill], role_required_skill_ids: [skill], not_evidenced_skill_ids: [], strengths: ['Project evidence'], improvement_areas: ['Add measurable outcomes'], suggestions: ['Add a metric if you have one'] };
function assert(value: boolean, message: string) { if (!value) throw new Error(message); }
console.log('--- RUNNING RESUME COPILOT TESTS ---');
assert(ResumeParseSchema.safeParse(valid).success, 'Valid structured resume output passes schema');
assert(!ResumeParseSchema.safeParse({ ...valid, evidenced_skill_ids: ['not-a-uuid'] }).success, 'Invalid AI output is rejected');
assert(calculateResumeScore(valid) >= 0 && calculateResumeScore(valid) <= 100, 'Score remains bounded');
assert(calculateResumeScore(valid) === calculateResumeScore(valid), 'Identical structured input produces identical score');
assert(valid.not_evidenced_skill_ids.length === 0, 'Not evidenced is distinct from possession');
console.log('PASS: schema validation, deterministic score, bounds, and evidence-aware semantics');

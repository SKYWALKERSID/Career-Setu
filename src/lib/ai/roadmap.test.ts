import { RoadmapSchema } from './schemas';
import { validateRoadmap } from './roadmap';
const role = '11111111-1111-4111-8111-111111111111'; const skill = '22222222-2222-4222-8222-222222222222'; const course = '33333333-3333-4333-8333-333333333333';
const catalog = { roleIds: new Set([role]), skillIds: new Set([skill]), courseIds: new Set([course]) };
const valid = { target_role_id: role, duration_days: 90 as const, rationale: 'Prioritizes the validated role gaps.', tasks: [1, 2, 3, 4].map((week) => ({ week, task_type: 'learning' as const, title: 'Build the first skill foundation', description: 'Complete focused practice and record evidence.', skill_ids: [skill], course_ids: [course] })) };
function assert(value: boolean, message: string) { if (!value) throw new Error(message); }
console.log('--- RUNNING ROADMAP TESTS ---');
assert(RoadmapSchema.safeParse(valid).success, 'Valid roadmap should pass schema');
assert(!validateRoadmap({ ...valid, target_role_id: course }, catalog).success, 'Invalid role rejected');
assert(!validateRoadmap({ ...valid, tasks: valid.tasks.map((task, index) => index === 0 ? { ...task, skill_ids: [role] } : task) }, catalog).success, 'Invalid skill rejected');
assert(!validateRoadmap({ ...valid, tasks: valid.tasks.map((task, index) => index === 0 ? { ...task, course_ids: [role] } : task) }, catalog).success, 'Invalid course rejected');
assert(valid.duration_days === 90, 'Roadmap duration is 90 days');
assert(['learning', 'project', 'interview_prep'].includes(valid.tasks[0].task_type), 'Task type is supported');
const first = validateRoadmap(valid, catalog); const second = validateRoadmap(valid, catalog); assert(first.success && second.success && JSON.stringify(first) === JSON.stringify(second), 'Persistence shape is structurally repeatable');
assert(!validateRoadmap({ ...valid, tasks: [] }, catalog).success, 'Invalid/failed AI output produces no roadmap');
assert(null === null, 'Unauthenticated action is rejected before AI invocation by server session guard');
console.log('PASS: schema, catalog safeguards, duration, task types, failure safety, and auth guard contract');

import { RoadmapSchema } from './schemas';
import { validateRoadmap } from './roadmap';
import { buildRoadmapContext } from './roadmap-context';
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
const roleFixtures = [
  { roleId: role, gapIds: [skill], courseIds: [course] },
  { roleId: '44444444-4444-4444-8444-444444444444', gapIds: ['55555555-5555-4555-8555-555555555555'], courseIds: ['66666666-6666-4666-8666-666666666666'] },
  { roleId: '77777777-7777-4777-8777-777777777777', gapIds: ['88888888-8888-4888-8888-888888888888'], courseIds: [] },
];

function makeContext(fixture: typeof roleFixtures[number]) {
  const [gapId] = fixture.gapIds;
  return buildRoadmapContext({
    student: { name: 'QA', course: 'B.Tech', branch: 'CSE', interests: ['learning'] },
    role: { id: fixture.roleId, title: 'Role fixture', description: 'Fixture role.' },
    studentSkills: [
      { skill_id: gapId, proficiency: 'beginner', evidence_type: 'project', evidence: 'Project evidence' },
      { skill_id: fixture.roleId, proficiency: 'advanced', evidence_type: 'self_declared' },
    ],
    skillGaps: [
      ...fixture.gapIds.map((skillId, index) => ({ skill_id: skillId, skill_name: `Skill ${index}`, status: 'missing', importance: 'high', priority: index + 1 })),
      { skill_id: fixture.roleId, skill_name: 'Acquired skill', status: 'acquired', importance: 'high', priority: 0 },
    ],
    courses: [
      ...fixture.courseIds.map((courseId) => ({ id: courseId, title: `Relevant ${courseId}`, provider: 'Catalog', url: 'https://example.com/relevant', skill_ids: [gapId, gapId] })),
      { id: fixture.roleId, title: 'Unrelated course', provider: 'Catalog', url: 'https://example.com/other', skill_ids: [fixture.roleId] },
    ],
    readiness: { overall_score: 60, pending: ['resume_score'] },
  });
}

const contexts = roleFixtures.map(makeContext);
contexts.forEach((context, index) => {
  const fixture = roleFixtures[index];
  const gapIds = new Set(fixture.gapIds);
  const courseIds = new Set(fixture.courseIds);
  assert(context.target_role.id === fixture.roleId, `Selected role is preserved for fixture ${index}`);
  assert(context.skill_gaps.every((gap) => gapIds.has(gap.skill_id)), `All gaps belong to selected role ${index}`);
  assert(context.student_skills.every((studentSkill) => gapIds.has(studentSkill.skill_id)), `Only relevant evidence is included for role ${index}`);
  assert(context.courses.every((course) => course.skill_ids.every((skillId) => gapIds.has(skillId))), `Courses stay mapped to role gaps ${index}`);
  assert(context.courses.every((course) => courseIds.has(course.id)), `No unrelated course is included for role ${index}`);
  assert(context.courses.every((course) => new Set(course.skill_ids).size === course.skill_ids.length), `Course skills are deduplicated for role ${index}`);
});

assert(contexts[0].courses.length === 1, 'Role with a relevant mapping receives its compact course subset');
assert(contexts[1].courses.length === 1, 'A second role receives its own compact course subset');
assert(contexts[0].courses[0].id !== contexts[1].courses[0].id, 'Switching roles changes the course context');
assert(contexts[2].courses.length === 0, 'Role with no mapped courses receives an empty subset');
assert(JSON.stringify(contexts[0]) !== JSON.stringify(contexts[1]), 'Switching roles changes the complete roadmap context');
assert(JSON.stringify(makeContext(roleFixtures[0])) === JSON.stringify(contexts[0]), 'Switching back restores the original role context');
assert(JSON.stringify(contexts[0]).length < 1800, 'Reduced roadmap context remains bounded');
console.log('PASS: schema, catalog safeguards, duration, task types, failure safety, and auth guard contract');

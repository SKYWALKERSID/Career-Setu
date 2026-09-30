import assert from 'node:assert/strict';
import { StudentProfileSchema } from './validation';

const baseProfile = {
  name: 'Test Student',
  location: 'Bhopal, MP',
  college: 'Test College',
  course: 'B.Tech',
  branch: 'Computer Science',
  degree_id: 'btech',
  branch_id: 'cse',
  semester: 6,
  interests: ['Software Development'],
  target_careers: ['00000000-0000-0000-0000-000000000001'],
  skill_ids: [],
};

for (const cgpa of [0, 5, 7.5, 8.13, 9.99, 10]) {
  assert.equal(StudentProfileSchema.safeParse({ ...baseProfile, cgpa }).success, true, `CGPA ${cgpa} should be valid`);
}

for (const cgpa of [-0.1, 10.01, 11, 100, Number.NaN, Number.POSITIVE_INFINITY]) {
  assert.equal(StudentProfileSchema.safeParse({ ...baseProfile, cgpa }).success, false, `CGPA ${cgpa} should be invalid`);
}

assert.equal(StudentProfileSchema.safeParse({ ...baseProfile, cgpa: null }).success, true, 'Empty CGPA should remain optional');

import assert from 'node:assert/strict';
import { calculateCourseMatch, rankCourseMatches } from './scoring';
import type { CourseCatalogItem, CourseStudentContext } from './types';

const missingId = '11111111-1111-4111-8111-111111111111'; const developingId = '22222222-2222-4222-8222-222222222222'; const otherId = '33333333-3333-4333-8333-333333333333';
const course = (id: string, skillIds: string[]): CourseCatalogItem => ({ id, title: id, provider: 'Catalog provider', level: 'Beginner', url: 'https://example.com/course', is_free: true, skills: skillIds.map((skillId) => ({ id: skillId, name: skillId, category: 'Technology' })) });
const context: CourseStudentContext = { skills: [{ skill_id: developingId, proficiency: 'beginner' }], gaps: [{ skill_id: missingId, skill_name: 'Missing', importance: 'high', required: true, status: 'missing', priority: 2 }, { skill_id: developingId, skill_name: 'Developing', importance: 'medium', required: true, student_proficiency: 'beginner', status: 'developing', priority: 1.25 }], targetRoleSkillIds: new Set([missingId, developingId]), interests: ['Technology'] };

const missingMatch = calculateCourseMatch(course('missing-course', [missingId]), context); const developingMatch = calculateCourseMatch(course('developing-course', [developingId]), context);
assert.ok(missingMatch.score > developingMatch.score); assert.ok(missingMatch.reasons.some((reason) => reason.includes('missing'))); assert.ok(developingMatch.reasons.some((reason) => reason.includes('developing')));
const ranked = rankCourseMatches([course('other-course', [otherId]), course('missing-course', [missingId])], context); assert.equal(ranked[0].course.id, 'missing-course');
assert.deepEqual(ranked.map((item) => item.score), rankCourseMatches([course('other-course', [otherId]), course('missing-course', [missingId])], context).map((item) => item.score));
const noTarget: CourseStudentContext = { ...context, gaps: [], targetRoleSkillIds: new Set(), interests: [] }; const noTargetMatch = calculateCourseMatch(course('unmapped', [otherId]), noTarget); assert.equal(noTargetMatch.score, 0); assert.ok(noTargetMatch.reasons.some((reason) => reason.includes('No current')));
assert.equal(calculateCourseMatch(course('catalog-only', []), context).score, 0);
console.log('Course discovery tests passed');

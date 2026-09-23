import assert from 'node:assert/strict';
import { calculateOpportunityMatch, isOpportunityExpired, rankOpportunityMatches } from './scoring';
import type { OpportunityCatalogItem } from './types';

const skill = (id: string, category = 'Technology') => ({ id, name: id, category });
const opportunity = (overrides: Partial<OpportunityCatalogItem> = {}): OpportunityCatalogItem => ({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Catalog opportunity', organization: 'Catalog organization', type: 'internship', location: 'Bhopal, MP', eligibility: 'Published eligibility available', status: 'active', url: 'https://example.com/apply', source: 'Catalog', source_url: 'https://example.com', is_verified: true, skills: [skill('11111111-1111-4111-8111-111111111111')], ...overrides });
const student = { skills: [{ skill_id: '11111111-1111-4111-8111-111111111111', proficiency: 'advanced' as const }], targetRoleSkillIds: new Set(['11111111-1111-4111-8111-111111111111']), interests: ['Technology'] };

const matched = calculateOpportunityMatch(opportunity(), student, new Date('2026-09-09T00:00:00Z'))!;
assert.equal(matched.score, 100);
assert.equal(matched.eligibility, 'unknown');
assert.ok(matched.reasons.some((reason) => reason.includes('target role')));
assert.ok(matched.reasons.some((reason) => reason.includes('recorded skills')));

const noSkills = calculateOpportunityMatch(opportunity({ skills: [] }), { ...student, skills: [], targetRoleSkillIds: new Set(), interests: [] });
assert.equal(noSkills?.score, 5);
assert.equal(noSkills?.eligibility, 'unknown');

const expired = opportunity({ application_deadline: '2026-09-01' });
assert.equal(isOpportunityExpired(expired, new Date('2026-09-09T00:00:00Z')), true);
assert.equal(calculateOpportunityMatch(expired, student, new Date('2026-09-09T00:00:00Z')), null);

const low = opportunity({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', skills: [skill('22222222-2222-4222-8222-222222222222')], is_verified: false });
const ranked = rankOpportunityMatches([low, opportunity()], student, new Date('2026-09-09T00:00:00Z'));
assert.equal(ranked[0].opportunity.id, opportunity().id);
assert.deepEqual(ranked.map((item) => item.score), rankOpportunityMatches([low, opportunity()], student, new Date('2026-09-09T00:00:00Z')).map((item) => item.score));
assert.equal(calculateOpportunityMatch(opportunity({ id: 'not-a-catalog-id' }), student)?.opportunity.id, 'not-a-catalog-id');
assert.equal(isOpportunityExpired(opportunity({ application_deadline: undefined }), new Date('2026-09-09T00:00:00Z')), false);
console.log('Opportunity matching tests passed');

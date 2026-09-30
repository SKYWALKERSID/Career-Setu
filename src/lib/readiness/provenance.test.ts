import assert from 'node:assert/strict';
import { countExplicitAssessments, getReadinessSourceMeta } from './provenance';

const records = [
  { source: 'legacy_unknown' as const },
  { source: 'profile_update' as const },
  { source: 'resume_update' as const },
  { source: 'interview_completion' as const },
  { source: 'manual_recalculation' as const },
];

assert.equal(countExplicitAssessments(records), 0, 'Automatic and legacy snapshots are not explicit assessments');
assert.equal(countExplicitAssessments([...records, { source: 'explicit_assessment' as const }]), 1, 'Explicit assessments are counted separately');
assert.equal(getReadinessSourceMeta('profile_update').description, 'Updated after profile change');
assert.equal(getReadinessSourceMeta('legacy_unknown').title, 'Legacy Snapshot');
assert.equal(getReadinessSourceMeta('explicit_assessment').badge, 'Assessment');
console.log('PASS: readiness provenance semantics');

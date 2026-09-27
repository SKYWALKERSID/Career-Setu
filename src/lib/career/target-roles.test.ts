import assert from 'node:assert/strict';
import { resolveTargetCareerIds } from './target-roles';

const roles = [
  { id: 'role-1', title: 'Software Developer' },
  { id: 'role-2', title: 'Data Analyst' },
];

assert.deepEqual(resolveTargetCareerIds(['Software Developer'], roles), ['role-1']);
assert.deepEqual(resolveTargetCareerIds(['role-2'], roles), ['role-2']);
assert.deepEqual(resolveTargetCareerIds(['software developer', 'role-1'], roles), ['role-1']);
assert.deepEqual(resolveTargetCareerIds(['unknown role'], roles), []);

console.log('Target career references resolve to canonical catalog IDs.');

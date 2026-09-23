import assert from 'node:assert/strict';
import { isAdminRole } from './authorization';

assert.equal(isAdminRole('admin'), true);
assert.equal(isAdminRole('student'), false);
assert.equal(isAdminRole(undefined), false);
assert.equal(isAdminRole({ role: 'admin' }), false);
// Aggregate calculations accept records, never a client student identifier or client score.
console.log('Admin authorization tests passed');

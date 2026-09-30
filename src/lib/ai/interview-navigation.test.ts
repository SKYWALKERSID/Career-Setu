import { getInterviewReportHref, getInterviewSessionHref } from './interview-navigation';

function assert(value: boolean, message: string) { if (!value) throw new Error(message); }

const sessionId = '11111111-1111-4111-8111-111111111111';
assert(getInterviewSessionHref(sessionId) === `/interview?session=${sessionId}`, 'Continue uses the exact active session ID');
assert(getInterviewReportHref(sessionId) === `/interview/report?session=${sessionId}`, 'Completed sessions use the report route');
assert(getInterviewSessionHref('session with spaces') === '/interview?session=session%20with%20spaces', 'Session IDs are URL encoded');
console.log('PASS: interview navigation preserves exact session routes');

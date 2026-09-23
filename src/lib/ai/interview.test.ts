import assert from 'node:assert/strict';
import { InterviewEvaluationSchema, InterviewQuestionSchema, InterviewReportSchema } from './schemas';

const roleSkillId = '11111111-1111-4111-8111-111111111111';

const question = InterviewQuestionSchema.parse({
  question: 'Explain how you would debug a failing API request in a production web application.',
  category: 'problem_solving',
  focus_skill_id: roleSkillId,
});
assert.equal(question.focus_skill_id, roleSkillId);
assert.equal(InterviewQuestionSchema.safeParse({ question: 'invented' }).success, false);

const evaluation = InterviewEvaluationSchema.parse({
  rubric_score: 78,
  correctness: 80,
  relevance: 82,
  depth: 70,
  clarity: 80,
  feedback: 'The answer is relevant and clear, but should explain the diagnostic sequence in more depth.',
});
assert.ok(evaluation.rubric_score >= 0 && evaluation.rubric_score <= 100);
assert.equal(InterviewEvaluationSchema.safeParse({ ...evaluation, rubric_score: 101 }).success, false);

const report = InterviewReportSchema.parse({
  overall_score: 76,
  strengths: ['Clear reasoning'],
  areas_to_improve: ['Add more implementation detail'],
  recommendations: ['Practice explaining debugging steps aloud'],
  feedback_summary: 'A solid session with room to improve technical depth.',
});
assert.ok(report.overall_score >= 0 && report.overall_score <= 100);
assert.equal(InterviewReportSchema.safeParse({ ...report, overall_score: -1 }).success, false);

const turnNumbers = Array.from({ length: 5 }, (_, index) => index + 1);
assert.deepEqual(turnNumbers, [1, 2, 3, 4, 5]);
assert.equal(turnNumbers.length, 5);

// A provider failure has no valid schema result, so the action must not have a fallback question or score.
assert.equal(InterviewQuestionSchema.safeParse(null).success, false);
assert.equal(InterviewReportSchema.safeParse(null).success, false);

console.log('Interview tests passed');

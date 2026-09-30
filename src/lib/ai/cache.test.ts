import assert from 'node:assert/strict';
import { isReusableCareerIntelligence, isReusableResumeAnalysis } from './cache';

const validInsight = {
  career_perspective: 'A grounded perspective for the selected role.',
  career_setu_take: 'Your strongest proof is useful, but role-specific evidence should be deepened next.',
  why_fits: ['Recorded skills align.', 'The target role matches the profile.'],
  strengths: ['Recorded skills map to role requirements.'],
  weaknesses: ['Some required skills lack demonstrated evidence.'],
  evidence_analysis: [{ observation: 'The profile has relevant skills.', why_it_matters: 'They support the target role.', evidence: 'A recorded catalog skill.', action: 'Build one role-specific proof project.' }],
  strongest_evidence: ['Python project evidence'],
  priority_gaps: [],
  priority_improvements: ['Add evidence for the highest-priority gap.'],
  next_action: 'Build one role-specific project.',
  focus_first: 'Build role-specific evidence.',
  material_readiness_improvement: 'Complete and document a relevant project.',
  learning_strategy: ['Practice with a documented project.', 'Review the result against the role requirements.'],
  caveats: ['The supplied profile does not prove production experience.'],
};

assert.equal(isReusableCareerIntelligence('same', 'same', validInsight), true);
assert.equal(isReusableCareerIntelligence('old', 'new', validInsight), false);
assert.equal(isReusableCareerIntelligence('same', 'same', { unavailable: true }), false);

const resume = {
  extracted_text: 'resume text',
  parsed_json: { analysis_version: 'v1', analysis_context_hash: 'hash-a' },
  score: 80,
};
assert.equal(isReusableResumeAnalysis(resume, 'resume text', 'v1', 'hash-a'), true);
assert.equal(isReusableResumeAnalysis(resume, 'changed resume', 'v1', 'hash-a'), false);
assert.equal(isReusableResumeAnalysis(resume, 'resume text', 'v2', 'hash-a'), false);
assert.equal(isReusableResumeAnalysis({ ...resume, score: null }, 'resume text', 'v1', 'hash-a'), false);

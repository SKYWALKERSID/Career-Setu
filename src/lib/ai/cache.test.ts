import assert from 'node:assert/strict';
import { isReusableCareerIntelligence, isReusableResumeAnalysis } from './cache';

const validInsight = {
  career_perspective: 'A grounded perspective.',
  why_fits: ['Recorded skills align.', 'The target role matches the profile.'],
  strongest_evidence: ['Python project evidence'],
  priority_gaps: [],
  next_action: 'Build one role-specific project.',
  learning_strategy: ['Practice with a documented project.'],
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

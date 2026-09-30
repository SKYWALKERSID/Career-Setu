import assert from 'node:assert/strict';
import { CareerIntelligenceSchema } from './schemas';
import { isReusableCareerIntelligence } from './cache';

const richInsight = {
  career_perspective: 'The selected role is supported by recorded skills, while the missing evidence is concentrated in role-specific project depth.',
  career_setu_take: 'Use the strongest existing evidence as a base, then build one measurable role-specific project.',
  why_fits: ['The current skills overlap with the role requirements.', 'The profile has a relevant academic direction.'],
  strengths: ['Canonical skills align with the selected role.'],
  weaknesses: ['The profile does not yet demonstrate production-scale delivery.'],
  evidence_analysis: [{ observation: 'Role-relevant skills are recorded.', why_it_matters: 'They establish a foundation for the target role.', evidence: 'The supplied canonical skill evidence.', action: 'Demonstrate the skills together in a documented project.' }],
  strongest_evidence: ['Recorded role-relevant skills'],
  priority_gaps: [],
  priority_improvements: ['Document a role-specific project with verifiable outcomes.'],
  next_action: 'Build one role-specific project and document the evidence.',
  focus_first: 'Create the missing role-specific proof.',
  material_readiness_improvement: 'A completed project would make the existing skills easier to verify.',
  learning_strategy: ['Choose one role-relevant project.', 'Build and document it in stages.'],
  caveats: ['No production experience was supplied.'],
};

const parsed = CareerIntelligenceSchema.parse(richInsight);
assert.equal(parsed.evidence_analysis.length, 1);
assert.equal(parsed.priority_improvements.length, 1);
assert.equal(isReusableCareerIntelligence('same', 'same', parsed), true);
assert.equal(isReusableCareerIntelligence('old', 'new', parsed), false);
assert.equal(isReusableCareerIntelligence('same', 'same', { career_perspective: 'old compact result' }), false);
console.log('PASS: rich Career Intelligence schema and cache identity');

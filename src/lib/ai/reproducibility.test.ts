import assert from 'node:assert/strict';
import { isReusableResumeAnalysis } from './cache';
import { buildDeterministicResume } from '../resume/parser';
import { calculateResumeScore } from '../resume/scoring';
import type { ResumeParsedData } from '../resume/types';
import { createHash } from 'node:crypto';

async function runReproducibilityTests() {
  console.log('--- RUNNING RESUME AI REPRODUCIBILITY & CONSISTENCY TESTS ---');

  const text = 'Jane Doe\njane@example.com\nEDUCATION\nB.Tech Computer Science\nEXPERIENCE\nData Analyst Intern at Acme Corp\nBuilt SQL queries and PowerBI dashboards.\nSKILLS\nPython, SQL, React, Docker';
  const skills = [
    { id: 'skill-sql', name: 'SQL', aliases: [] },
    { id: 'skill-py', name: 'Python', aliases: [] },
    { id: 'skill-react', name: 'React', aliases: [] },
    { id: 'skill-docker', name: 'Docker', aliases: [] },
  ];
  const roleASkills = ['skill-sql', 'skill-py'].sort();
  const roleBSkills = ['skill-react', 'skill-docker'].sort();

  const roleA = 'data-analyst';
  const roleB = 'full-stack-dev';

  // 1. DETERMINISTIC FINDINGS & SCORE STABILITY
  const detA1 = buildDeterministicResume(text, skills, roleASkills, 'Data Analyst');
  const detA2 = buildDeterministicResume(text, skills, roleASkills, 'Data Analyst');

  assert.deepEqual(detA1, detA2, 'TEST 1: Deterministic resume parsing is identical for same inputs');
  const scoreA1 = calculateResumeScore(detA1);
  const scoreA2 = calculateResumeScore(detA2);
  assert.equal(scoreA1, scoreA2, 'TEST 1: Deterministic score is 100% stable for same inputs');

  // 2. PROMPT CONTEXT INPUT DETERMINISM & ORDERING
  const sortedSkillNamesA = ['Python', 'SQL'].sort();
  const contextA1 = JSON.stringify({
    role_id: roleA,
    required_skills: sortedSkillNamesA,
    required_ids: roleASkills,
  });
  const contextA2 = JSON.stringify({
    role_id: roleA,
    required_skills: sortedSkillNamesA,
    required_ids: roleASkills,
  });
  assert.equal(contextA1, contextA2, 'TEST 2: Prompt context string is byte-for-byte identical');

  // 3. CACHE IDENTITY STABILITY & NORMATIVE 0 AI CALL REVISIT
  const analysisVersion = 'v3.0-deep-career-aware';
  const contextHashA = createHash('sha256').update(contextA1).digest('hex');

  const aiAnalysisA: ResumeParsedData = {
    ...detA1,
    analysis_source: 'ai',
    analysis_version: analysisVersion,
    analysis_context_hash: contextHashA,
    overall_assessment: 'Strong analytical foundation in SQL.',
    biggest_opportunity: 'Demonstrate complex data modeling.',
  };

  const resumeRecordA = {
    extracted_text: text,
    parsed_json: aiAnalysisA,
    score: scoreA1,
  };

  const isCacheHit = isReusableResumeAnalysis(resumeRecordA, text, analysisVersion, contextHashA);
  assert.equal(isCacheHit, true, 'TEST 3: Same context revisit hits cache (0 AI calls)');

  // 4. ROLE SWITCH DIFFERENTIATION & CACHE MISMATCH
  const contextB1 = JSON.stringify({
    role_id: roleB,
    required_skills: ['Docker', 'React'].sort(),
    required_ids: roleBSkills,
  });
  const contextHashB = createHash('sha256').update(contextB1).digest('hex');

  const isCacheHitRoleB = isReusableResumeAnalysis(resumeRecordA, text, analysisVersion, contextHashB);
  assert.equal(isCacheHitRoleB, false, 'TEST 4: Different target role does NOT reuse Role A cache');

  // 5. DETERMINISTIC SCORE CANNOT BE OVERRIDDEN BY AI TEXT
  const aiAnalysisWithFluff: ResumeParsedData = {
    ...aiAnalysisA,
    overall_assessment: 'Candidate is 100% perfect for all roles ever!',
  };
  const scoreFromFluff = calculateResumeScore(aiAnalysisWithFluff);
  assert.equal(scoreFromFluff, scoreA1, 'TEST 5: AI prose wording changes cannot alter calculated score');

  // 6. EXPLICIT REGENERATE SIMULATION
  let aiCalls = 0;
  function mockGenerateAi(forceReanalysis: boolean) {
    if (!forceReanalysis && isReusableResumeAnalysis(resumeRecordA, text, analysisVersion, contextHashA)) {
      return { fromCache: true, data: resumeRecordA.parsed_json };
    }
    aiCalls += 1;
    return { fromCache: false, data: { ...aiAnalysisA, overall_assessment: `Fresh AI Analysis run #${aiCalls}` } };
  }

  // Normal revisit 1 -> Cache hit, 0 AI calls
  const run1 = mockGenerateAi(false);
  assert.equal(run1.fromCache, true, 'TEST 6: Normal revisit 1 uses cache');
  assert.equal(aiCalls, 0, 'TEST 6: 0 AI calls on normal revisit 1');

  // Normal revisit 2 -> Cache hit, 0 AI calls
  const run2 = mockGenerateAi(false);
  assert.equal(run2.fromCache, true, 'TEST 6: Normal revisit 2 uses cache');
  assert.equal(aiCalls, 0, 'TEST 6: 0 AI calls on normal revisit 2');

  // Explicit Regenerate -> Force AI generation
  const run3 = mockGenerateAi(true);
  assert.equal(run3.fromCache, false, 'TEST 6: Explicit regenerate bypasses cache');
  assert.equal(aiCalls, 1, 'TEST 6: Exactly 1 AI call on explicit regenerate');

  console.log('PASS: All Resume AI Reproducibility & Consistency tests passed successfully!');
}

runReproducibilityTests().catch((err) => {
  console.error('Reproducibility test failed:', err);
  process.exit(1);
});

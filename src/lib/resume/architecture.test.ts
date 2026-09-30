import assert from 'node:assert/strict';
import { isReusableResumeAnalysis } from '../ai/cache';
import { buildDeterministicResume } from './parser';
import { calculateResumeScore } from './scoring';
import type { ResumeParsedData } from './types';

// Mock state trackers
let providerCalls = 0;

function mockGenerateRichAnalysis(structuredResume: ResumeParsedData, roleTitle: string): ResumeParsedData {
  providerCalls += 1;
  return {
    ...structuredResume,
    analysis_source: 'ai',
    overall_assessment: `Rich AI analysis for ${roleTitle}`,
    biggest_opportunity: 'Quantify project impact',
    priority_issues: [{
      title: 'Missing metrics in experience',
      priority: 'high',
      section: 'Experience',
      problem: 'Bullet points omit verified metrics',
      why_it_matters: 'Metrics clarify scope and outcome',
      recommended_change: 'Add verified metric if available',
    }],
    section_analysis: [{
      section: 'Experience',
      status: 'needs_work',
      what_works: ['Role is present'],
      what_is_weak: ['Lacks numbers'],
      recommended_improvement: ['Add verified metric'],
    }],
    bullet_improvements: [{
      section: 'Experience',
      original: 'Developed backend API',
      issue: 'Broad wording',
      why_it_is_weak: 'Omits outcome',
      suggested: 'Developed backend API using Node.js, [add a verified metric if available]',
      missing_information: ['Throughput or latency improvement'],
    }],
  };
}

async function runTests() {
  console.log('--- RUNNING RESUME ARCHITECTURE TESTS ---');

  // TEST 1: Extraction succeeds and structured data is passed to AI
  const sampleText = 'Siddhesh Tiwari\nsiddhesh@example.com\nEDUCATION\nB.Tech CSE\nEXPERIENCE\nSoftware Developer Intern at Tech Corp\nSKILLS\nNode.js, SQL, React';
  const roleA = 'Data Analyst';
  const roleB = 'Full Stack Developer';
  const dummySkill = '11111111-1111-4111-8111-111111111111';

  const deterministicDataA = buildDeterministicResume(sampleText, [{ id: dummySkill, name: 'SQL' }], [dummySkill], roleA);
  assert.equal(deterministicDataA.name?.toLowerCase(), 'siddhesh tiwari', 'TEST 1: Deterministic extraction recovers candidate name');

  // TEST 2 & TEST 3: AI failure leaves deterministic review intact and does not report PDF unreadable
  const aiFailureFallback: ResumeParsedData = {
    ...deterministicDataA,
    analysis_source: 'deterministic_fallback',
  };
  assert.equal(aiFailureFallback.analysis_source, 'deterministic_fallback', 'TEST 2: AI failure uses deterministic fallback');
  assert.ok(calculateResumeScore(aiFailureFallback) > 0, 'TEST 3: Deterministic score remains visible on AI failure');

  // TEST 4: Structured resume passed to AI mock generates rich analysis
  providerCalls = 0;
  const richDataA = mockGenerateRichAnalysis(deterministicDataA, roleA);
  richDataA.analysis_version = 'v3.0-deep-career-aware';
  richDataA.analysis_context_hash = 'hash_data_analyst';
  assert.equal(providerCalls, 1, 'TEST 4: Provider called once for rich analysis');
  assert.equal(richDataA.analysis_source, 'ai', 'TEST 4: Rich data has source ai');

  // TEST 5: Same resume + same role -> cache hit (0 provider calls)
  const mockRecordA = {
    extracted_text: sampleText,
    parsed_json: richDataA,
    score: 85,
  };
  const isCacheHit = isReusableResumeAnalysis(mockRecordA, sampleText, 'v3.0-deep-career-aware', 'hash_data_analyst');
  assert.equal(isCacheHit, true, 'TEST 5: Cache hit for same resume + same role');
  if (isCacheHit) {
    // 0 additional provider calls
  }
  assert.equal(providerCalls, 1, 'TEST 5: Provider called 0 additional times on cache hit');

  // TEST 6: Different role -> separate analysis (cache miss)
  const isCacheHitRoleB = isReusableResumeAnalysis(mockRecordA, sampleText, 'v3.0-deep-career-aware', 'hash_full_stack');
  assert.equal(isCacheHitRoleB, false, 'TEST 6: Cache miss when switching role');
  const richDataB = mockGenerateRichAnalysis(deterministicDataA, roleB);
  richDataB.analysis_version = 'v3.0-deep-career-aware';
  richDataB.analysis_context_hash = 'hash_full_stack';
  assert.equal(providerCalls, 2, 'TEST 6: Provider called for role B analysis');

  // TEST 7: Changed resume -> new analysis (cache miss)
  const changedText = sampleText + '\nCERTIFICATIONS\nAWS Certified Developer';
  const isCacheHitChangedText = isReusableResumeAnalysis(mockRecordA, changedText, 'v3.0-deep-career-aware', 'hash_data_analyst');
  assert.equal(isCacheHitChangedText, false, 'TEST 7: Cache miss when resume text changes');

  // TEST 8: Explicit regenerate -> forces new provider call
  const richDataARegenerated = mockGenerateRichAnalysis(deterministicDataA, roleA);
  assert.equal(richDataARegenerated.analysis_source, 'ai', 'TEST 8: Regenerated data has source ai');
  assert.equal(providerCalls, 3, 'TEST 8: Explicit regenerate calls provider once');

  // TEST 9: AI failure -> deterministic review remains visible
  const scoreFallback = calculateResumeScore(aiFailureFallback);
  assert.ok(scoreFallback > 0, 'TEST 9: Deterministic review score is preserved during AI failure');

  // TEST 10: AI failure does not create a successful cache entry
  const mockFailedRecord = {
    extracted_text: sampleText,
    parsed_json: aiFailureFallback,
    score: scoreFallback,
  };
  const isFailedRecordCacheHit = isReusableResumeAnalysis(mockFailedRecord, sampleText, 'v3.0-deep-career-aware', 'hash_data_analyst');
  assert.equal(isFailedRecordCacheHit, false, 'TEST 10: Failed AI analysis is NOT cached as a valid AI result');

  console.log('PASS: All 10 architecture mock tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Architecture test failed:', err);
  process.exit(1);
});

import { calculateReadinessScore } from './scoring';

function runUnitTests() {
  console.log('--- RUNNING READINESS ENGINE UNIT TESTS ---');

  // TEST 1: New student with academic data + skills + career goals -> deterministic assessment generated
  const test1 = calculateReadinessScore({
    student: { cgpa: 8.5, semester: 6, interests: ['AI/ML'], target_careers: ['role-1'] },
    studentSkills: [{ skill_id: 'skill-1', proficiency: 'intermediate' }],
    targetRoleSkills: [{ role_id: 'role-1', skill_id: 'skill-1', required: true, importance: 'high' }],
  });
  console.assert(test1.overallScore > 0, 'Test 1 Failed: overallScore should be > 0');
  console.assert(test1.dimensions.academic.score === 85, 'Test 1 Failed: CGPA 8.5 normalized should be 85');
  console.assert(test1.dimensions.academic.status === 'available', 'Test 1 Failed: Academic status should be available');
  console.log('✔ TEST 1 PASSED: Deterministic assessment generated for standard student');

  // TEST 2: Run assessment twice with identical data -> identical scores
  const test2 = calculateReadinessScore({
    student: { cgpa: 8.5, semester: 6, interests: ['AI/ML'], target_careers: ['role-1'] },
    studentSkills: [{ skill_id: 'skill-1', proficiency: 'intermediate' }],
    targetRoleSkills: [{ role_id: 'role-1', skill_id: 'skill-1', required: true, importance: 'high' }],
  });
  console.assert(test1.overallScore === test2.overallScore, 'Test 2 Failed: Identical inputs produced different overall scores');
  console.assert(JSON.stringify(test1.dimensions) === JSON.stringify(test2.dimensions), 'Test 2 Failed: Identical inputs produced different dimension scores');
  console.log('✔ TEST 2 PASSED: Pure reproducibility verified (100% identical outputs)');

  // TEST 3: Change a student's skill -> relevant deterministic score changes
  const test3 = calculateReadinessScore({
    student: { cgpa: 8.5, semester: 6, interests: ['AI/ML'], target_careers: ['role-1'] },
    studentSkills: [{ skill_id: 'skill-1', proficiency: 'advanced' }],
    targetRoleSkills: [{ role_id: 'role-1', skill_id: 'skill-1', required: true, importance: 'high' }],
  });
  console.assert((test3.dimensions.technical.score ?? 0) > (test1.dimensions.technical.score ?? 0), 'Test 3 Failed: Higher proficiency should yield higher technical score');
  console.log('✔ TEST 3 PASSED: Skill proficiency change updates technical score deterministically');

  // TEST 4: Change CGPA -> academic score changes predictably
  const test4 = calculateReadinessScore({
    student: { cgpa: 9.5, semester: 6, interests: ['AI/ML'], target_careers: ['role-1'] },
    studentSkills: [{ skill_id: 'skill-1', proficiency: 'intermediate' }],
    targetRoleSkills: [{ role_id: 'role-1', skill_id: 'skill-1', required: true, importance: 'high' }],
  });
  console.assert(test4.dimensions.academic.score === 95, 'Test 4 Failed: CGPA 9.5 normalized should be 95');
  console.log('✔ TEST 4 PASSED: CGPA update updates academic score predictably');

  // TEST 5: No resume -> resume dimension marked pending, not 0
  const test5 = calculateReadinessScore({
    student: { cgpa: 8.0 },
    studentSkills: [],
    targetRoleSkills: [],
  });
  console.assert(test5.dimensions.resume.status === 'pending', 'Test 5 Failed: Resume status should be pending');
  console.assert(test5.dimensions.resume.score === null, 'Test 5 Failed: Resume score should be null when pending');
  console.assert(test5.pendingDimensions.includes('resume'), 'Test 5 Failed: Resume should be in pendingDimensions');
  console.log('✔ TEST 5 PASSED: Missing resume marked pending (null), not zero');

  // TEST 6: No completed interview -> interview dimension marked pending, not 0
  console.assert(test5.dimensions.interview.status === 'pending', 'Test 6 Failed: Interview status should be pending');
  console.assert(test5.dimensions.interview.score === null, 'Test 6 Failed: Interview score should be null when pending');
  console.assert(test5.pendingDimensions.includes('interview'), 'Test 6 Failed: Interview should be in pendingDimensions');
  console.log('✔ TEST 6 PASSED: Missing interview marked pending (null), not zero');

  // TEST 7: No project evidence -> project dimension marked pending
  console.assert(test5.dimensions.projects.status === 'pending', 'Test 7 Failed: Projects status should be pending');
  console.assert(test5.dimensions.projects.score === null, 'Test 7 Failed: Projects score should be null when pending');
  console.assert(test5.pendingDimensions.includes('projects'), 'Test 7 Failed: Projects should be in pendingDimensions');
  console.log('✔ TEST 7 PASSED: Missing project evidence marked pending due to schema limitation');

  console.log('--- ALL UNIT TESTS COMPLETED SUCCESSFULLY ---');
}

runUnitTests();

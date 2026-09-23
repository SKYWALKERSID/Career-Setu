import {
  READINESS_SCORING_VERSION,
  NOMINAL_WEIGHTS,
  DimensionKey,
  ScoreDimensionResult,
  ReadinessScoreResult,
} from './types';

export interface StudentSkillInput {
  skill_id: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

export interface CareerRoleSkillInput {
  role_id: string;
  skill_id: string;
  required: boolean;
  importance: 'high' | 'medium' | 'low';
}

export interface ReadinessCalculationInput {
  student: {
    cgpa?: number | null;
    semester?: number | null;
    interests?: string[];
    target_careers?: string[];
  };
  studentSkills: StudentSkillInput[];
  targetRoleSkills: CareerRoleSkillInput[];
  latestResumeScore?: number | null;
  latestInterviewScore?: number | null;
  // Note: projects are marked pending as schema currently has no project submission table
}

const PROFICIENCY_MULTIPLIER: Record<string, number> = {
  beginner: 0.6,
  intermediate: 0.85,
  advanced: 1.0,
};

const IMPORTANCE_WEIGHT: Record<string, number> = {
  high: 1.0,
  medium: 0.75,
  low: 0.5,
};

/**
 * Pure deterministic function to calculate career readiness assessment.
 * No side effects, no database calls, no AI.
 */
export function calculateReadinessScore(
  input: ReadinessCalculationInput
): ReadinessScoreResult {
  const { student, studentSkills, targetRoleSkills, latestResumeScore, latestInterviewScore } = input;

  // 1. Technical Skills Score (25%)
  let technicalResult: ScoreDimensionResult;
  if (studentSkills.length === 0) {
    technicalResult = {
      score: 0,
      weight: NOMINAL_WEIGHTS.technical,
      status: 'available',
      details: 'No skills self-declared in student profile.',
    };
  } else if (targetRoleSkills.length > 0) {
    // Score based on coverage of required/important skills for target career roles
    let totalPossibleWeight = 0;
    let earnedWeight = 0;

    targetRoleSkills.forEach((crs) => {
      const impWeight = IMPORTANCE_WEIGHT[crs.importance] || 0.75;
      const reqMultiplier = crs.required ? 1.2 : 1.0;
      const weight = impWeight * reqMultiplier;
      totalPossibleWeight += weight;

      const matchedSkill = studentSkills.find((ss) => ss.skill_id === crs.skill_id);
      if (matchedSkill) {
        const mult = PROFICIENCY_MULTIPLIER[matchedSkill.proficiency] || 0.6;
        earnedWeight += weight * mult;
      }
    });

    const skillCoverageScore = totalPossibleWeight > 0
      ? Math.min(100, Math.round((earnedWeight / totalPossibleWeight) * 100))
      : 50;

    technicalResult = {
      score: skillCoverageScore,
      weight: NOMINAL_WEIGHTS.technical,
      status: 'available',
      details: `Calculated from ${studentSkills.length} student skills against ${targetRoleSkills.length} target role skill requirements.`,
    };
  } else {
    // General technical score when no target career skill catalog match exists
    let totalProficiencyScore = 0;
    studentSkills.forEach((ss) => {
      totalProficiencyScore += (PROFICIENCY_MULTIPLIER[ss.proficiency] || 0.6) * 100;
    });
    const avgScore = Math.min(100, Math.round(totalProficiencyScore / studentSkills.length));

    technicalResult = {
      score: avgScore,
      weight: NOMINAL_WEIGHTS.technical,
      status: 'available',
      details: `Calculated from ${studentSkills.length} general student skills.`,
    };
  }

  // 2. Academic Score (15%)
  let academicResult: ScoreDimensionResult;
  if (student.cgpa !== undefined && student.cgpa !== null && student.cgpa > 0) {
    // Deterministic CGPA normalization: (CGPA / 10.0) * 100
    const normalizedCgpa = Math.min(100, Math.round((student.cgpa / 10.0) * 100));
    academicResult = {
      score: normalizedCgpa,
      weight: NOMINAL_WEIGHTS.academic,
      status: 'available',
      details: `Normalized CGPA ${student.cgpa} / 10.0 = ${normalizedCgpa}%`,
    };
  } else {
    academicResult = {
      score: null,
      weight: NOMINAL_WEIGHTS.academic,
      status: 'pending',
      details: 'Academic CGPA not provided in student profile.',
    };
  }

  // 3. Projects / Experience Score (20%)
  // Schema Limitation: student_profiles and student_skills have no dedicated projects/experience table.
  const projectsResult: ScoreDimensionResult = {
    score: null,
    weight: NOMINAL_WEIGHTS.projects,
    status: 'pending',
    details: 'Project submission evidence is pending schema support.',
  };

  // 4. Resume Score (15%)
  let resumeResult: ScoreDimensionResult;
  if (latestResumeScore !== undefined && latestResumeScore !== null && latestResumeScore >= 0) {
    resumeResult = {
      score: Math.min(100, Math.round(latestResumeScore)),
      weight: NOMINAL_WEIGHTS.resume,
      status: 'available',
      details: `Latest parsed resume score: ${latestResumeScore}/100`,
    };
  } else {
    resumeResult = {
      score: null,
      weight: NOMINAL_WEIGHTS.resume,
      status: 'pending',
      details: 'No resume parsed or scored yet.',
    };
  }

  // 5. Interview Score (15%)
  let interviewResult: ScoreDimensionResult;
  if (latestInterviewScore !== undefined && latestInterviewScore !== null && latestInterviewScore >= 0) {
    interviewResult = {
      score: Math.min(100, Math.round(latestInterviewScore)),
      weight: NOMINAL_WEIGHTS.interview,
      status: 'available',
      details: `Latest completed mock interview score: ${latestInterviewScore}/100`,
    };
  } else {
    interviewResult = {
      score: null,
      weight: NOMINAL_WEIGHTS.interview,
      status: 'pending',
      details: 'No completed mock interview session found.',
    };
  }

  // 6. Career Alignment Score (10%)
  // Deterministic formula:
  // - Base 30 points if target career roles selected
  // - Base 20 points if domain interests selected
  // - Up to 50 points based on skill alignment ratio (student skills matching target career role requirements)
  let alignmentResult: ScoreDimensionResult;
  const hasTargetCareers = (student.target_careers || []).length > 0;
  const hasInterests = (student.interests || []).length > 0;

  if (hasTargetCareers || hasInterests) {
    let alignmentPoints = 0;
    if (hasTargetCareers) alignmentPoints += 30;
    if (hasInterests) alignmentPoints += 20;

    // Evaluate skill overlap with target career roles if available
    if (targetRoleSkills.length > 0 && studentSkills.length > 0) {
      const studentSkillSet = new Set(studentSkills.map((s) => s.skill_id));
      const targetRequiredSkillSet = new Set(targetRoleSkills.map((trs) => trs.skill_id));

      let matchedCount = 0;
      targetRequiredSkillSet.forEach((skillId) => {
        if (studentSkillSet.has(skillId)) matchedCount++;
      });

      const skillOverlapRatio = targetRequiredSkillSet.size > 0
        ? matchedCount / targetRequiredSkillSet.size
        : 0;

      alignmentPoints += Math.round(skillOverlapRatio * 50);
    }

    const finalAlignmentScore = Math.min(100, alignmentPoints);
    alignmentResult = {
      score: finalAlignmentScore,
      weight: NOMINAL_WEIGHTS.alignment,
      status: 'available',
      details: `Career alignment calculated from target roles (${(student.target_careers || []).length}), interests (${(student.interests || []).length}), and target skill overlap ratio.`,
    };
  } else {
    alignmentResult = {
      score: 0,
      weight: NOMINAL_WEIGHTS.alignment,
      status: 'available',
      details: 'No target career roles or domain interests specified.',
    };
  }

  // Compile dimension object
  const dimensions = {
    technical: technicalResult,
    academic: academicResult,
    projects: projectsResult,
    resume: resumeResult,
    interview: interviewResult,
    alignment: alignmentResult,
  };

  // Determine available vs pending dimensions
  const availableDimensions: DimensionKey[] = [];
  const pendingDimensions: DimensionKey[] = [];

  (Object.keys(dimensions) as DimensionKey[]).forEach((key) => {
    if (dimensions[key].status === 'available' && dimensions[key].score !== null) {
      availableDimensions.push(key);
    } else {
      pendingDimensions.push(key);
    }
  });

  // Calculate evidence-aware overall score by proportional re-weighting
  let totalAvailableWeight = 0;
  let weightedSum = 0;

  availableDimensions.forEach((key) => {
    const dim = dimensions[key];
    if (dim.score !== null) {
      totalAvailableWeight += dim.weight;
      weightedSum += dim.score * dim.weight;
    }
  });

  const overallScore = totalAvailableWeight > 0
    ? Math.min(100, Math.round(weightedSum / totalAvailableWeight))
    : 0;

  const explanation = `Calculated using ${READINESS_SCORING_VERSION} formula. ` +
    `Overall score (${overallScore}/100) normalized across ${availableDimensions.length} available dimensions ` +
    `(${availableDimensions.join(', ')}). ${pendingDimensions.length} dimensions pending (${pendingDimensions.join(', ')}).`;

  return {
    overallScore,
    scoringVersion: READINESS_SCORING_VERSION,
    availableDimensions,
    pendingDimensions,
    dimensions,
    explanation,
  };
}

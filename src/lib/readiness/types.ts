export const READINESS_SCORING_VERSION = 'v1';

export type DimensionKey = 
  | 'technical'
  | 'academic'
  | 'projects'
  | 'resume'
  | 'interview'
  | 'alignment';

export interface ScoreDimensionResult {
  score: number | null; // null if evidence pending
  weight: number; // nominal weight (e.g. 0.25 for technical)
  status: 'available' | 'pending';
  details: string;
}

export interface ReadinessScoreResult {
  overallScore: number;
  scoringVersion: string;
  availableDimensions: DimensionKey[];
  pendingDimensions: DimensionKey[];
  dimensions: {
    technical: ScoreDimensionResult;
    academic: ScoreDimensionResult;
    projects: ScoreDimensionResult;
    resume: ScoreDimensionResult;
    interview: ScoreDimensionResult;
    alignment: ScoreDimensionResult;
  };
  explanation: string;
}

// Nominal weights from PRD/TRD specification
export const NOMINAL_WEIGHTS: Record<DimensionKey, number> = {
  technical: 0.25,
  academic: 0.15,
  projects: 0.20,
  resume: 0.15,
  interview: 0.15,
  alignment: 0.10,
};

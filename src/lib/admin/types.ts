export interface AdminMetrics {
  totalStudents: number;
  studentsWithProfiles: number;
  studentsWithReadiness: number;
  averageLatestReadiness: number | null;
  readinessAssessments: number;
  careerRoleUsage: Array<{ roleId: string; title: string; count: number }>;
  roadmapCount: number;
  roadmapTaskCompletion: { completed: number; total: number; percent: number | null };
  recommendationCount: number;
  analyzedResumeCount: number;
  completedInterviewCount: number;
  courseCatalogCount: number;
  opportunityCatalogCount: number;
  verifiedOpportunityCount: number;
  opportunityMatchCount: number;
  aiRuns: { total: number; successful: number; failed: number; tokensUsed: number | null; byFeature: Array<{ feature: string; count: number }> };
}

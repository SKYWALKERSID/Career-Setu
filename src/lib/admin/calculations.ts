import type { AdminMetrics } from './types';

export function latestByStudent<T extends { student_id: string; created_at?: string }>(records: T[]): T[] {
  const latest = new Map<string, T>();
  for (const record of records) { const current = latest.get(record.student_id); if (!current || new Date(record.created_at || 0).getTime() >= new Date(current.created_at || 0).getTime()) latest.set(record.student_id, record); }
  return [...latest.values()];
}

export function calculateAdminMetrics(input: {
  studentCount: number; profileCount: number; readiness: Array<{ student_id: string; overall_score: number; created_at: string }>;
  roleUsage: Array<{ roleId: string; title: string; count: number }>;
  roadmapCount: number; roadmapTasks: Array<{ roadmap_id: string; status: string }>;
  recommendationCount: number; analyzedResumeCount: number; completedInterviewCount: number; courseCatalogCount: number; opportunityCatalogCount: number; verifiedOpportunityCount: number; opportunityMatchCount: number;
  aiRuns: Array<{ feature: string; success: boolean; tokens_used?: number | null }>;
}): AdminMetrics {
  const latestReadiness = latestByStudent(input.readiness); const completed = input.roadmapTasks.filter((task) => task.status === 'completed').length; const total = input.roadmapTasks.filter((task) => ['pending', 'in_progress', 'completed'].includes(task.status)).length;
  const featureCounts = new Map<string, number>(); for (const run of input.aiRuns) featureCounts.set(run.feature, (featureCounts.get(run.feature) || 0) + 1);
  const tokens = input.aiRuns.map((run) => run.tokens_used).filter((value): value is number => typeof value === 'number');
  return { totalStudents: input.studentCount, studentsWithProfiles: input.profileCount, studentsWithReadiness: latestReadiness.length, averageLatestReadiness: latestReadiness.length ? Math.round(latestReadiness.reduce((sum, item) => sum + item.overall_score, 0) / latestReadiness.length) : null, readinessAssessments: input.readiness.length, careerRoleUsage: input.roleUsage, roadmapCount: input.roadmapCount, roadmapTaskCompletion: { completed, total, percent: total ? Math.round(completed / total * 100) : null }, recommendationCount: input.recommendationCount, analyzedResumeCount: input.analyzedResumeCount, completedInterviewCount: input.completedInterviewCount, courseCatalogCount: input.courseCatalogCount, opportunityCatalogCount: input.opportunityCatalogCount, verifiedOpportunityCount: input.verifiedOpportunityCount, opportunityMatchCount: input.opportunityMatchCount, aiRuns: { total: input.aiRuns.length, successful: input.aiRuns.filter((run) => run.success).length, failed: input.aiRuns.filter((run) => !run.success).length, tokensUsed: tokens.length ? tokens.reduce((sum, value) => sum + value, 0) : null, byFeature: [...featureCounts.entries()].map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count || a.feature.localeCompare(b.feature)) } };
}

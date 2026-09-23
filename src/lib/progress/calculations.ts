import type { ReadinessAssessment, RoadmapTask } from '@/types';
import type { RoadmapProgress, ReadinessProgress } from './types';

export function calculateRoadmapProgress(tasks: RoadmapTask[] | null | undefined): RoadmapProgress {
  if (!tasks) return { status: 'unavailable', completedTasks: 0, totalTasks: 0, percent: 0 };
  const valid = tasks.filter((task) => ['pending', 'in_progress', 'completed'].includes(task.status));
  if (!valid.length) return { status: 'pending', completedTasks: 0, totalTasks: 0, percent: 0 };
  const completedTasks = valid.filter((task) => task.status === 'completed').length;
  const percent = Math.round((completedTasks / valid.length) * 100);
  return { status: completedTasks === valid.length ? 'completed' : completedTasks ? 'in_progress' : 'pending', completedTasks, totalTasks: valid.length, percent };
}

export function calculateReadinessProgress(history: ReadinessAssessment[] | null | undefined): ReadinessProgress {
  const records = (history || []).filter((record) => Number.isFinite(record.overall_score)).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const current = records[records.length - 1] || null;
  if (!current) return { current: null, history: [], trend: 'unavailable', change: null };
  if (records.length < 2) return { current, history: records, trend: 'insufficient_history', change: null };
  const previous = records[records.length - 2]; const change = current.overall_score - previous.overall_score;
  return { current, history: records, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable', change };
}

export function buildProgressSnapshot(input: { tasks?: RoadmapTask[] | null; readiness?: ReadinessAssessment[] | null; currentSkills: number; completedInterviews: number; analyzedResumes: number }): import('./types').ProgressSnapshot {
  return { roadmap: calculateRoadmapProgress(input.tasks), readiness: calculateReadinessProgress(input.readiness), currentSkills: Math.max(0, input.currentSkills), completedInterviews: Math.max(0, input.completedInterviews), analyzedResumes: Math.max(0, input.analyzedResumes), unsupported: { courseCompletion: 'unavailable', opportunityApplications: 'unavailable' } };
}

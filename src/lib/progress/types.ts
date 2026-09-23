import type { ReadinessAssessment } from '@/types';

export interface RoadmapProgress { status: 'completed' | 'in_progress' | 'pending' | 'unavailable'; completedTasks: number; totalTasks: number; percent: number }
export interface ReadinessProgress { current: ReadinessAssessment | null; history: ReadinessAssessment[]; trend: 'up' | 'down' | 'stable' | 'insufficient_history' | 'unavailable'; change: number | null }
export interface ProgressSnapshot { roadmap: RoadmapProgress; readiness: ReadinessProgress; currentSkills: number; completedInterviews: number; analyzedResumes: number; unsupported: { courseCompletion: 'unavailable'; opportunityApplications: 'unavailable' } }

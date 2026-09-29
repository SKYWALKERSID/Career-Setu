import type { ReadinessAssessment } from '@/types';

export interface RoadmapProgress { status: 'completed' | 'in_progress' | 'pending' | 'unavailable'; completedTasks: number; totalTasks: number; percent: number }
export interface ReadinessProgress { current: ReadinessAssessment | null; history: ReadinessAssessment[]; trend: 'up' | 'down' | 'stable' | 'insufficient_history' | 'unavailable'; change: number | null }
export interface ProgressSkill { skill_id: string; skill_name: string; status: 'acquired' | 'developing' | 'missing'; priority: number; course_ids?: string[] }
export interface ProgressSnapshot { activeRole: { id: string; title: string } | null; targetCareers: Array<{ id: string; title: string }>; roadmap: RoadmapProgress; readiness: ReadinessProgress; currentSkills: number; completedInterviews: number; analyzedResumes: number; evidenceSubmitted: number; skillGaps: ProgressSkill[]; unsupported: { courseCompletion: 'unavailable'; opportunityApplications: 'unavailable' } }

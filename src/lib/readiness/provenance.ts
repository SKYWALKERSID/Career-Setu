import type { ReadinessAssessment } from '@/types';

export const READINESS_SOURCES = ['explicit_assessment', 'profile_update', 'resume_update', 'interview_completion', 'manual_recalculation', 'legacy_unknown'] as const;
export type ReadinessSource = typeof READINESS_SOURCES[number];

export function getReadinessSourceMeta(source: ReadinessAssessment['source']) {
  switch (source) {
    case 'explicit_assessment': return { title: 'Explicit Assessment', description: 'Completed assessment', badge: 'Assessment' };
    case 'profile_update': return { title: 'Readiness Snapshot', description: 'Updated after profile change', badge: 'Snapshot' };
    case 'resume_update': return { title: 'Readiness Snapshot', description: 'Updated after resume update', badge: 'Snapshot' };
    case 'interview_completion': return { title: 'Readiness Snapshot', description: 'Updated after interview completion', badge: 'Snapshot' };
    case 'manual_recalculation': return { title: 'Readiness Snapshot', description: 'Updated by manual recalculation', badge: 'Snapshot' };
    default: return { title: 'Legacy Snapshot', description: 'Historical record', badge: 'Snapshot' };
  }
}

export function countExplicitAssessments(records: Pick<ReadinessAssessment, 'source'>[]) {
  return records.filter((record) => record.source === 'explicit_assessment').length;
}

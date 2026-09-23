import assert from 'node:assert/strict';
import { buildProgressSnapshot, calculateReadinessProgress, calculateRoadmapProgress } from './calculations';
import type { ReadinessAssessment, RoadmapTask } from '@/types';

const task = (id: string, status: RoadmapTask['status']): RoadmapTask => ({ id, roadmap_id: 'roadmap', week: 1, task_type: 'learning', title: id, description: id, status });
assert.deepEqual(calculateRoadmapProgress(null), { status: 'unavailable', completedTasks: 0, totalTasks: 0, percent: 0 });
assert.equal(calculateRoadmapProgress([]).status, 'pending'); assert.equal(calculateRoadmapProgress([task('a', 'pending')]).percent, 0); assert.equal(calculateRoadmapProgress([task('a', 'completed'), task('b', 'pending')]).percent, 50); assert.equal(calculateRoadmapProgress([task('a', 'completed'), task('b', 'completed')]).status, 'completed');
const assessment = (id: string, score: number, created_at: string): ReadinessAssessment => ({ id, student_id: 'student', overall_score: score, created_at });
assert.equal(calculateReadinessProgress([]).trend, 'unavailable'); assert.equal(calculateReadinessProgress([assessment('a', 60, '2026-01-01')]).trend, 'insufficient_history'); const trend = calculateReadinessProgress([assessment('a', 60, '2026-01-01'), assessment('b', 75, '2026-02-01')]); assert.equal(trend.trend, 'up'); assert.equal(trend.change, 15); assert.equal(calculateReadinessProgress([assessment('b', 75, '2026-02-01'), assessment('a', 60, '2026-01-01')]).current?.overall_score, 75);
const snapshot = buildProgressSnapshot({ tasks: [task('a', 'completed')], readiness: [], currentSkills: 2, completedInterviews: 0, analyzedResumes: 0 }); assert.equal(snapshot.roadmap.percent, 100); assert.equal(snapshot.unsupported.courseCompletion, 'unavailable'); assert.equal(snapshot.unsupported.opportunityApplications, 'unavailable');
console.log('Progress tracking tests passed');

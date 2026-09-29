import type { RoadmapTask, Course } from '@/types';

const COURSE_ID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

export function resolveRoadmapTaskCourseTitles(tasks: RoadmapTask[], courses: Pick<Course, 'id' | 'title'>[]): RoadmapTask[] {
  const titles = new Map(courses.map((course) => [course.id.toLowerCase(), course.title]));
  return tasks.map((task) => ({
    ...task,
    description: task.description.replace(COURSE_ID_PATTERN, (courseId) => titles.get(courseId.toLowerCase()) || 'Course resource unavailable'),
  }));
}

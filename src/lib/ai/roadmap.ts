import { RoadmapSchema } from './schemas';

export interface RoadmapCatalog { roleIds: Set<string>; skillIds: Set<string>; courseIds: Set<string> }

export function validateRoadmap(raw: unknown, catalog: RoadmapCatalog) {
  const parsed = RoadmapSchema.safeParse(raw);
  if (!parsed.success) return { success: false as const, error: 'AI roadmap response failed schema validation.' };
  if (!catalog.roleIds.has(parsed.data.target_role_id)) return { success: false as const, error: 'AI roadmap referenced a role outside the catalog.' };
  for (const task of parsed.data.tasks) {
    if (task.skill_ids.some((id) => !catalog.skillIds.has(id))) return { success: false as const, error: 'AI roadmap referenced a skill outside the catalog.' };
    if (task.course_ids.some((id) => !catalog.courseIds.has(id))) return { success: false as const, error: 'AI roadmap referenced a course outside the catalog.' };
  }
  return { success: true as const, data: parsed.data };
}

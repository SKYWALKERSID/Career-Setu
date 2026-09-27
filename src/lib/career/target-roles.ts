export type CareerRoleReference = {
  id: string;
  title: string;
  category?: string | null;
};

export function resolveTargetCareerIds(
  references: string[],
  roles: CareerRoleReference[],
): string[] {
  const byId = new Map(roles.map((role) => [role.id, role.id]));
  const byTitle = new Map(roles.map((role) => [role.title.trim().toLowerCase(), role.id]));

  return [...new Set(references
    .map((reference) => byId.get(reference) || byTitle.get(reference.trim().toLowerCase()))
    .filter((id): id is string => Boolean(id)))];
}

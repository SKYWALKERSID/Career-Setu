export type RoadmapCourse = { id: string; title: string; provider: string; url: string; skill_ids: string[] };

export function buildRoadmapContext(input: {
  student: { name?: string | null; course?: string | null; branch?: string | null; interests?: string[] | null };
  role: { id: string; title: string; description: string };
  studentSkills: Array<{ skill_id: string; proficiency: 'beginner' | 'intermediate' | 'advanced'; evidence_type?: string; evidence?: string | null }>;
  skillGaps: Array<{ skill_id: string; skill_name: string; status: string; importance: string; priority: number }>;
  courses: RoadmapCourse[];
  readiness: { overall_score?: number | null; pending: string[] } | null;
}) {
  const gapIds = new Set(input.skillGaps.map((gap) => gap.skill_id));
  const studentSkills = new Map(input.studentSkills.filter((skill) => gapIds.has(skill.skill_id)).map((skill) => [skill.skill_id, skill]));
  const courses = new Map(input.courses
    .filter((course) => course.skill_ids.some((skillId) => gapIds.has(skillId)))
    .map((course) => [course.id, { ...course, skill_ids: [...new Set(course.skill_ids.filter((skillId) => gapIds.has(skillId)))] }]));

  return {
    student: {
      name: input.student.name || null,
      course: input.student.course || null,
      branch: input.student.branch || null,
      interests: input.student.interests || [],
    },
    target_role: input.role,
    skill_gaps: input.skillGaps.map(({ skill_id, skill_name, status, importance, priority }) => ({ skill_id, skill_name, status, importance, priority })),
    student_skills: [...studentSkills.values()],
    courses: [...courses.values()],
    readiness: input.readiness,
  };
}

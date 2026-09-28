import { z } from 'zod';

function textValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of ['text', 'content', 'description', 'name', 'value', 'title']) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  return null;
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(textValue).filter((item): item is string => Boolean(item)) : [];
}

function idArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return typeof record.id === 'string' ? record.id : typeof record.skill_id === 'string' ? record.skill_id : null;
    }
    return null;
  }).filter((item): item is string => Boolean(item));
}

// Infrastructure Test Output Schema
export const AIInfrastructureTestSchema = z.object({
  summary: z.string().min(1, 'Summary cannot be empty').max(1000),
  strengths: z.array(z.string()).max(10),
  areas_to_develop: z.array(z.string()).max(10),
  confidence: z.number().min(0).max(1),
});

export type AIInfrastructureTestResult = z.infer<typeof AIInfrastructureTestSchema>;

export const CareerRecommendationItemSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const item = value as Record<string, unknown>;
  // Some OpenAI-compatible models name this bounded catalog score `match_score`.
  // Normalize that equivalent field before the shared domain schema validates it.
  let normalized = item;
  if (normalized.score === undefined && normalized.match_score !== undefined) normalized = { ...normalized, score: normalized.match_score };
  if (typeof item.confidence === 'number' && item.confidence > 1) {
    normalized = { ...normalized, confidence: item.confidence / 100 };
  }
  if (normalized !== item) {
    return normalized;
  }
  return value;
}, z.object({
  role_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(1).max(600),
  strengths: z.array(z.string().uuid()).max(10),
  missing_skill_ids: z.array(z.string().uuid()).max(20),
  confidence: z.number().min(0).max(1),
}));

export const CareerRecommendationsSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const output = value as Record<string, unknown>;
  // Keep the domain contract stable when a provider names the wrapper after the feature.
  if (output.recommendations === undefined && Array.isArray(output.career_recommendations)) {
    return { ...output, recommendations: output.career_recommendations };
  }
  return value;
}, z.object({
  recommendations: z.array(CareerRecommendationItemSchema).min(1).max(5),
}));

export type CareerRecommendationAIResult = z.infer<typeof CareerRecommendationsSchema>;

const RoadmapTaskSchemaBase = z.object({
  week: z.number().int().min(1).max(13),
  task_type: z.enum(['learning', 'project', 'interview_prep']),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  skill_ids: z.array(z.string().uuid()).max(6),
  course_ids: z.array(z.string().uuid()).max(3),
});

const RoadmapTaskSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const item = value as Record<string, unknown>;
  return {
    week: item.week ?? item.week_number ?? item.weekNumber,
    task_type: item.task_type ?? item.taskType ?? 'learning',
    title: item.title ?? item.name,
    description: item.description ?? item.details ?? item.task,
    skill_ids: idArray(item.skill_ids ?? item.skillIds ?? item.skills),
    course_ids: idArray(item.course_ids ?? item.courseIds ?? item.courses),
  };
}, RoadmapTaskSchemaBase);

const RoadmapSchemaBase = z.object({
  target_role_id: z.string().uuid(),
  duration_days: z.literal(90),
  rationale: z.string().min(1).max(600),
  tasks: z.array(RoadmapTaskSchema).min(4).max(18),
});

export const RoadmapSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const nested = [source.roadmap, source.plan, source.roadmap_plan].find((item) => item && typeof item === 'object');
  const output = (nested && typeof nested === 'object' ? nested : source) as Record<string, unknown>;
  const tasks = output.tasks ?? output.milestones ?? output.weeks;
  return {
    target_role_id: output.target_role_id ?? output.targetRoleId ?? output.role_id ?? output.roleId,
    duration_days: output.duration_days ?? output.durationDays ?? 90,
    rationale: output.rationale ?? output.summary ?? output.overview,
    tasks: Array.isArray(tasks) ? tasks : [],
  };
}, RoadmapSchemaBase);

export type RoadmapAIResult = z.infer<typeof RoadmapSchema>;

const ResumeParseSchemaBase = z.object({
  contact: z.object({ email: z.string().email().optional(), phone: z.string().max(40).optional(), links: z.array(z.string().url()).max(10) }),
  education: z.array(z.string().max(300)).max(10), skills: z.array(z.string().max(100)).max(50), projects: z.array(z.string().max(500)).max(20), experience: z.array(z.string().max(500)).max(20), certifications: z.array(z.string().max(300)).max(20), achievements: z.array(z.string().max(300)).max(20), evidenced_skill_ids: z.array(z.string().uuid()).max(50), role_required_skill_ids: z.array(z.string().uuid()).max(50), not_evidenced_skill_ids: z.array(z.string().uuid()).max(50), strengths: z.array(z.string().max(300)).max(10), improvement_areas: z.array(z.string().max(300)).max(10), suggestions: z.array(z.string().max(400)).max(15),
});
export const ResumeParseSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const nested = [source.resume, source.parsed_resume, source.analysis].find((item) => item && typeof item === 'object');
  const output = (nested && typeof nested === 'object' ? nested : source) as Record<string, unknown>;
  const contact = output.contact && typeof output.contact === 'object' ? output.contact as Record<string, unknown> : {};
  return {
    contact: {
      email: typeof contact.email === 'string' ? contact.email : undefined,
      phone: typeof contact.phone === 'string' ? contact.phone : undefined,
      links: Array.isArray(contact.links) ? contact.links.filter((item): item is string => typeof item === 'string' && /^https?:\/\//.test(item)) : [],
    },
    education: textArray(output.education), skills: textArray(output.skills), projects: textArray(output.projects),
    experience: textArray(output.experience ?? output.work_experience), certifications: textArray(output.certifications), achievements: textArray(output.achievements),
    evidenced_skill_ids: idArray(output.evidenced_skill_ids ?? output.evidencedSkillIds), role_required_skill_ids: idArray(output.role_required_skill_ids ?? output.roleRequiredSkillIds), not_evidenced_skill_ids: idArray(output.not_evidenced_skill_ids ?? output.notEvidencedSkillIds),
    strengths: textArray(output.strengths), improvement_areas: textArray(output.improvement_areas ?? output.improvementAreas), suggestions: textArray(output.suggestions ?? output.recommendations),
  };
}, ResumeParseSchemaBase);
export type ResumeParseResult = z.infer<typeof ResumeParseSchema>;

const InterviewQuestionSchemaBase = z.object({ question: z.string().min(10).max(500), category: z.enum(['technical', 'problem_solving', 'project', 'behavioral', 'role_specific']), focus_skill_id: z.string().uuid().nullable() });
export const InterviewQuestionSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const nested = [source.question, source.interview_question].find((item) => item && typeof item === 'object');
  const output = (nested && typeof nested === 'object' ? nested : source) as Record<string, unknown>;
  return { question: output.question ?? output.prompt ?? output.text, category: output.category ?? 'role_specific', focus_skill_id: output.focus_skill_id ?? output.focusSkillId ?? null };
}, InterviewQuestionSchemaBase) as unknown as z.ZodType<z.infer<typeof InterviewQuestionSchemaBase>>;
export const InterviewEvaluationSchema = z.object({ rubric_score: z.number().int().min(0).max(100), correctness: z.number().int().min(0).max(100), relevance: z.number().int().min(0).max(100), depth: z.number().int().min(0).max(100), clarity: z.number().int().min(0).max(100), feedback: z.string().min(1).max(700) });
export const InterviewReportSchema = z.object({ overall_score: z.number().int().min(0).max(100), strengths: z.array(z.string().max(300)).max(10), areas_to_improve: z.array(z.string().max(300)).max(10), feedback_summary: z.string().min(1).max(700), recommendations: z.array(z.string().max(300)).max(10) });

// Reusable AI Analysis Contract Wrapper
export interface AIAnalysisResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  model: string;
  latencyMs: number;
}

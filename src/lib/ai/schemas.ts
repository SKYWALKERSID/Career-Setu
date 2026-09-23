import { z } from 'zod';

// Infrastructure Test Output Schema
export const AIInfrastructureTestSchema = z.object({
  summary: z.string().min(1, 'Summary cannot be empty').max(1000),
  strengths: z.array(z.string()).max(10),
  areas_to_develop: z.array(z.string()).max(10),
  confidence: z.number().min(0).max(1),
});

export type AIInfrastructureTestResult = z.infer<typeof AIInfrastructureTestSchema>;

export const CareerRecommendationItemSchema = z.object({
  role_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(1).max(600),
  strengths: z.array(z.string().uuid()).max(10),
  missing_skill_ids: z.array(z.string().uuid()).max(20),
  confidence: z.number().min(0).max(1),
});

export const CareerRecommendationsSchema = z.object({
  recommendations: z.array(CareerRecommendationItemSchema).min(1).max(5),
});

export type CareerRecommendationAIResult = z.infer<typeof CareerRecommendationsSchema>;

export const RoadmapTaskSchema = z.object({
  week: z.number().int().min(1).max(13),
  task_type: z.enum(['learning', 'project', 'interview_prep']),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  skill_ids: z.array(z.string().uuid()).max(6),
  course_ids: z.array(z.string().uuid()).max(3),
});

export const RoadmapSchema = z.object({
  target_role_id: z.string().uuid(),
  duration_days: z.literal(90),
  rationale: z.string().min(1).max(600),
  tasks: z.array(RoadmapTaskSchema).min(4).max(18),
});

export type RoadmapAIResult = z.infer<typeof RoadmapSchema>;

export const ResumeParseSchema = z.object({
  contact: z.object({ email: z.string().email().optional(), phone: z.string().max(40).optional(), links: z.array(z.string().url()).max(10) }),
  education: z.array(z.string().max(300)).max(10), skills: z.array(z.string().max(100)).max(50), projects: z.array(z.string().max(500)).max(20), experience: z.array(z.string().max(500)).max(20), certifications: z.array(z.string().max(300)).max(20), achievements: z.array(z.string().max(300)).max(20), evidenced_skill_ids: z.array(z.string().uuid()).max(50), role_required_skill_ids: z.array(z.string().uuid()).max(50), not_evidenced_skill_ids: z.array(z.string().uuid()).max(50), strengths: z.array(z.string().max(300)).max(10), improvement_areas: z.array(z.string().max(300)).max(10), suggestions: z.array(z.string().max(400)).max(15),
});
export type ResumeParseResult = z.infer<typeof ResumeParseSchema>;

export const InterviewQuestionSchema = z.object({ question: z.string().min(10).max(500), category: z.enum(['technical', 'problem_solving', 'project', 'behavioral', 'role_specific']), focus_skill_id: z.string().uuid().nullable() });
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

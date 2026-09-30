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

function weekNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : undefined;
  }
  return undefined;
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

export const CareerIntelligenceSchema = z.object({
  career_perspective: z.string().min(1).max(1200),
  career_setu_take: z.string().min(1).max(1200),
  why_fits: z.array(z.string().min(1).max(400)).min(2).max(5),
  strengths: z.array(z.string().min(1).max(400)).min(1).max(6),
  weaknesses: z.array(z.string().min(1).max(400)).min(1).max(6),
  evidence_analysis: z.array(z.object({
    observation: z.string().min(1).max(300),
    why_it_matters: z.string().min(1).max(350),
    evidence: z.string().min(1).max(350),
    action: z.string().min(1).max(350),
  })).min(1).max(8),
  strongest_evidence: z.array(z.string().min(1).max(300)).min(1).max(8),
  priority_gaps: z.array(z.object({
    skill_id: z.string().uuid(),
    skill_name: z.string().min(1).max(100),
    why_it_matters: z.string().min(1).max(300),
    first_step: z.string().min(1).max(300),
    evidence_to_build: z.string().min(1).max(300),
  })).max(6),
  priority_improvements: z.array(z.string().min(1).max(400)).min(1).max(6),
  next_action: z.string().min(1).max(400),
  focus_first: z.string().min(1).max(350),
  material_readiness_improvement: z.string().min(1).max(450),
  learning_strategy: z.array(z.string().min(1).max(350)).min(2).max(6),
  caveats: z.array(z.string().min(1).max(300)).max(4),
});

export type CareerIntelligenceResult = z.infer<typeof CareerIntelligenceSchema>;

const RoadmapTaskSchemaBase = z.object({
  week: z.number().int().min(1).max(13),
  task_type: z.enum(['learning', 'project', 'interview_prep']),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  skill_ids: z.array(z.string().uuid()).max(6),
  course_ids: z.array(z.string().uuid()).max(3),
  evidence_required: z.string().max(300).optional(),
});

const RoadmapTaskSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const item = value as Record<string, unknown>;
  return {
    week: weekNumber(item.week ?? item.week_number ?? item.weekNumber),
    task_type: item.task_type ?? item.taskType ?? 'learning',
    title: item.title ?? item.name ?? item.objective ?? item.focus ?? item.action,
    description: item.description ?? item.details ?? item.task ?? item.objective ?? item.focus ?? item.action,
    skill_ids: idArray(item.skill_ids ?? item.skillIds ?? item.skills),
    course_ids: idArray(item.course_ids ?? item.courseIds ?? item.courses),
    evidence_required: typeof (item.evidence_required ?? item.evidenceRequired ?? item.evidence) === 'string' ? String(item.evidence_required ?? item.evidenceRequired ?? item.evidence).slice(0, 300) : undefined,
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
  const sourceTasks = output.tasks ?? output.milestones ?? output.weeks;
  const tasks = Array.isArray(sourceTasks) ? sourceTasks.flatMap((item) => {
    if (!item || typeof item !== 'object') return [item];
    const record = item as Record<string, unknown>;
    const activities = record.activities ?? record.actions;
    if (!Array.isArray(activities)) return [item];
    return activities.map((activity) => ({ ...record, title: textValue(activity) ?? record.title ?? record.focus, description: textValue(activity) ?? record.description ?? record.focus }));
  }) : [];
  return {
    target_role_id: output.target_role_id ?? output.targetRoleId ?? output.role_id ?? output.roleId,
    duration_days: output.duration_days ?? output.durationDays ?? 90,
    rationale: typeof (output.rationale ?? output.summary ?? output.overview) === 'string'
      ? String(output.rationale ?? output.summary ?? output.overview).slice(0, 600)
      : output.rationale ?? output.summary ?? output.overview,
    tasks: tasks.slice(0, 13),
  };
}, RoadmapSchemaBase);

export type RoadmapAIResult = z.infer<typeof RoadmapSchema>;

const resumeReviewSection = z.enum(['Summary', 'Experience', 'Projects', 'Skills', 'Education', 'Achievements', 'Certifications', 'Other']);
const resumeTextList = z.array(z.string().min(1).max(500)).max(15);
const resumePriorityIssue = z.object({
  title: z.string().min(1).max(160),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  section: resumeReviewSection,
  problem: z.string().min(1).max(600),
  why_it_matters: z.string().min(1).max(600),
  recommended_change: z.string().min(1).max(600),
});
const resumeSectionReview = z.object({
  section: resumeReviewSection,
  status: z.enum(['strong', 'needs_work', 'missing', 'not_applicable']),
  what_works: resumeTextList,
  what_is_weak: resumeTextList,
  recommended_improvement: resumeTextList,
});
const resumeBulletReview = z.object({
  section: z.enum(['Summary', 'Experience', 'Projects']),
  original: z.string().min(1).max(700),
  issue: z.string().min(1).max(400),
  why_it_is_weak: z.string().min(1).max(500),
  suggested: z.string().min(1).max(700),
  missing_information: resumeTextList,
});
const resumeAtsAnalysis = z.object({
  present: resumeTextList,
  weak_or_missing: resumeTextList,
  placement_suggestions: resumeTextList,
  formatting_concerns: resumeTextList,
  ordering_suggestions: resumeTextList,
});
const resumeCareerAlignmentAnalysis = z.object({
  aligned_areas: resumeTextList,
  underrepresented_areas: resumeTextList,
  missing_role_evidence: resumeTextList,
  priority_changes: resumeTextList,
});
const resumeStrategy = z.object({ emphasize: resumeTextList, reduce: resumeTextList, reorder: resumeTextList, remove: resumeTextList, add_if_true: resumeTextList });
const resumeActionPlan = z.object({ fix_now: resumeTextList, improve_next: resumeTextList, optional_polish: resumeTextList });

const ResumeParseSchemaBase = z.object({
  analysis_source: z.enum(['ai', 'deterministic_fallback']).optional(),
  analysis_version: z.string().max(80).optional(),
  analysis_context_hash: z.string().length(64).optional(),
  name: z.string().max(200).optional(),
  contact: z.object({ email: z.string().email().optional(), phone: z.string().max(40).optional(), links: z.array(z.string().url()).max(10) }),
  location: z.string().max(200).optional(),
  summary: z.string().max(1200).optional(),
  education: z.array(z.string().max(300)).max(10), skills: z.array(z.string().max(100)).max(50), projects: z.array(z.string().max(500)).max(20), experience: z.array(z.string().max(500)).max(20), certifications: z.array(z.string().max(300)).max(20), achievements: z.array(z.string().max(300)).max(20), evidenced_skill_ids: z.array(z.string().uuid()).max(50), role_required_skill_ids: z.array(z.string().uuid()).max(50), not_evidenced_skill_ids: z.array(z.string().uuid()).max(50), strengths: z.array(z.string().max(300)).max(10), improvement_areas: z.array(z.string().max(300)).max(10), suggestions: z.array(z.string().max(400)).max(15),
  overall_assessment: z.string().min(1).max(900), biggest_opportunity: z.string().min(1).max(600),
  priority_issues: z.array(resumePriorityIssue).min(1).max(8), section_analysis: z.array(resumeSectionReview).min(1).max(8), bullet_improvements: z.array(resumeBulletReview).max(10),
  ats_keywords: resumeAtsAnalysis, career_alignment_analysis: resumeCareerAlignmentAnalysis, resume_strategy: resumeStrategy, action_plan: resumeActionPlan,
  reanalysis_focus: z.string().min(1).max(500),
});
function normalizeSectionName(val: unknown): 'Summary' | 'Experience' | 'Projects' | 'Skills' | 'Education' | 'Achievements' | 'Certifications' | 'Other' {
  if (typeof val !== 'string') return 'Other';
  const s = val.trim().toLowerCase();
  if (s.includes('summary') || s.includes('objective')) return 'Summary';
  if (s.includes('exp') || s.includes('work') || s.includes('job') || s.includes('employment')) return 'Experience';
  if (s.includes('project')) return 'Projects';
  if (s.includes('skill') || s.includes('tech')) return 'Skills';
  if (s.includes('edu') || s.includes('degree') || s.includes('academic')) return 'Education';
  if (s.includes('achiev') || s.includes('award') || s.includes('honor')) return 'Achievements';
  if (s.includes('certif') || s.includes('license') || s.includes('course')) return 'Certifications';
  return 'Other';
}

function normalizePriority(val: unknown): 'critical' | 'high' | 'medium' | 'low' {
  if (typeof val !== 'string') return 'medium';
  const p = val.trim().toLowerCase();
  if (p.includes('crit')) return 'critical';
  if (p.includes('high') || p === 'p1' || p === '1') return 'high';
  if (p.includes('med') || p === 'p2' || p === '2') return 'medium';
  if (p.includes('low') || p === 'p3' || p === '3') return 'low';
  return 'medium';
}

function normalizeSectionStatus(val: unknown): 'strong' | 'needs_work' | 'missing' | 'not_applicable' {
  if (typeof val !== 'string') return 'needs_work';
  const s = val.trim().toLowerCase();
  if (s.includes('strong') || s.includes('good') || s.includes('pass')) return 'strong';
  if (s.includes('miss') || s.includes('absent') || s.includes('none')) return 'missing';
  if (s.includes('not') || s.includes('n/a') || s.includes('na')) return 'not_applicable';
  return 'needs_work';
}

function uuidArray(val: unknown): string[] {
  const ids = idArray(val);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return ids.filter((id) => uuidRegex.test(id));
}

export const ResumeParseSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const nested = [source.resume, source.parsed_resume, source.analysis].find((item) => item && typeof item === 'object');
  const output = (nested && typeof nested === 'object' ? nested : source) as Record<string, unknown>;
  const contact = output.contact && typeof output.contact === 'object' ? output.contact as Record<string, unknown> : {};
  const rawEmail = typeof contact.email === 'string' ? contact.email.trim() : undefined;
  const validEmail = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : undefined;

  const priority_issues = Array.isArray(output.priority_issues)
    ? output.priority_issues.map((item) => {
        if (!item || typeof item !== 'object') return null;
        const rec = item as Record<string, unknown>;
        return {
          title: (textValue(rec.title ?? rec.name ?? rec.issue) || 'Resume improvement area').slice(0, 160),
          priority: normalizePriority(rec.priority),
          section: normalizeSectionName(rec.section),
          problem: (textValue(rec.problem ?? rec.issue ?? rec.description) || 'Needs improvement').slice(0, 600),
          why_it_matters: (textValue(rec.why_it_matters ?? rec.rationale ?? rec.why) || 'Affects resume effectiveness').slice(0, 600),
          recommended_change: (textValue(rec.recommended_change ?? rec.solution ?? rec.recommendation) || 'Update content').slice(0, 600),
        };
      }).filter(Boolean)
    : [];

  const section_analysis = Array.isArray(output.section_analysis)
    ? output.section_analysis.map((item) => {
        if (!item || typeof item !== 'object') return null;
        const rec = item as Record<string, unknown>;
        return {
          section: normalizeSectionName(rec.section),
          status: normalizeSectionStatus(rec.status),
          what_works: textArray(rec.what_works ?? rec.strengths),
          what_is_weak: textArray(rec.what_is_weak ?? rec.weaknesses),
          recommended_improvement: textArray(rec.recommended_improvement ?? rec.improvements ?? rec.recommendations),
        };
      }).filter(Boolean)
    : [];

  const bullet_improvements = Array.isArray(output.bullet_improvements)
    ? output.bullet_improvements.map((item) => {
        if (!item || typeof item !== 'object') return null;
        const rec = item as Record<string, unknown>;
        const sec = normalizeSectionName(rec.section);
        const validSec = (sec === 'Summary' || sec === 'Projects') ? sec : 'Experience';
        return {
          section: validSec,
          original: (textValue(rec.original ?? rec.current ?? rec.bullet) || 'Bullet point').slice(0, 700),
          issue: (textValue(rec.issue ?? rec.problem) || 'Could be stronger').slice(0, 400),
          why_it_is_weak: (textValue(rec.why_it_is_weak ?? rec.why) || 'Lacks measurable impact').slice(0, 500),
          suggested: (textValue(rec.suggested ?? rec.improved ?? rec.recommendation) || 'Rewritten bullet point').slice(0, 700),
          missing_information: textArray(rec.missing_information ?? rec.missing),
        };
      }).filter(Boolean)
    : [];

  const ats = output.ats_keywords && typeof output.ats_keywords === 'object' ? output.ats_keywords as Record<string, unknown> : {};
  const ats_keywords = {
    present: textArray(ats.present ?? ats.found),
    weak_or_missing: textArray(ats.weak_or_missing ?? ats.missing),
    placement_suggestions: textArray(ats.placement_suggestions ?? ats.placement),
    formatting_concerns: textArray(ats.formatting_concerns ?? ats.formatting),
    ordering_suggestions: textArray(ats.ordering_suggestions ?? ats.ordering),
  };

  const align = output.career_alignment_analysis && typeof output.career_alignment_analysis === 'object' ? output.career_alignment_analysis as Record<string, unknown> : {};
  const career_alignment_analysis = {
    aligned_areas: textArray(align.aligned_areas ?? align.aligned),
    underrepresented_areas: textArray(align.underrepresented_areas ?? align.underrepresented),
    missing_role_evidence: textArray(align.missing_role_evidence ?? align.missing),
    priority_changes: textArray(align.priority_changes ?? align.priority),
  };

  const strat = output.resume_strategy && typeof output.resume_strategy === 'object' ? output.resume_strategy as Record<string, unknown> : {};
  const resume_strategy = {
    emphasize: textArray(strat.emphasize),
    reduce: textArray(strat.reduce),
    reorder: textArray(strat.reorder),
    remove: textArray(strat.remove),
    add_if_true: textArray(strat.add_if_true ?? strat.add),
  };

  const plan = output.action_plan && typeof output.action_plan === 'object' ? output.action_plan as Record<string, unknown> : {};
  const action_plan = {
    fix_now: textArray(plan.fix_now),
    improve_next: textArray(plan.improve_next),
    optional_polish: textArray(plan.optional_polish),
  };

  return {
    analysis_source: output.analysis_source === 'deterministic_fallback' ? 'deterministic_fallback' : output.analysis_source === 'ai' ? 'ai' : undefined,
    analysis_version: typeof output.analysis_version === 'string' ? output.analysis_version : undefined,
    analysis_context_hash: typeof output.analysis_context_hash === 'string' ? output.analysis_context_hash : undefined,
    name: typeof output.name === 'string' ? output.name.slice(0, 200) : undefined,
    contact: {
      email: validEmail,
      phone: typeof contact.phone === 'string' ? contact.phone.slice(0, 40) : undefined,
      links: Array.isArray(contact.links) ? contact.links.filter((item): item is string => typeof item === 'string' && /^https?:\/\//.test(item)).slice(0, 10) : [],
    },
    location: typeof output.location === 'string' ? output.location.slice(0, 200) : undefined,
    summary: typeof output.summary === 'string' ? output.summary.slice(0, 1200) : undefined,
    education: textArray(output.education), skills: textArray(output.skills), projects: textArray(output.projects),
    experience: textArray(output.experience ?? output.work_experience), certifications: textArray(output.certifications), achievements: textArray(output.achievements),
    evidenced_skill_ids: uuidArray(output.evidenced_skill_ids ?? output.evidencedSkillIds),
    role_required_skill_ids: uuidArray(output.role_required_skill_ids ?? output.roleRequiredSkillIds),
    not_evidenced_skill_ids: uuidArray(output.not_evidenced_skill_ids ?? output.notEvidencedSkillIds),
    strengths: textArray(output.strengths), improvement_areas: textArray(output.improvement_areas ?? output.improvementAreas), suggestions: textArray(output.suggestions ?? output.recommendations),
    overall_assessment: (textValue(output.overall_assessment ?? output.overallAssessment) || 'The uploaded resume has been analyzed for target career fit.').slice(0, 900),
    biggest_opportunity: (textValue(output.biggest_opportunity ?? output.biggestOpportunity) || 'Focus on quantifying achievements and highlighting key role-relevant skills.').slice(0, 600),
    priority_issues,
    section_analysis,
    bullet_improvements,
    ats_keywords,
    career_alignment_analysis,
    resume_strategy,
    action_plan,
    reanalysis_focus: (textValue(output.reanalysis_focus ?? output.reanalysisFocus) || 'Review priority issues and bullet suggestions to align resume with target role requirements.').slice(0, 500),
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

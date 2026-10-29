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

function boundedTextArray(value: unknown, maxLen = 500, maxItems = 15): string[] {
  return textArray(value)
    .map((item) => item.trim().slice(0, maxLen))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
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

const CareerRecommendationItemSchemaBase = z.object({
  role_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(1).max(600),
  strengths: z.array(z.string().uuid()).max(10),
  missing_skill_ids: z.array(z.string().uuid()).max(20),
  confidence: z.number().min(0).max(1),
});

export const CareerRecommendationItemSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const item = value as Record<string, unknown>;
  // Some OpenAI-compatible models name this bounded catalog score `match_score`.
  // Normalize that equivalent field before the shared domain schema validates it.
  const normalized: Record<string, unknown> = { ...item };
  if (normalized.score === undefined && normalized.match_score !== undefined) {
    normalized.score = normalized.match_score;
  }
  if (typeof normalized.score === 'number' && Number.isFinite(normalized.score)) {
    normalized.score = Math.round(normalized.score);
  }
  if (typeof normalized.rationale === 'string' && normalized.rationale.length > 600) {
    normalized.rationale = normalized.rationale.slice(0, 600);
  }
  if (Array.isArray(normalized.strengths)) {
    normalized.strengths = uuidArray(normalized.strengths).slice(0, 10);
  }
  if (Array.isArray(normalized.missing_skill_ids)) {
    normalized.missing_skill_ids = uuidArray(normalized.missing_skill_ids).slice(0, 20);
  }
  if (typeof item.confidence === 'number' && item.confidence > 1) {
    normalized.confidence = item.confidence / 100;
  }
  return normalized;
}, CareerRecommendationItemSchemaBase) as unknown as z.ZodType<z.infer<typeof CareerRecommendationItemSchemaBase>>;

const CareerRecommendationsSchemaBase = z.object({
  recommendations: z.array(CareerRecommendationItemSchema).min(1).max(5),
});

export const CareerRecommendationsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return { recommendations: value };
  if (!value || typeof value !== 'object') return value;
  const output = value as Record<string, unknown>;
  // Keep the domain contract stable when a provider names the wrapper after the feature.
  const candidate = output.recommendations ?? output.career_recommendations ?? output.roles ?? output.results;
  if (Array.isArray(candidate)) {
    return { ...output, recommendations: candidate.slice(0, 5) };
  }
  return value;
}, CareerRecommendationsSchemaBase) as unknown as z.ZodType<z.infer<typeof CareerRecommendationsSchemaBase>>;

export type CareerRecommendationAIResult = z.infer<typeof CareerRecommendationsSchemaBase>;

const CareerIntelligenceSchemaBase = z.object({
  career_perspective: z.string().min(1).max(1200),
  career_setu_take: z.string().min(1).max(1200),
  why_fits: z.array(z.string().min(1).max(400)).min(1).max(5),
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
  learning_strategy: z.array(z.string().min(1).max(350)).min(1).max(6),
  caveats: z.array(z.string().min(1).max(300)).max(4),
});

export const CareerIntelligenceSchema = z.preprocess((value) => {
  const unwrapped = Array.isArray(value) ? value[0] : value;
  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) return value;
  const source = unwrapped as Record<string, unknown>;
  const nested = [source.career_intelligence, source.intelligence, source.analysis].find((item) => item && typeof item === 'object' && !Array.isArray(item));
  const raw = (nested && typeof nested === 'object' ? nested : source) as Record<string, unknown>;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {
    ...raw,
    career_perspective: typeof raw.career_perspective === 'string' ? raw.career_perspective.slice(0, 1200) : raw.career_perspective,
    career_setu_take: typeof raw.career_setu_take === 'string' ? raw.career_setu_take.slice(0, 1200) : raw.career_setu_take,
    why_fits: Array.isArray(raw.why_fits) ? textArray(raw.why_fits).map((s) => s.slice(0, 400)).slice(0, 5) : raw.why_fits,
    strengths: Array.isArray(raw.strengths) ? textArray(raw.strengths).map((s) => s.slice(0, 400)).slice(0, 6) : raw.strengths,
    weaknesses: Array.isArray(raw.weaknesses) ? textArray(raw.weaknesses).map((s) => s.slice(0, 400)).slice(0, 6) : raw.weaknesses,
    evidence_analysis: Array.isArray(raw.evidence_analysis)
      ? raw.evidence_analysis.slice(0, 8).map((item) => {
          if (!item || typeof item !== 'object') return item;
          const rec = item as Record<string, unknown>;
          return {
            observation: typeof rec.observation === 'string' ? rec.observation.slice(0, 300) : rec.observation,
            why_it_matters: typeof rec.why_it_matters === 'string' ? rec.why_it_matters.slice(0, 350) : rec.why_it_matters,
            evidence: typeof rec.evidence === 'string' ? rec.evidence.slice(0, 350) : rec.evidence,
            action: typeof rec.action === 'string' ? rec.action.slice(0, 350) : rec.action,
          };
        })
      : raw.evidence_analysis,
    strongest_evidence: Array.isArray(raw.strongest_evidence) ? textArray(raw.strongest_evidence).map((s) => s.slice(0, 300)).slice(0, 8) : raw.strongest_evidence,
    priority_gaps: Array.isArray(raw.priority_gaps)
      ? raw.priority_gaps
          .filter((item) => item && typeof item === 'object' && typeof (item as Record<string, unknown>).skill_id === 'string' && uuidRegex.test((item as Record<string, unknown>).skill_id as string))
          .slice(0, 6)
          .map((item) => {
            const rec = item as Record<string, unknown>;
            return {
              skill_id: rec.skill_id,
              skill_name: typeof rec.skill_name === 'string' ? rec.skill_name.slice(0, 100) : rec.skill_name,
              why_it_matters: typeof rec.why_it_matters === 'string' ? rec.why_it_matters.slice(0, 300) : rec.why_it_matters,
              first_step: typeof rec.first_step === 'string' ? rec.first_step.slice(0, 300) : rec.first_step,
              evidence_to_build: typeof rec.evidence_to_build === 'string' ? rec.evidence_to_build.slice(0, 300) : rec.evidence_to_build,
            };
          })
      : raw.priority_gaps,
    priority_improvements: Array.isArray(raw.priority_improvements) ? textArray(raw.priority_improvements).map((s) => s.slice(0, 400)).slice(0, 6) : raw.priority_improvements,
    next_action: typeof raw.next_action === 'string' ? raw.next_action.slice(0, 400) : raw.next_action,
    focus_first: typeof raw.focus_first === 'string' ? raw.focus_first.slice(0, 350) : raw.focus_first,
    material_readiness_improvement: typeof raw.material_readiness_improvement === 'string' ? raw.material_readiness_improvement.slice(0, 450) : raw.material_readiness_improvement,
    learning_strategy: Array.isArray(raw.learning_strategy) ? textArray(raw.learning_strategy).map((s) => s.slice(0, 350)).slice(0, 6) : raw.learning_strategy,
    caveats: Array.isArray(raw.caveats) ? textArray(raw.caveats).map((s) => s.slice(0, 300)).slice(0, 4) : raw.caveats,
  };
}, CareerIntelligenceSchemaBase) as unknown as z.ZodType<z.infer<typeof CareerIntelligenceSchemaBase>>;

export type CareerIntelligenceResult = z.infer<typeof CareerIntelligenceSchemaBase>;

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
  const rawWeek = weekNumber(item.week ?? item.week_number ?? item.weekNumber);
  const rawTitle = item.title ?? item.name ?? item.objective ?? item.focus ?? item.action;
  const rawDesc = item.description ?? item.details ?? item.task ?? item.objective ?? item.focus ?? item.action;
  return {
    week: typeof rawWeek === 'number' && Number.isFinite(rawWeek) ? Math.min(13, Math.max(1, Math.round(rawWeek))) : rawWeek,
    task_type: item.task_type ?? item.taskType ?? 'learning',
    title: typeof rawTitle === 'string' ? rawTitle.slice(0, 160) : rawTitle,
    description: typeof rawDesc === 'string' ? rawDesc.slice(0, 500) : rawDesc,
    skill_ids: uuidArray(item.skill_ids ?? item.skillIds ?? item.skills).slice(0, 6),
    course_ids: uuidArray(item.course_ids ?? item.courseIds ?? item.courses).slice(0, 3),
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
  const unwrapped = Array.isArray(value) ? value[0] : value;
  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) return value;
  const source = unwrapped as Record<string, unknown>;
  const nested = [source.roadmap, source.plan, source.roadmap_plan].find((item) => item && typeof item === 'object' && !Array.isArray(item));
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
    duration_days: 90,
    rationale: typeof (output.rationale ?? output.summary ?? output.overview) === 'string'
      ? String(output.rationale ?? output.summary ?? output.overview).slice(0, 600)
      : output.rationale ?? output.summary ?? output.overview,
    tasks: tasks.slice(0, 13),
  };
}, RoadmapSchemaBase) as unknown as z.ZodType<z.infer<typeof RoadmapSchemaBase>>;

export type RoadmapAIResult = z.infer<typeof RoadmapSchemaBase>;

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

  const rawPriorityIssues = Array.isArray(output.priority_issues)
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
      }).filter(Boolean).slice(0, 8)
    : [];
  const priority_issues = rawPriorityIssues.length > 0 ? rawPriorityIssues : [{
    title: 'Quantify project and experience outcomes',
    priority: 'high' as const,
    section: 'Projects' as const,
    problem: 'Key project and experience bullets can better highlight measurable outcomes and technical depth.',
    why_it_matters: 'Specific, verifiable outcomes help recruiters evaluate real-world engineering impact.',
    recommended_change: 'Add concrete scope, tools used, and verified metrics where available.',
  }];

  const rawSectionAnalysis = Array.isArray(output.section_analysis)
    ? output.section_analysis.map((item) => {
        if (!item || typeof item !== 'object') return null;
        const rec = item as Record<string, unknown>;
        return {
          section: normalizeSectionName(rec.section),
          status: normalizeSectionStatus(rec.status),
          what_works: boundedTextArray(rec.what_works ?? rec.strengths, 500, 15),
          what_is_weak: boundedTextArray(rec.what_is_weak ?? rec.weaknesses, 500, 15),
          recommended_improvement: boundedTextArray(rec.recommended_improvement ?? rec.improvements ?? rec.recommendations, 500, 15),
        };
      }).filter(Boolean).slice(0, 8)
    : [];
  const section_analysis = rawSectionAnalysis.length > 0 ? rawSectionAnalysis : [{
    section: 'Projects' as const,
    status: 'needs_work' as const,
    what_works: ['Core technical stack and project titles are present.'],
    what_is_weak: ['Outcome metrics and architectural specifics can be clearer.'],
    recommended_improvement: ['Highlight technical decisions and verified outcomes in each bullet.'],
  }];

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
          missing_information: boundedTextArray(rec.missing_information ?? rec.missing, 500, 15),
        };
      }).filter(Boolean).slice(0, 10)
    : [];

  const ats = output.ats_keywords && typeof output.ats_keywords === 'object' ? output.ats_keywords as Record<string, unknown> : {};
  const ats_keywords = {
    present: boundedTextArray(ats.present ?? ats.found, 500, 15),
    weak_or_missing: boundedTextArray(ats.weak_or_missing ?? ats.missing, 500, 15),
    placement_suggestions: boundedTextArray(ats.placement_suggestions ?? ats.placement, 500, 15),
    formatting_concerns: boundedTextArray(ats.formatting_concerns ?? ats.formatting, 500, 15),
    ordering_suggestions: boundedTextArray(ats.ordering_suggestions ?? ats.ordering, 500, 15),
  };

  const align = output.career_alignment_analysis && typeof output.career_alignment_analysis === 'object' ? output.career_alignment_analysis as Record<string, unknown> : {};
  const career_alignment_analysis = {
    aligned_areas: boundedTextArray(align.aligned_areas ?? align.aligned, 500, 15),
    underrepresented_areas: boundedTextArray(align.underrepresented_areas ?? align.underrepresented, 500, 15),
    missing_role_evidence: boundedTextArray(align.missing_role_evidence ?? align.missing, 500, 15),
    priority_changes: boundedTextArray(align.priority_changes ?? align.priority, 500, 15),
  };

  const strat = output.resume_strategy && typeof output.resume_strategy === 'object' ? output.resume_strategy as Record<string, unknown> : {};
  const resume_strategy = {
    emphasize: boundedTextArray(strat.emphasize, 500, 15),
    reduce: boundedTextArray(strat.reduce, 500, 15),
    reorder: boundedTextArray(strat.reorder, 500, 15),
    remove: boundedTextArray(strat.remove, 500, 15),
    add_if_true: boundedTextArray(strat.add_if_true ?? strat.add, 500, 15),
  };

  const plan = output.action_plan && typeof output.action_plan === 'object' ? output.action_plan as Record<string, unknown> : {};
  const action_plan = {
    fix_now: boundedTextArray(plan.fix_now, 500, 15),
    improve_next: boundedTextArray(plan.improve_next, 500, 15),
    optional_polish: boundedTextArray(plan.optional_polish, 500, 15),
  };

  return {
    analysis_source: output.analysis_source === 'deterministic_fallback' ? 'deterministic_fallback' : output.analysis_source === 'ai' ? 'ai' : undefined,
    analysis_version: typeof output.analysis_version === 'string' ? output.analysis_version.slice(0, 80) : undefined,
    analysis_context_hash: typeof output.analysis_context_hash === 'string' ? output.analysis_context_hash : undefined,
    name: typeof output.name === 'string' ? output.name.slice(0, 200) : undefined,
    contact: {
      email: validEmail,
      phone: typeof contact.phone === 'string' ? contact.phone.slice(0, 40) : undefined,
      links: Array.isArray(contact.links) ? contact.links.filter((item): item is string => typeof item === 'string' && /^https?:\/\//.test(item)).slice(0, 10) : [],
    },
    location: typeof output.location === 'string' ? output.location.slice(0, 200) : undefined,
    summary: typeof output.summary === 'string' ? output.summary.slice(0, 1200) : undefined,
    education: boundedTextArray(output.education, 300, 10),
    skills: boundedTextArray(output.skills, 100, 50),
    projects: boundedTextArray(output.projects, 500, 20),
    experience: boundedTextArray(output.experience ?? output.work_experience, 500, 20),
    certifications: boundedTextArray(output.certifications, 300, 20),
    achievements: boundedTextArray(output.achievements, 300, 20),
    evidenced_skill_ids: idArray(output.evidenced_skill_ids ?? output.evidencedSkillIds).slice(0, 50),
    role_required_skill_ids: idArray(output.role_required_skill_ids ?? output.roleRequiredSkillIds).slice(0, 50),
    not_evidenced_skill_ids: idArray(output.not_evidenced_skill_ids ?? output.notEvidencedSkillIds).slice(0, 50),
    strengths: boundedTextArray(output.strengths, 300, 10),
    improvement_areas: boundedTextArray(output.improvement_areas ?? output.improvementAreas, 300, 10),
    suggestions: boundedTextArray(output.suggestions ?? output.recommendations, 400, 15),
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
  const unwrapped = Array.isArray(value) ? value[0] : value;
  if (!unwrapped || typeof unwrapped !== 'object') return value;
  const source = unwrapped as Record<string, unknown>;
  const nested = [source.question, source.interview_question].find((item) => item && typeof item === 'object');
  const output = (nested && typeof nested === 'object' ? nested : source) as Record<string, unknown>;
  const rawQuestion = output.question ?? output.prompt ?? output.text;
  const rawSkillId = output.focus_skill_id ?? output.focusSkillId ?? null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {
    question: typeof rawQuestion === 'string' ? rawQuestion.slice(0, 500) : rawQuestion,
    category: output.category ?? 'role_specific',
    focus_skill_id: typeof rawSkillId === 'string' && uuidRegex.test(rawSkillId) ? rawSkillId : null,
  };
}, InterviewQuestionSchemaBase) as unknown as z.ZodType<z.infer<typeof InterviewQuestionSchemaBase>>;
const InterviewEvaluationSchemaBase = z.object({ rubric_score: z.number().int().min(0).max(100), correctness: z.number().int().min(0).max(100), relevance: z.number().int().min(0).max(100), depth: z.number().int().min(0).max(100), clarity: z.number().int().min(0).max(100), feedback: z.string().min(1).max(700) });
export const InterviewEvaluationSchema = z.preprocess((value) => {
  const unwrapped = Array.isArray(value) ? value[0] : value;
  if (!unwrapped || typeof unwrapped !== 'object') return value;
  const raw = unwrapped as Record<string, unknown>;
  const roundInt = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : v;
  return {
    rubric_score: roundInt(raw.rubric_score),
    correctness: roundInt(raw.correctness),
    relevance: roundInt(raw.relevance),
    depth: roundInt(raw.depth),
    clarity: roundInt(raw.clarity),
    feedback: typeof raw.feedback === 'string' ? raw.feedback.slice(0, 700) : raw.feedback,
  };
}, InterviewEvaluationSchemaBase) as unknown as z.ZodType<z.infer<typeof InterviewEvaluationSchemaBase>>;
const InterviewReportSchemaBase = z.object({ overall_score: z.number().int().min(0).max(100), strengths: z.array(z.string().max(300)).max(10), areas_to_improve: z.array(z.string().max(300)).max(10), feedback_summary: z.string().min(1).max(700), recommendations: z.array(z.string().max(300)).max(10) });
export const InterviewReportSchema = z.preprocess((value) => {
  const unwrapped = Array.isArray(value) ? value[0] : value;
  if (!unwrapped || typeof unwrapped !== 'object') return value;
  const raw = unwrapped as Record<string, unknown>;
  return {
    overall_score: typeof raw.overall_score === 'number' && Number.isFinite(raw.overall_score) ? Math.round(raw.overall_score) : raw.overall_score,
    strengths: Array.isArray(raw.strengths) ? textArray(raw.strengths).map((s) => s.slice(0, 300)).slice(0, 10) : raw.strengths,
    areas_to_improve: Array.isArray(raw.areas_to_improve) ? textArray(raw.areas_to_improve).map((s) => s.slice(0, 300)).slice(0, 10) : raw.areas_to_improve,
    feedback_summary: typeof raw.feedback_summary === 'string' ? raw.feedback_summary.slice(0, 700) : raw.feedback_summary,
    recommendations: Array.isArray(raw.recommendations) ? textArray(raw.recommendations).map((s) => s.slice(0, 300)).slice(0, 10) : raw.recommendations,
  };
}, InterviewReportSchemaBase) as unknown as z.ZodType<z.infer<typeof InterviewReportSchemaBase>>;

// Reusable AI Analysis Contract Wrapper
export interface AIAnalysisResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  model: string;
  latencyMs: number;
}

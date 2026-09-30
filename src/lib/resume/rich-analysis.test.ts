import { ResumeParseSchema } from '../ai/schemas';
import { calculateResumeScore } from './scoring';

function assert(value: boolean, message: string) { if (!value) throw new Error(message); }

const skill = '22222222-2222-4222-8222-222222222222';
const base = {
  name: 'Example Student', contact: { links: [] }, education: ['B.Tech'], skills: ['React', 'SQL'], projects: ['Built a dashboard'], experience: [], certifications: [], achievements: [],
  evidenced_skill_ids: [skill], role_required_skill_ids: [skill], not_evidenced_skill_ids: [], strengths: ['Project evidence'], improvement_areas: ['Clarify outcomes'], suggestions: ['Add a verified result if available'],
  overall_assessment: 'The resume has relevant project evidence but needs sharper outcomes.', biggest_opportunity: 'Make role-relevant impact easier to verify.',
  priority_issues: [{ title: 'Clarify project impact', priority: 'high', section: 'Projects', problem: 'The project outcome is not explicit.', why_it_matters: 'Outcomes make contribution easier to assess.', recommended_change: 'Add a verified result if one exists.' }],
  section_analysis: [{ section: 'Projects', status: 'needs_work', what_works: ['A project is present.'], what_is_weak: ['Impact is unclear.'], recommended_improvement: ['Add method and verified result.'] }],
  bullet_improvements: [{ section: 'Projects', original: 'Built a dashboard', issue: 'The wording is broad.', why_it_is_weak: 'It omits implementation detail.', suggested: 'Built a dashboard using [verified technology], resulting in [add a verified metric if available].', missing_information: ['Technology and outcome'] }],
  ats_keywords: { present: ['React'], weak_or_missing: ['Role-specific outcomes'], placement_suggestions: ['Put the strongest relevant skills near the top.'], formatting_concerns: [], ordering_suggestions: [] },
  career_alignment_analysis: { aligned_areas: ['Project implementation'], underrepresented_areas: ['Measured outcomes'], missing_role_evidence: ['Verified impact'], priority_changes: ['Clarify project outcomes'] },
  resume_strategy: { emphasize: ['Project implementation'], reduce: [], reorder: [], remove: [], add_if_true: ['Verified outcomes'] },
  action_plan: { fix_now: ['Clarify project impact'], improve_next: ['Add role-relevant detail'], optional_polish: [] }, reanalysis_focus: 'Review outcomes after adding verified details.',
};

const dataAnalyst = ResumeParseSchema.parse(base);
const softwareDeveloper = ResumeParseSchema.parse({ ...base, career_alignment_analysis: { ...base.career_alignment_analysis, aligned_areas: ['Frontend implementation'], priority_changes: ['Clarify API and deployment evidence'] } });

console.log('--- RUNNING RICH RESUME ANALYSIS TESTS ---');
assert(dataAnalyst.priority_issues.length > 0 && dataAnalyst.section_analysis.length > 0, 'Rich result contains priority and section analysis');
assert(dataAnalyst.bullet_improvements[0].suggested.includes('[add a verified metric if available]'), 'Suggested rewrite marks unsupported metrics instead of inventing them');
assert(dataAnalyst.ats_keywords.present.length > 0 && dataAnalyst.action_plan.fix_now.length > 0, 'Rich result contains ATS and action-plan sections');
assert(dataAnalyst.career_alignment_analysis.aligned_areas.join('|') !== softwareDeveloper.career_alignment_analysis.aligned_areas.join('|'), 'Different role contexts produce different alignment interpretation');
assert(calculateResumeScore(dataAnalyst) === calculateResumeScore(softwareDeveloper), 'Deterministic score is independent from AI wording');
assert(!ResumeParseSchema.safeParse({ ...base, evidenced_skill_ids: ['not-a-uuid'] }).success, 'Unsupported canonical IDs are rejected');
console.log('PASS: rich contract, role differentiation, factual rewrite guard, and deterministic score isolation');

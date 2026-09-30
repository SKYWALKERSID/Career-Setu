'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { FileText, Lightbulb, RefreshCw } from 'lucide-react';
import { getLatestResume, triggerResumeAiAnalysis, uploadAndAnalyzeResume } from '@/lib/resume/actions';
import type { ResumeParsedData } from '@/lib/resume/types';
import { calculateResumeBreakdown } from '@/lib/resume/scoring';
import { getDashboardData } from '@/lib/dashboard/queries';

type ResumeRecord = { id?: string; score: number | null; version: number; parsed_json?: ResumeParsedData | null };

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><h3 className="text-base font-semibold text-[#10285a]">{title}</h3>{items.length ? <ul className="mt-2 space-y-1.5">{items.map((item, index) => <li key={`${item}-${index}`} className="text-sm leading-5 text-slate-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">{empty}</p>}</div>;
}

function RichResumeReview({ parsed, careerTitle }: { parsed: ResumeParsedData; careerTitle: string }) {
  const issues = parsed.priority_issues || [];
  const sections = parsed.section_analysis || [];
  const bullets = parsed.bullet_improvements || [];
  const ats = parsed.ats_keywords;
  const alignment = parsed.career_alignment_analysis;
  const plan = parsed.action_plan;
  const isAi = parsed.analysis_source === 'ai';
  const assessmentFallback = isAi
    ? 'The detailed analysis is available below.'
    : 'Deterministic review is available. Generate a deep AI analysis for detailed career-specific improvement guidance.';
  return <div className="space-y-4">
    <div className="portal-panel p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">Overall assessment</p><h2 className="mt-2 text-xl font-bold text-[#10285a]">What your resume is communicating today</h2><p className="mt-3 text-sm leading-6 text-slate-700">{parsed.overall_assessment || assessmentFallback}</p>{parsed.biggest_opportunity && <p className="mt-3 border-l-2 border-[#1769d4] pl-3 text-sm leading-6 text-slate-700"><strong className="text-[#10285a]">Biggest opportunity:</strong> {parsed.biggest_opportunity}</p>}</div>
    <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Top changes to make</h2><div className="mt-4 space-y-4">{issues.length ? issues.map((issue, index) => <article key={`${issue.title}-${index}`} className="border-l-2 border-[#1769d4] pl-4"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">Priority {index + 1}</span><span className="text-xs text-slate-400">{issue.priority} · {issue.section}</span><h3 className="w-full text-base font-semibold text-[#10285a]">{issue.title}</h3></div><p className="mt-2 text-sm text-slate-700"><strong>Problem:</strong> {issue.problem}</p><p className="mt-1 text-sm text-slate-700"><strong>Why it matters:</strong> {issue.why_it_matters}</p><p className="mt-1 text-sm text-slate-700"><strong>Suggested change:</strong> {issue.recommended_change}</p></article>) : <ListBlock title="" items={parsed.improvement_areas} empty="No prioritized issues are available." />}</div></div>
    <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Section-by-section review</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{sections.length ? sections.map((section, index) => <article key={`${section.section}-${index}`} className="border border-[#e1eaf3] p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-[#10285a]">{section.section}</h3><span className="text-[11px] font-semibold uppercase tracking-wider text-[#1559c7]">{section.status.replace('_', ' ')}</span></div><ListBlock title="What works" items={section.what_works} empty="No strengths recorded." /><div className="mt-3"><ListBlock title="What is weak" items={section.what_is_weak} empty="No weakness recorded." /></div><div className="mt-3"><ListBlock title="Improve" items={section.recommended_improvement} empty="No specific improvement recorded." /></div></article>) : <p className="text-sm text-slate-500">Detailed section review will appear after a deep AI analysis is generated.</p>}</div></div>
    {bullets.length > 0 && <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Bullet improvements</h2><div className="mt-4 space-y-4">{bullets.map((bullet, index) => <article key={`${bullet.original}-${index}`} className="border border-[#e1eaf3] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">{bullet.section}</p><p className="mt-2 text-sm text-slate-700"><strong>Current:</strong> {bullet.original}</p><p className="mt-1 text-sm text-slate-700"><strong>Issue:</strong> {bullet.issue}</p><p className="mt-1 text-sm text-slate-700"><strong>Why:</strong> {bullet.why_it_is_weak}</p><p className="mt-1 text-sm text-slate-700"><strong>Suggested:</strong> {bullet.suggested}</p>{bullet.missing_information.length > 0 && <p className="mt-1 text-xs text-slate-500"><strong>Missing information:</strong> {bullet.missing_information.join(' ')}</p>}</article>)}</div></div>}
    {ats && <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">ATS & keyword review</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><ListBlock title="Present" items={ats.present} empty="No role keywords were identified." /><ListBlock title="Weak or missing" items={ats.weak_or_missing} empty="No keyword gaps recorded." /><ListBlock title="Placement suggestions" items={ats.placement_suggestions} empty="No placement suggestions recorded." /><ListBlock title="Formatting and ordering" items={[...ats.formatting_concerns, ...ats.ordering_suggestions]} empty="No formatting concerns recorded." /></div></div>}
    {alignment && <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Career fit — {careerTitle}</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><ListBlock title="Aligned areas" items={alignment.aligned_areas} empty="No aligned areas recorded." /><ListBlock title="Underrepresented areas" items={alignment.underrepresented_areas} empty="No underrepresented areas recorded." /><ListBlock title="Missing role evidence" items={alignment.missing_role_evidence} empty="No missing evidence recorded." /><ListBlock title="Priority changes" items={alignment.priority_changes} empty="No priority changes recorded." /></div></div>}
    {plan && <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">What to fix next</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><ListBlock title="Fix now" items={plan.fix_now} empty="No urgent fixes recorded." /><ListBlock title="Improve next" items={plan.improve_next} empty="No next improvements recorded." /><ListBlock title="Optional polish" items={plan.optional_polish} empty="No optional polish recorded." /></div></div>}
  </div>;
}

export default function ResumePage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f4f8fc]"><LoadingState label="Loading resume..." /></div>}><ResumeContent /></Suspense>;
}

function ResumeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCareer = searchParams.get('career') || '';
  const inputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [targetCareers, setTargetCareers] = useState<Array<{ id: string; title: string }>>([]);
  const [activeCareer, setActiveCareer] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const dashboard = await getDashboardData(requestedCareer || undefined);
    if (dashboard.success && dashboard.data) {
      setTargetCareers(dashboard.data.targetCareers);
      const role = dashboard.data.targetCareer;
      setActiveCareer(role);
      if (!requestedCareer && role) router.replace(`/resume?career=${encodeURIComponent(role.id)}`);
      const result = await getLatestResume(role?.id);
      if (result.success) setResume(result.resume as ResumeRecord | null);
      else setError(result.error || 'Resume could not be loaded.');
    } else setError(dashboard.error || 'Resume context could not be loaded.');
    setLoading(false);
  }, [requestedCareer, router]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || busy) return;
    // Capture whether old data exists BEFORE the upload attempt.
    // After upload fails, refresh() will reload old data into `resume` state.
    // Without this check, the red error from the failed NEW upload would sit
    // alongside the OLD resume data — creating a contradictory UI.
    const hadPreviousResume = Boolean(resume?.parsed_json);
    setBusy(true);
    setError('');
    setWarning('');
    const form = new FormData();
    form.set('file', file);
    const result = await uploadAndAnalyzeResume(form, activeCareer?.id || requestedCareer, false);

    if (!result.success) {
      // Upload/extraction failed
      if (hadPreviousResume) {
        // Old resume exists — show as amber WARNING, not red error.
        // The old data remains displayed and should not appear broken.
        setWarning(`New upload could not be processed: ${result.error || 'Resume processing failed.'} Your previous analysis is still displayed below.`);
      } else {
        // No old data — show as red error
        setError(result.error || 'Resume processing failed.');
      }
    } else if (result.warning) {
      // Upload succeeded but AI analysis unavailable
      setWarning(result.warning);
    }

    await refresh();
    setBusy(false);
    event.target.value = '';
  }

  async function handleTriggerAiAnalysis(force = false) {
    if (busy) return;
    setBusy(true);
    setError('');
    setWarning('');
    const result = await triggerResumeAiAnalysis(resume?.id, activeCareer?.id, force);
    if (!result.success) {
      // AI failed but deterministic data remains perfectly available.
      // Show as amber WARNING, not red error.
      setWarning(result.error || 'Deep AI analysis is currently unavailable. Deterministic review remains displayed.');
    }
    await refresh();
    setBusy(false);
  }

  const parsed = resume?.parsed_json;
  const score = resume?.score ?? null;
  const aiFallback = parsed?.analysis_source === 'deterministic_fallback';
  const breakdown = parsed ? calculateResumeBreakdown(parsed) : null;
  const scoreItems = [['Completeness', breakdown?.completeness ?? null], ['Content quality', breakdown?.content ?? null], ['ATS / readability', breakdown?.ats ?? null], ['Skill evidence', breakdown?.skills ?? null], ['Career alignment', breakdown?.alignment ?? null]] as const;

  return <div className="flex min-h-screen bg-[#f4f8fc]"><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><TopNav /><main className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
    <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Resume Copilot' }]} />
    <section className="relative mt-2 overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#e9f3fb] bg-cover bg-center" style={{ backgroundImage: "url('/resume-hero.jpg')" }}><div className="absolute inset-0 bg-gradient-to-r from-[#edf6fd]/98 via-[#edf6fd]/88 to-transparent" /><div className="relative max-w-[700px] px-7 py-7 sm:px-10 sm:py-8"><p className="text-xs font-bold tracking-widest text-[#1d5bb5]">RESUME COPILOT</p><h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#10285a] sm:text-4xl">Career-Aware Resume Intelligence</h1><p className="mt-3 max-w-[560px] text-base leading-6 text-[#46627f]">What does this resume prove for the career you are pursuing? CareerSetu extracts the facts, maps canonical skills, identifies missing evidence, and recommends next actions without inventing information.</p></div></section>
    {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {warning && <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{warning}</div>}
    {aiFallback && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-blue-200 bg-blue-50 p-3"><div className="text-sm text-blue-800">Deep AI analysis has not been generated yet for <strong>{activeCareer?.title || 'this target career'}</strong>. The deterministic review and score below are based on your previously uploaded resume (version {resume?.version}).</div><Button onClick={() => handleTriggerAiAnalysis(false)} disabled={busy} className="h-8 shrink-0 rounded bg-[#1769d4] px-4 text-xs font-semibold text-white">{busy ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}Generate Deep AI Analysis</Button></div>}
    <section className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[#dce7f2] bg-white p-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">Target career</p><p className="mt-1 text-xs text-slate-500">Role alignment is calculated against this canonical career and its required skills.</p></div>{targetCareers.length ? <select aria-label="Target career for resume analysis" value={activeCareer?.id || ''} onChange={(event) => router.push(`/resume?career=${encodeURIComponent(event.target.value)}`)} className="h-10 min-w-[220px] border border-[#cbdbea] bg-white px-3 text-sm font-semibold text-[#10285a]">{targetCareers.map((career) => <option key={career.id} value={career.id}>{career.title}</option>)}</select> : <strong className="text-sm text-slate-600">No target career selected.</strong>}</section>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf,text/plain,.txt" className="hidden" onChange={handleUpload} />
    {loading ? <div className="mt-6"><LoadingState label="Loading resume intelligence..." /></div> : !resume || !parsed ? <div className="mt-6 border border-[#dce7f2] bg-white p-6"><EmptyState icon={<FileText className="h-8 w-8 text-slate-400" />} title="No analyzed resume yet" description="Upload a PDF or plain-text resume to see fact-preserving evidence and role-aligned suggestions." actionLabel="Upload Resume" onAction={() => inputRef.current?.click()} /></div> : <>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="space-y-4"><div className="portal-panel p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">Resume Copilot analysis</p><h2 className="mt-1 text-xl font-bold text-[#10285a]">Deep review for {activeCareer?.title || 'your target career'}</h2><p className="mt-1 text-xs text-slate-500">Diagnosis, career alignment, and concrete improvements grounded in the uploaded resume.</p></div><div className="flex flex-wrap items-center gap-2">{aiFallback ? <Button onClick={() => handleTriggerAiAnalysis(false)} disabled={busy} className="h-9 rounded bg-[#1769d4] px-4 text-xs font-semibold text-white">{busy ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}Generate AI Analysis</Button> : <Button onClick={() => handleTriggerAiAnalysis(true)} disabled={busy} variant="outline" className="h-9 rounded border-[#1769d4] px-4 text-xs font-semibold text-[#1769d4]">{busy ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}Regenerate Analysis</Button>}<Button onClick={() => inputRef.current?.click()} disabled={busy} className="h-9 rounded bg-slate-800 px-4 text-xs font-semibold text-white">{busy ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}Upload New Version</Button></div></div></div><RichResumeReview parsed={parsed} careerTitle={activeCareer?.title || 'selected career'} /><details className="portal-panel p-5"><summary className="cursor-pointer text-lg font-bold text-[#10285a]">Parsed resume facts</summary><div className="mt-4 grid gap-5 sm:grid-cols-2"><ListBlock title="Education" items={parsed.education} empty="No education evidence found." /><ListBlock title="Experience" items={parsed.experience} empty="No work experience evidence found." /><ListBlock title="Projects" items={parsed.projects} empty="No project evidence found." /><ListBlock title="Technical skills" items={parsed.skills} empty="No technical skills evidenced." /><ListBlock title="Achievements" items={parsed.achievements} empty="No achievement evidence found." /><ListBlock title="Contact" items={[parsed.contact.email, parsed.contact.phone, parsed.location].filter((item): item is string => Boolean(item))} empty="No contact details found." /></div></details>
      </section><aside className="space-y-4"><div className="portal-panel p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#10285a]">Resume Intelligence Score</h2><span className="text-xs text-slate-400">v{resume.version}</span></div><div className="mt-4 flex items-center gap-4"><div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#1769d4 ${score ?? 0}%, #e7eef6 0)` }}><div className="grid h-14 w-14 place-items-center rounded-full bg-white"><strong className="text-xl text-[#10285a]">{score ?? '—'}</strong><span className="text-xs text-slate-400">{score === null ? 'Pending' : '/100'}</span></div></div><div className="flex-1 space-y-2">{scoreItems.map(([label, value]) => <div key={label} className="flex items-center gap-2 text-xs"><span className="w-28 text-slate-500">{label}</span><div className="h-1.5 flex-1 rounded bg-[#e6edf5]"><div className="h-full rounded bg-[#73aaf0]" style={{ width: `${value ?? 0}%` }} /></div><span className="w-7 text-right font-semibold text-slate-600">{value ?? '—'}</span></div>)}</div></div><p className="mt-4 text-xs leading-5 text-slate-500">This is a deterministic resume-quality and target-alignment assessment, not a hiring probability or readiness decision.</p></div><div className="portal-panel bg-[#edf6ff] p-5"><div className="flex items-start gap-3"><Lightbulb className="h-5 w-5 shrink-0 text-[#1769d4]" /><div><h2 className="text-lg font-bold text-[#10285a]">{aiFallback ? 'Deterministic review' : 'CareerSetu AI Take'}</h2><p className="mt-2 text-xs leading-5 text-slate-700">{parsed.reanalysis_focus || parsed.biggest_opportunity || parsed.suggestions[0] || 'Use the prioritized review to improve the resume for this career.'}</p></div></div></div></aside></div><p className="mt-4 text-right text-xs text-slate-400">Version {resume.version} · Previous versions remain preserved in private storage.</p>
    </>}
  </main></div></div>;
}

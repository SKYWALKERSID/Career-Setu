'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { CheckCircle2, FileText, Lightbulb, RefreshCw } from 'lucide-react';
import { getLatestResume, uploadAndAnalyzeResume } from '@/lib/resume/actions';
import type { ResumeParsedData } from '@/lib/resume/types';
import { calculateResumeBreakdown } from '@/lib/resume/scoring';
import { getDashboardData } from '@/lib/dashboard/queries';

type ResumeRecord = { id?: string; score: number | null; version: number; parsed_json?: ResumeParsedData | null };

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><h3 className="text-base font-semibold text-[#10285a]">{title}</h3>{items.length ? <ul className="mt-2 space-y-1.5">{items.map((item, index) => <li key={`${item}-${index}`} className="text-sm leading-5 text-slate-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">{empty}</p>}</div>;
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
  const [forceReanalysis, setForceReanalysis] = useState(false);
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
    setBusy(true);
    setError('');
    const form = new FormData();
    form.set('file', file);
    const result = await uploadAndAnalyzeResume(form, activeCareer?.id || requestedCareer, forceReanalysis);
    if (!result.success) setError(result.error || 'Resume processing failed.');
    await refresh();
    setBusy(false);
    setForceReanalysis(false);
    event.target.value = '';
  }

  const parsed = resume?.parsed_json;
  const score = resume?.score ?? null;
  const aiFallback = parsed?.analysis_source === 'deterministic_fallback';
  const breakdown = parsed ? calculateResumeBreakdown(parsed) : null;
  const scoreItems = [['Completeness', breakdown?.completeness ?? null], ['Content quality', breakdown?.content ?? null], ['ATS / readability', breakdown?.ats ?? null], ['Skill evidence', breakdown?.skills ?? null], ['Career alignment', breakdown?.alignment ?? null]] as const;

  return <div className="flex min-h-screen bg-[#f4f8fc]"><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><TopNav /><main className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
    <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Resume Copilot' }]} />
    <section className="relative mt-2 overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#e9f3fb] bg-cover bg-center" style={{ backgroundImage: "url('/resume-hero.jpg')" }}><div className="absolute inset-0 bg-gradient-to-r from-[#edf6fd]/98 via-[#edf6fd]/88 to-transparent" /><div className="relative max-w-[700px] px-7 py-7 sm:px-10 sm:py-8"><p className="text-xs font-bold tracking-widest text-[#1d5bb5]">RESUME COPILOT</p><h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#10285a] sm:text-4xl">Career-Aware Resume Intelligence</h1><p className="mt-3 max-w-[560px] text-base leading-6 text-[#46627f]">What does this resume prove for the career you are pursuing? CareerSetu extracts the facts, maps canonical skills, identifies missing evidence, and recommends next actions without inventing information.</p></div></section>
    {error && <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    {aiFallback && <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">AI interpretation is unavailable for this analysis. Deterministic extraction, score, canonical skill evidence, and career alignment remain available.</div>}
    <section className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[#dce7f2] bg-white p-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">Target career</p><p className="mt-1 text-xs text-slate-500">Role alignment is calculated against this canonical career and its required skills.</p></div>{targetCareers.length ? <select aria-label="Target career for resume analysis" value={activeCareer?.id || ''} onChange={(event) => router.push(`/resume?career=${encodeURIComponent(event.target.value)}`)} className="h-10 min-w-[220px] border border-[#cbdbea] bg-white px-3 text-sm font-semibold text-[#10285a]">{targetCareers.map((career) => <option key={career.id} value={career.id}>{career.title}</option>)}</select> : <strong className="text-sm text-slate-600">No target career selected.</strong>}</section>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf,text/plain,.txt" className="hidden" onChange={handleUpload} />
    {loading ? <div className="mt-6"><LoadingState label="Loading resume intelligence..." /></div> : !resume || !parsed ? <div className="mt-6 border border-[#dce7f2] bg-white p-6"><EmptyState icon={<FileText className="h-8 w-8 text-slate-400" />} title="No analyzed resume yet" description="Upload a PDF or plain-text resume to see fact-preserving evidence and role-aligned suggestions." actionLabel="Upload Resume" onAction={() => inputRef.current?.click()} /></div> : <>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="space-y-4">
        <div className="portal-panel p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1559c7]">Evidence from my resume</p><h2 className="mt-1 text-xl font-bold text-[#10285a]">{parsed.name || 'Resume facts'}</h2><p className="mt-1 text-xs text-slate-500">Parsed from the uploaded source. Missing information remains unknown.</p></div><Button onClick={() => inputRef.current?.click()} disabled={busy} className="h-9 rounded bg-[#1769d4] px-4 text-xs font-semibold">{busy ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}Upload New Version</Button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="field"><span>Email</span><strong>{parsed.contact.email || 'Not evidenced'}</strong></div><div className="field"><span>Phone</span><strong>{parsed.contact.phone || 'Not evidenced'}</strong></div><div className="field"><span>Location</span><strong>{parsed.location || 'Not evidenced'}</strong></div><div className="field"><span>LinkedIn</span><strong>{parsed.contact.links.length ? parsed.contact.links.join(' · ') : 'Not evidenced'}</strong></div><div className="field sm:col-span-2"><span>Summary</span><strong>{parsed.summary || 'No summary evidence found'}</strong></div></div></div>
        <div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Resume evidence</h2><div className="mt-4 grid gap-5 sm:grid-cols-2"><ListBlock title="Education" items={parsed.education} empty="No education evidence found." /><ListBlock title="Experience" items={parsed.experience} empty="No work experience evidence found." /><ListBlock title="Projects" items={parsed.projects} empty="No project evidence found." /><ListBlock title="Technical skills" items={parsed.skills} empty="No technical skills evidenced." /><ListBlock title="Achievements & extracurriculars" items={parsed.achievements} empty="No achievement evidence found." /></div></div>
        <div className="grid gap-4 md:grid-cols-3"><div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">What is strong</h2><ListBlock title="" items={parsed.strengths} empty="No strengths identified." /></div><div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Target career fit</h2><p className="mt-2 text-xs leading-5 text-slate-600">{activeCareer?.title || 'Selected career'} alignment uses canonical role skills and resume evidence.</p><ListBlock title="Skill gaps / weak evidence" items={parsed.improvement_areas} empty="No role-specific gaps identified." /></div><div className="portal-panel p-5"><h2 className="text-lg font-bold text-[#10285a]">Priority actions</h2><ListBlock title="Next actions" items={parsed.suggestions} empty="No actions available." /></div></div>
      </section><aside className="space-y-4"><div className="portal-panel p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-[#10285a]">Resume Intelligence Score</h2><span className="text-xs text-slate-400">v{resume.version}</span></div><div className="mt-4 flex items-center gap-4"><div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#1769d4 ${score ?? 0}%, #e7eef6 0)` }}><div className="grid h-14 w-14 place-items-center rounded-full bg-white"><strong className="text-xl text-[#10285a]">{score ?? '—'}</strong><span className="text-xs text-slate-400">{score === null ? 'Pending' : '/100'}</span></div></div><div className="flex-1 space-y-2">{scoreItems.map(([label, value]) => <div key={label} className="flex items-center gap-2 text-xs"><span className="w-28 text-slate-500">{label}</span><div className="h-1.5 flex-1 rounded bg-[#e6edf5]"><div className="h-full rounded bg-[#73aaf0]" style={{ width: `${value ?? 0}%` }} /></div><span className="w-7 text-right font-semibold text-slate-600">{value ?? '—'}</span></div>)}</div></div><p className="mt-4 text-xs leading-5 text-slate-500">This is a deterministic resume-quality and target-alignment assessment, not a hiring probability or readiness decision. The score is reproducible from the extracted evidence.</p></div><div className="portal-panel bg-[#edf6ff] p-5"><div className="flex items-start gap-3"><Lightbulb className="h-5 w-5 shrink-0 text-[#1769d4]" /><div><h2 className="text-lg font-bold text-[#10285a]">{aiFallback ? 'Deterministic CareerSetu Take' : 'CareerSetu AI Take'}</h2>{parsed.suggestions.length ? <ul className="mt-3 space-y-2">{parsed.suggestions.slice(0, 5).map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-700"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No suggestions are available.</p>}</div></div></div></aside></div><p className="mt-4 text-right text-xs text-slate-400">Version {resume.version} · Previous versions remain preserved in private storage.</p>
    </>}
  </main></div></div>;
}

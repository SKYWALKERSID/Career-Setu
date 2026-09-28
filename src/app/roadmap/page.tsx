'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Compass, RefreshCw, Target, TrendingUp } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { getDashboardData, type DashboardData } from '@/lib/dashboard/queries';
import { getStudentSkillGaps } from '@/lib/skill-gap/actions';
import { generateCareerRoadmap } from '@/lib/ai/actions-roadmap';
import { submitRoadmapTaskEvidence, updateRoadmapTaskStatus } from '@/lib/roadmap/actions';

type Gap = { skill_id: string; skill_name: string; status: 'acquired' | 'developing' | 'missing'; priority: number; importance?: string };

export default function RoadmapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRoleId = searchParams.get('role') || '';
  const [data, setData] = useState<DashboardData | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [evidenceTask, setEvidenceTask] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await getDashboardData(requestedRoleId || undefined);
      if (!result.success || !result.data) throw new Error(result.error || 'Roadmap data is unavailable.');
      setData(result.data);
      const roleId = result.data.targetCareer?.id || '';
      if (!requestedRoleId && roleId) router.replace(`/roadmap?role=${encodeURIComponent(roleId)}`);
      if (requestedRoleId && !roleId) setError('Career not found. Choose one of your selected target careers.');
      if (roleId) {
        const gapResult = await getStudentSkillGaps(roleId);
        if (gapResult.success) setGaps((gapResult.gaps || []) as Gap[]);
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Roadmap data is unavailable.'); }
    finally { setLoading(false); }
  }, [requestedRoleId, router]);

  useEffect(() => { void load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true); setError('');
    const roleId = data?.targetCareer?.id;
    if (!roleId) { setError('Choose a target career before generating a roadmap.'); return; }
    const result = await generateCareerRoadmap(roleId);
    if (result.success) await load(); else setError(result.error || 'Career roadmap is temporarily unavailable.');
    setGenerating(false);
  }

  async function handleTaskStatus(task: DashboardData['roadmapTasks'][number]) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    setUpdatingTask(task.id);
    const result = await updateRoadmapTaskStatus(task.id, nextStatus);
    if (result.success) await load(); else setError(result.error || 'Roadmap task could not be updated.');
    setUpdatingTask(null);
  }

  async function handleEvidence(taskId: string, url: string, note: string) {
    setEvidenceTask(taskId);
    const result = await submitRoadmapTaskEvidence(taskId, url, note);
    if (result.success) { setEvidenceTask(null); await load(); } else { setError(result.error || 'Evidence could not be saved.'); setEvidenceTask(null); }
  }

  if (loading) return <Shell><main className="flex flex-1 items-center justify-center"><LoadingState label="Loading your skill gap roadmap..." /></main></Shell>;

  const tasks = data?.roadmapTasks || [];
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const missing = gaps.filter((gap) => gap.status === 'missing');
  const developing = gaps.filter((gap) => gap.status === 'developing');
  const acquired = gaps.filter((gap) => gap.status === 'acquired');
  const roadmap = data?.roadmap as (DashboardData['roadmap'] & { career_roles?: { title?: string } }) | null;
  const roleName = roadmap?.career_roles?.title || data?.targetCareer?.title || 'Target career not selected';

  return <Shell><main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
    <Hero />
    {error && <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ReadinessCard assessment={data?.readinessAssessment || null} />
      <SummaryCard missing={missing.length} developing={developing.length} acquired={acquired.length} />
      <section className="border border-[#dce7f2] bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10295d]"><Target className="h-4 w-4 text-[#1559c7]" />Target career</h2>{data?.targetCareers?.length ? <><label htmlFor="target-career" className="mt-4 block text-xs font-semibold text-slate-600">Choose the career you want to analyze and build a roadmap for.</label><select id="target-career" value={data.targetCareer?.id || ''} onChange={(event) => router.push(`/roadmap?role=${encodeURIComponent(event.target.value)}`)} className="mt-2 h-10 w-full border border-[#cbdbea] bg-white px-3 text-sm font-semibold text-[#10295d]">{data.targetCareers.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}</select><p className="mt-2 text-xs text-slate-500">{data?.roadmap ? `Roadmap loaded for ${roleName}.` : `No roadmap for ${roleName} yet.`}</p></> : <><h3 className="mt-4 text-lg font-extrabold text-[#10295d]">No target career selected yet.</h3><Link href="/career" className="mt-4 inline-flex text-xs font-semibold text-[#1559c7]">Choose a career <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></>}</section>
    </section>
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <SkillTable gaps={gaps} roleId={data?.targetCareer?.id || ''} missing={missing.length} developing={developing.length} acquired={acquired.length} />
      <RoadmapTimeline tasks={tasks} generating={generating} updatingTask={updatingTask} evidenceTask={evidenceTask} onTaskStatus={handleTaskStatus} onEvidence={handleEvidence} onGenerate={handleGenerate} />
    </section>
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]"><Resources courses={data?.previewCourses || []} /><ProgressCard tasks={tasks} completed={completed} progress={progress} generating={generating} onGenerate={handleGenerate} /></section>
  </main></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#f4f8fc] flex"><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><TopNav />{children}</div></div>; }

function Hero() { return <section className="relative min-h-[170px] overflow-hidden border border-blue-100 bg-gradient-to-r from-[#e8f2ff] via-[#e2eeff] to-[#d4e5f9] px-5 py-7 sm:px-8"><div className="relative max-w-[600px]"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1559c7]">Learn. Upskill. Grow.</p><h1 className="mt-2 text-3xl font-extrabold text-[#10295d] sm:text-4xl">Your Skill Gap Roadmap</h1><p className="mt-2 text-sm leading-5 text-[#536987]">Turn current skills into future opportunities with evidence-aware gaps and a personalized 90-day plan.</p></div></section>; }

function ReadinessCard({ assessment }: { assessment: DashboardData['readinessAssessment'] }) { return <section className="border border-[#dce7f2] bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold text-[#10295d]"><TrendingUp className="h-4.5 w-4.5 text-[#1559c7]" />Overall skill readiness</h2><div className="mt-4 flex items-center gap-5">{assessment ? <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[8px] border-[#1559c7] border-r-[#cfe0f5] border-b-[#67a5ed]"><div className="text-center"><strong className="block text-3xl text-[#10295d]">{assessment.overall_score}</strong><span className="text-xs text-slate-500">/ 100</span></div></div> : <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 border-slate-200 text-center text-xs text-slate-500">Pending</div>}<div className="space-y-2 text-xs text-slate-600"><p>Latest persisted readiness assessment.</p><p className="font-semibold text-[#1559c7]">Pending dimensions stay unavailable.</p></div></div></section>; }

function SummaryCard({ missing, developing, acquired }: { missing: number; developing: number; acquired: number }) { return <section className="border border-[#dce7f2] bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold text-[#10295d]"><Compass className="h-4.5 w-4.5 text-[#1559c7]" />Skill gap summary</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="bg-[#fff1f1] p-3"><strong className="block text-2xl text-[#c84f5b]">{missing}</strong><span className="text-xs font-medium text-[#c84f5b]">Needs focus</span></div><div className="bg-[#fff8e8] p-3"><strong className="block text-2xl text-[#b27b19]">{developing}</strong><span className="text-xs font-medium text-[#b27b19]">In progress</span></div><div className="bg-[#eefaf2] p-3"><strong className="block text-2xl text-[#368d50]">{acquired}</strong><span className="text-xs font-medium text-[#368d50]">Strong skills</span></div></div></section>; }

function SkillTable({ gaps, roleId, missing, developing, acquired }: { gaps: Gap[]; roleId: string; missing: number; developing: number; acquired: number }) { return <section className="border border-[#dce7f2] bg-white"><div className="border-b border-[#e5edf5] px-5 py-4"><h2 className="text-lg font-bold text-[#10295d]">Skill gap analysis</h2><p className="mt-1 text-xs text-slate-500">Required catalog skills compared with your current evidence.</p><p className="mt-1 text-xs text-slate-400">{acquired} acquired · {developing} developing · {missing} missing</p></div>{gaps.length ? <div className="divide-y divide-[#e5edf5]">{gaps.map((gap) => <div key={gap.skill_id} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr] sm:items-center"><span className="font-semibold text-[#10295d]">{gap.skill_name}</span><Badge variant={gap.status === 'acquired' ? 'success' : gap.status === 'developing' ? 'warning' : 'info'} className="w-fit text-xs">{gap.status === 'missing' ? 'Needs focus' : gap.status === 'developing' ? 'In progress' : 'Strong'}</Badge><span className="text-xs text-slate-500">{gap.importance || `Priority ${gap.priority}`}</span><Link href={`/courses?career=${encodeURIComponent(roleId)}&skill=${encodeURIComponent(gap.skill_id)}`} className="text-xs font-semibold text-[#1559c7]">{gap.status === 'acquired' ? 'Review courses' : 'Learn next'} <ArrowRight className="inline h-3.5 w-3.5" /></Link></div>)}</div> : <div className="p-8"><EmptyState icon={<Compass className="h-8 w-8 text-slate-400" />} title="Skill gaps pending" description="Choose a target career to compare your skills with catalog requirements." /></div>}</section>; }

function RoadmapTimeline({ tasks, generating, updatingTask, evidenceTask, onTaskStatus, onEvidence, onGenerate }: { tasks: DashboardData['roadmapTasks']; generating: boolean; updatingTask: string | null; evidenceTask: string | null; onTaskStatus: (task: DashboardData['roadmapTasks'][number]) => void; onEvidence: (taskId: string, url: string, note: string) => void; onGenerate: () => void }) { return <section className="border border-[#dce7f2] bg-white"><div className="flex items-center justify-between border-b border-[#e5edf5] px-5 py-4"><h2 className="flex items-center gap-2 text-lg font-bold text-[#10295d]"><CalendarDays className="h-4.5 w-4.5 text-[#1559c7]" />Your learning roadmap</h2><span className="text-xs text-slate-500">90 days</span></div><div className="p-5">{tasks.length ? <div className="relative space-y-5 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-12px)] before:w-px before:bg-[#cfe0f5]">{tasks.map((task) => <RoadmapTaskCard key={task.id} task={task} updating={updatingTask === task.id} evidenceBusy={evidenceTask === task.id} onTaskStatus={onTaskStatus} onEvidence={onEvidence} />)}</div> : <EmptyState icon={<CalendarDays className="h-8 w-8 text-slate-400" />} title="No roadmap yet" description="Generate a catalog-grounded plan from your profile and readiness evidence." actionLabel={generating ? 'Generating...' : 'Generate roadmap'} onAction={onGenerate} />}</div></section>; }

function RoadmapTaskCard({ task, updating, evidenceBusy, onTaskStatus, onEvidence }: { task: DashboardData['roadmapTasks'][number]; updating: boolean; evidenceBusy: boolean; onTaskStatus: (task: DashboardData['roadmapTasks'][number]) => void; onEvidence: (taskId: string, url: string, note: string) => void }) { const [url, setUrl] = useState(task.evidence_url || ''); const [note, setNote] = useState(task.evidence_note || ''); return <div className="relative flex gap-3"><div className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-[#1559c7] text-white'}`}>{task.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">{task.week}</span>}</div><div className="min-w-0 flex-1"><h3 className="text-lg sm:text-xl font-bold text-[#10295d]">{task.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">Week {task.week} · {task.description}</p>{task.evidence_required && <p className="mt-1 text-xs text-slate-400">Evidence requested: {task.evidence_required}</p>}<Button variant="outline" size="sm" className="mt-3 text-xs" disabled={updating} onClick={() => onTaskStatus(task)}>{updating ? 'Saving...' : task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}</Button><div className="mt-3 border border-[#e5edf5] bg-[#fbfdff] p-3"><p className="text-xs font-semibold text-[#10295d]">Evidence {task.evidence_submitted_at ? 'submitted' : 'to support this task'}</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><input aria-label={`Evidence URL for ${task.title}`} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/..." className="h-8 border border-[#cbdbea] px-2 text-xs" /><input aria-label={`Evidence note for ${task.title}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you produce?" className="h-8 border border-[#cbdbea] px-2 text-xs" /></div><Button variant="outline" size="sm" className="mt-2 text-xs" disabled={evidenceBusy} onClick={() => onEvidence(task.id, url, note)}>{evidenceBusy ? 'Saving evidence...' : task.evidence_submitted_at ? 'Update evidence' : 'Submit evidence'}</Button>{task.evidence_submitted_at && <p className="mt-2 text-[11px] text-emerald-700">Evidence saved. Verification is not implied.</p>}</div></div></div>; }

function Resources({ courses }: { courses: DashboardData['previewCourses'] }) { return <section className="border border-[#dce7f2] bg-white p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-[#10295d]"><BookOpen className="h-4.5 w-4.5 text-[#1559c7]" />Recommended learning resources</h2><Link href="/courses" className="text-xs font-semibold text-[#1559c7]">View all <ArrowRight className="inline h-3.5 w-3.5" /></Link></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{courses.map((course) => <div key={course.id} className="border border-[#e5edf5] p-3"><p className="line-clamp-2 text-sm font-bold text-[#10295d]">{course.title}</p><p className="mt-1 text-xs text-slate-500">{course.provider}</p><Badge variant="success" className="mt-2 text-xs">{course.is_free ? 'Free' : course.price || 'Catalog course'}</Badge></div>)}{!courses.length && <p className="text-xs text-slate-500">No mapped catalog resources are available.</p>}</div></section>; }

function ProgressCard({ tasks, completed, progress, generating, onGenerate }: { tasks: DashboardData['roadmapTasks']; completed: number; progress: number; generating: boolean; onGenerate: () => void }) { return <section className="border border-[#dce7f2] bg-white p-5"><h2 className="text-lg font-bold text-[#10295d]">Roadmap progress</h2><div className="mt-4 flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-full border-[7px] border-[#1559c7] border-r-[#dce7f2]"><strong className="text-xl text-[#10295d]">{progress}%</strong></div><p className="text-xs leading-5 text-slate-500">{tasks.length ? `${completed} of ${tasks.length} visible tasks completed.` : 'No persisted roadmap tasks yet.'}</p></div><Button variant="outline" size="sm" className="mt-4 text-xs" onClick={onGenerate} disabled={generating}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />{tasks.length ? 'Regenerate roadmap' : 'Generate roadmap'}</Button></section>; }

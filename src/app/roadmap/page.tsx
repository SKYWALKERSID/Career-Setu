'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

type Gap = { skill_id: string; skill_name: string; status: 'acquired' | 'developing' | 'missing'; priority: number; importance?: string };

export default function RoadmapPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await getDashboardData();
      if (!result.success || !result.data) throw new Error(result.error || 'Roadmap data is unavailable.');
      setData(result.data);
      const roleId = result.data.roadmap?.target_role_id || result.data.studentProfile?.target_careers?.[0];
      if (roleId) {
        const gapResult = await getStudentSkillGaps(roleId);
        if (gapResult.success) setGaps((gapResult.gaps || []) as Gap[]);
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Roadmap data is unavailable.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function handleGenerate() {
    setGenerating(true); setError('');
    const result = await generateCareerRoadmap();
    if (result.success) await load(); else setError(result.error || 'Career roadmap is temporarily unavailable.');
    setGenerating(false);
  }

  if (loading) return <Shell><main className="flex flex-1 items-center justify-center"><LoadingState label="Loading your skill gap roadmap..." /></main></Shell>;

  const tasks = data?.roadmapTasks || [];
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const missing = gaps.filter((gap) => gap.status === 'missing');
  const developing = gaps.filter((gap) => gap.status === 'developing');
  const acquired = gaps.filter((gap) => gap.status === 'acquired');
  const roadmap = data?.roadmap as (DashboardData['roadmap'] & { career_roles?: { title?: string } }) | null;
  const roleName = roadmap?.career_roles?.title || (data?.studentProfile?.target_careers?.length ? 'Selected target career' : 'Target career not selected');

  return <Shell><main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
    <Hero />
    {error && <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ReadinessCard assessment={data?.readinessAssessment || null} />
      <SummaryCard missing={missing.length} developing={developing.length} acquired={acquired.length} />
      <section className="border border-[#dce7f2] bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10295d]"><Target className="h-4 w-4 text-[#1559c7]" />Your target role</h2><h3 className="mt-4 text-lg font-extrabold text-[#10295d]">{roleName}</h3><p className="mt-1 text-xs text-slate-500">{data?.roadmap ? 'Roadmap role from the persisted career plan.' : 'Ground your analysis in a selected catalog career.'}</p><Link href="/career" className="mt-4 inline-flex text-xs font-semibold text-[#1559c7]">Change target role <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></section>
    </section>
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <SkillTable gaps={gaps} missing={missing.length} developing={developing.length} acquired={acquired.length} />
      <RoadmapTimeline tasks={tasks} generating={generating} onGenerate={handleGenerate} />
    </section>
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]"><Resources courses={data?.previewCourses || []} /><ProgressCard tasks={tasks} completed={completed} progress={progress} generating={generating} onGenerate={handleGenerate} /></section>
  </main></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#f4f8fc] flex"><Sidebar /><div className="flex min-w-0 flex-1 flex-col"><TopNav />{children}</div></div>; }

function Hero() { return <section className="relative min-h-[170px] overflow-hidden border border-blue-100 bg-[#e8f2ff] px-5 py-7 sm:px-8"><div className="absolute inset-y-0 right-0 w-1/2 bg-[url('/career-recommendation-reference.png')] bg-cover bg-right opacity-90" /><div className="absolute inset-0 bg-gradient-to-r from-[#e8f2ff] via-[#e8f2ff]/90 to-transparent" /><div className="relative max-w-[600px]"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1559c7]">Learn. Upskill. Grow.</p><h1 className="mt-2 text-3xl font-extrabold text-[#10295d] sm:text-4xl">Your Skill Gap Roadmap</h1><p className="mt-2 text-sm leading-5 text-[#536987]">Turn current skills into future opportunities with evidence-aware gaps and a personalized 90-day plan.</p></div></section>; }

function ReadinessCard({ assessment }: { assessment: DashboardData['readinessAssessment'] }) { return <section className="border border-[#dce7f2] bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10295d]"><TrendingUp className="h-4 w-4 text-[#1559c7]" />Overall skill readiness</h2><div className="mt-4 flex items-center gap-5">{assessment ? <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[8px] border-[#1559c7] border-r-[#cfe0f5] border-b-[#67a5ed]"><div className="text-center"><strong className="block text-3xl text-[#10295d]">{assessment.overall_score}</strong><span className="text-[10px] text-slate-500">/ 100</span></div></div> : <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 border-slate-200 text-center text-xs text-slate-500">Pending</div>}<div className="space-y-2 text-[10px] text-slate-600"><p>Latest persisted readiness assessment.</p><p className="font-semibold text-[#1559c7]">Pending dimensions stay unavailable.</p></div></div></section>; }

function SummaryCard({ missing, developing, acquired }: { missing: number; developing: number; acquired: number }) { return <section className="border border-[#dce7f2] bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10295d]"><Compass className="h-4 w-4 text-[#1559c7]" />Skill gap summary</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="bg-[#fff1f1] p-3"><strong className="block text-2xl text-[#c84f5b]">{missing}</strong><span className="text-[10px] text-[#c84f5b]">Needs focus</span></div><div className="bg-[#fff8e8] p-3"><strong className="block text-2xl text-[#b27b19]">{developing}</strong><span className="text-[10px] text-[#b27b19]">In progress</span></div><div className="bg-[#eefaf2] p-3"><strong className="block text-2xl text-[#368d50]">{acquired}</strong><span className="text-[10px] text-[#368d50]">Strong skills</span></div></div></section>; }

function SkillTable({ gaps, missing, developing, acquired }: { gaps: Gap[]; missing: number; developing: number; acquired: number }) { return <section className="border border-[#dce7f2] bg-white"><div className="border-b border-[#e5edf5] px-5 py-4"><h2 className="text-sm font-bold text-[#10295d]">Skill gap analysis</h2><p className="mt-1 text-[11px] text-slate-500">Required catalog skills compared with your current evidence.</p><p className="mt-1 text-[10px] text-slate-400">{acquired} acquired · {developing} developing · {missing} missing</p></div>{gaps.length ? <div className="divide-y divide-[#e5edf5]">{gaps.map((gap) => <div key={gap.skill_id} className="grid gap-2 px-5 py-3 text-xs sm:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr] sm:items-center"><span className="font-semibold text-[#10295d]">{gap.skill_name}</span><Badge variant={gap.status === 'acquired' ? 'success' : gap.status === 'developing' ? 'warning' : 'info'} className="w-fit text-[10px]">{gap.status === 'missing' ? 'Needs focus' : gap.status === 'developing' ? 'In progress' : 'Strong'}</Badge><span className="text-[10px] text-slate-500">{gap.importance || `Priority ${gap.priority}`}</span><span className="text-[10px] font-semibold text-[#1559c7]">{gap.status === 'acquired' ? 'Keep going' : 'Learn next'} <ArrowRight className="inline h-3 w-3" /></span></div>)}</div> : <div className="p-8"><EmptyState icon={<Compass className="h-8 w-8 text-slate-400" />} title="Skill gaps pending" description="Select a relevant target role to compare your skills with catalog requirements." /></div>}</section>; }

function RoadmapTimeline({ tasks, generating, onGenerate }: { tasks: DashboardData['roadmapTasks']; generating: boolean; onGenerate: () => void }) { return <section className="border border-[#dce7f2] bg-white"><div className="flex items-center justify-between border-b border-[#e5edf5] px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10295d]"><CalendarDays className="h-4 w-4 text-[#1559c7]" />Your learning roadmap</h2><span className="text-[10px] text-slate-500">90 days</span></div><div className="p-5">{tasks.length ? <div className="relative space-y-5 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-12px)] before:w-px before:bg-[#cfe0f5]">{tasks.map((task) => <div key={task.id} className="relative flex gap-3"><div className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-[#1559c7] text-white'}`}>{task.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-[9px] font-bold">{task.week}</span>}</div><div><h3 className="text-xs font-bold text-[#10295d]">{task.title}</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">Week {task.week} · {task.description}</p></div></div>)}</div> : <EmptyState icon={<CalendarDays className="h-8 w-8 text-slate-400" />} title="No roadmap yet" description="Generate a catalog-grounded plan from your profile and readiness evidence." actionLabel={generating ? 'Generating...' : 'Generate roadmap'} onAction={onGenerate} />}</div></section>; }

function Resources({ courses }: { courses: DashboardData['previewCourses'] }) { return <section className="border border-[#dce7f2] bg-white p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-[#10295d]"><BookOpen className="h-4 w-4 text-[#1559c7]" />Recommended learning resources</h2><Link href="/courses" className="text-[10px] font-semibold text-[#1559c7]">View all <ArrowRight className="inline h-3 w-3" /></Link></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{courses.map((course) => <div key={course.id} className="border border-[#e5edf5] p-3"><p className="line-clamp-2 text-xs font-bold text-[#10295d]">{course.title}</p><p className="mt-1 text-[10px] text-slate-500">{course.provider}</p><Badge variant="success" className="mt-2 text-[9px]">{course.is_free ? 'Free' : course.price || 'Catalog course'}</Badge></div>)}{!courses.length && <p className="text-xs text-slate-500">No mapped catalog resources are available.</p>}</div></section>; }

function ProgressCard({ tasks, completed, progress, generating, onGenerate }: { tasks: DashboardData['roadmapTasks']; completed: number; progress: number; generating: boolean; onGenerate: () => void }) { return <section className="border border-[#dce7f2] bg-white p-5"><h2 className="text-sm font-bold text-[#10295d]">Roadmap progress</h2><div className="mt-4 flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-full border-[7px] border-[#1559c7] border-r-[#dce7f2]"><strong className="text-lg text-[#10295d]">{progress}%</strong></div><p className="text-xs leading-5 text-slate-500">{tasks.length ? `${completed} of ${tasks.length} visible tasks completed.` : 'No persisted roadmap tasks yet.'}</p></div><Button variant="outline" size="sm" className="mt-4" onClick={onGenerate} disabled={generating}><RefreshCw className={`mr-1 h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />{tasks.length ? 'Regenerate roadmap' : 'Generate roadmap'}</Button></section>; }

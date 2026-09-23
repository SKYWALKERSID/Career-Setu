'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  ChevronRight,
  FileText,
  History,
  Layers,
  Mic,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { getProgressSnapshot } from '@/lib/progress/actions';
import { calculateAndSaveReadinessAssessment } from '@/lib/readiness/actions';
import type { ProgressSnapshot } from '@/lib/progress/types';

export default function ProgressPage() {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const result = await getProgressSnapshot();
    if (result.success && result.snapshot) {
      setSnapshot(result.snapshot);
    } else {
      setError(result.error || 'Progress tracking metrics are currently unavailable.');
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function recalculate() {
    setBusy(true);
    setError('');
    const result = await calculateAndSaveReadinessAssessment();
    if (!result.success) {
      setError(result.error || 'Readiness assessment calculation failed.');
    }
    await load();
    setBusy(false);
  }

  const currentReadiness = snapshot?.readiness.current;
  const overallScore = currentReadiness?.overall_score ?? null;

  const scoreComponents = [
    { label: 'Technical Skills', score: currentReadiness?.technical_score ?? null },
    { label: 'Academic Foundation', score: currentReadiness?.academic_score ?? null },
    { label: 'Projects & Practical Evidence', score: currentReadiness?.project_score ?? null },
    { label: 'Resume Quality', score: currentReadiness?.resume_score ?? null },
    { label: 'Interview Readiness', score: currentReadiness?.interview_score ?? null },
    { label: 'Career Alignment', score: currentReadiness?.alignment_score ?? null },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f8fc]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Progress Tracking' },
            ]}
          />

          {/* Hero Banner Section */}
          <section className="relative overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#eaf4fc] px-6 py-7 shadow-[0_2px_10px_rgba(29,67,110,0.04)] sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#1769d4]">
                  STUDENT MILESTONES · PROGRESS TRACKING
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#10285a] sm:text-4xl">
                  Your Journey to Career Readiness
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#526d89]">
                  Track evidence-based growth across roadmap milestones, skill acquisitions, evaluated resumes, and mock interviews.
                </p>
              </div>
              <Button
                variant="govt"
                onClick={recalculate}
                disabled={busy}
                className="px-5 shadow-sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                {busy ? 'Calculating...' : 'Recalculate Readiness'}
              </Button>
            </div>
          </section>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 flex min-h-[360px] items-center justify-center">
              <LoadingState label="Loading your verified progress metrics..." />
            </div>
          ) : snapshot ? (
            <>
              {/* Top Row: Overall Readiness & Score Component Breakdown */}
              <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
                {/* Readiness Gauge Card */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <h2 className="text-base font-bold text-[#10285a]">Overall Readiness</h2>
                    <Badge variant={snapshot.readiness.trend === 'up' ? 'success' : 'secondary'}>
                      {snapshot.readiness.trend === 'up'
                        ? 'Improving'
                        : snapshot.readiness.trend === 'down'
                        ? 'Needs Attention'
                        : snapshot.readiness.trend === 'stable'
                        ? 'Stable'
                        : 'Pending Evidence'}
                    </Badge>
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-center">
                    <div
                      className="relative grid h-36 w-36 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#1769d4 ${overallScore ?? 0}%, #e7eef6 0)`,
                      }}
                    >
                      <div className="grid h-28 w-28 place-items-center rounded-full bg-white shadow-inner">
                        <div className="text-center">
                          <span className="text-3xl font-extrabold text-[#10285a]">
                            {overallScore ?? '—'}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400">
                            {overallScore !== null ? '/ 100' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-xs font-bold text-[#10285a]">
                        {overallScore !== null ? 'Deterministic Score' : 'Assessment Pending'}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-500">
                        {snapshot.readiness.trend === 'insufficient_history'
                          ? 'A second assessment is required to establish a score trend.'
                          : snapshot.readiness.change !== null
                          ? `${snapshot.readiness.change >= 0 ? '+' : ''}${snapshot.readiness.change} pts change from previous record.`
                          : 'Complete profile data to calculate your first readiness score.'}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Readiness Components Breakdown */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Readiness Component Breakdown</h2>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">6 Evaluated Factors</span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {scoreComponents.map(({ label, score }) => (
                      <div key={label} className="rounded border border-[#e8f0f8] bg-[#fbfdff] p-3.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{label}</span>
                          <span className="font-bold text-[#10285a]">
                            {score === null ? 'Pending' : `${score}/100`}
                          </span>
                        </div>
                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#e5edf6]">
                          <div
                            className="h-full rounded-full bg-[#1769d4] transition-all duration-300"
                            style={{ width: `${score ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Middle Row: Roadmap & Evidence Cards */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Roadmap Progress Card */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Roadmap Tasks Progress</h2>
                    </div>
                    <Link
                      href="/roadmap"
                      className="flex items-center text-xs font-bold text-[#1769d4] hover:underline"
                    >
                      Open Roadmap <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="mt-5">
                    {snapshot.roadmap.status === 'unavailable' ? (
                      <EmptyState
                        icon={<Layers className="h-8 w-8 text-slate-400" />}
                        title="No Active Roadmap"
                        description="Generate a career roadmap to start tracking structured learning milestones."
                        actionLabel="Generate Roadmap"
                        onAction={() => (window.location.href = '/roadmap')}
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-600">
                            {snapshot.roadmap.completedTasks} of {snapshot.roadmap.totalTasks} Tasks Completed
                          </span>
                          <span className="text-[#10285a] font-bold">{snapshot.roadmap.percent}%</span>
                        </div>
                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#e5edf6]">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${snapshot.roadmap.percent}%` }}
                          />
                        </div>
                        <p className="mt-4 text-xs leading-5 text-slate-500">
                          Status: <span className="font-bold text-[#10285a] capitalize">{snapshot.roadmap.status.replace('_', ' ')}</span>. Tasks completed on your roadmap contribute directly to technical evidence.
                        </p>
                      </>
                    )}
                  </div>
                </Card>

                {/* Evidence & Verification Overview */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Persisted Evidence Portfolio</h2>
                    </div>
                    <span className="text-xs text-slate-400">Verified Records</span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Current Skills</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{snapshot.currentSkills}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Profile skill catalog</p>
                    </div>

                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Evaluated Resumes</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{snapshot.analyzedResumes}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Copilot uploads</p>
                    </div>

                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Mock Interviews</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{snapshot.completedInterviews}</p>
                      <p className="mt-1 text-[10px] text-slate-400">Completed 5-turn sessions</p>
                    </div>

                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Course Completion</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">Unavailable</p>
                      <p className="mt-1 text-[10px] text-slate-400">Not tracked in backend</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Bottom Row: History & Recommended Next Actions */}
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                {/* Readiness Assessment History Log */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Readiness Assessment History</h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      {snapshot.readiness.history.length} Saved Evaluations
                    </span>
                  </div>

                  <div className="mt-5">
                    {!snapshot.readiness.history.length ? (
                      <p className="text-xs text-slate-500">
                        No readiness assessments have been saved yet. Click &quot;Recalculate Readiness&quot; above to generate your first assessment record.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#edf3f8]">
                        {snapshot.readiness.history.map((record, idx) => (
                          <div key={record.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 text-xs">
                            <div>
                              <p className="font-bold text-[#10285a]">
                                Assessment #{idx + 1}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {new Date(record.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-extrabold text-[#10285a]">
                                {record.overall_score}/100
                              </span>
                              <Badge variant="info" className="text-[10px]">
                                Saved
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Recommended Next Actions Sidebar */}
                <aside className="space-y-5">
                  <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <h2 className="text-sm font-bold text-[#10285a]">Recommended Next Actions</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Steps to advance your readiness score and complete your portfolio.
                    </p>

                    <div className="mt-4 space-y-2.5">
                      <Link
                        href="/roadmap"
                        className="flex items-center justify-between rounded border border-[#cbdbea] bg-[#f8fbfe] p-3 text-xs font-bold text-[#1769d4] hover:bg-[#edf6ff]"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-[#1769d4]" />
                          <span>Complete Roadmap Tasks</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Link>

                      <Link
                        href="/resume"
                        className="flex items-center justify-between rounded border border-[#cbdbea] bg-[#f8fbfe] p-3 text-xs font-bold text-[#1769d4] hover:bg-[#edf6ff]"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#1769d4]" />
                          <span>Analyze Resume</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Link>

                      <Link
                        href="/interview/setup"
                        className="flex items-center justify-between rounded border border-[#cbdbea] bg-[#f8fbfe] p-3 text-xs font-bold text-[#1769d4] hover:bg-[#edf6ff]"
                      >
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-[#1769d4]" />
                          <span>Take Mock Interview</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </Card>
                </aside>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}



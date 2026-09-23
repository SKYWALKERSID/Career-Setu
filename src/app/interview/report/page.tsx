'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  Target,
} from 'lucide-react';
import { getInterviewSession } from '@/lib/ai/actions-interview';

type ReportData = {
  overall_score: number;
  feedback_summary?: string | null;
  strengths: string[];
  areas_to_improve: string[];
  recommendations: string[];
  turns: Array<{
    turn_number: number;
    question: string;
    rubric_score?: number | null;
    feedback?: string | null;
  }>;
};

type Session = {
  session_status: string;
  difficulty: string;
  career_roles?: { title?: string } | null;
  overall_score?: number | null;
  feedback_summary?: string | null;
  report_json?: {
    strengths?: string[];
    areas_to_improve?: string[];
    recommendations?: string[];
  } | null;
};

function InsightCard({
  title,
  items,
  kind,
}: {
  title: string;
  items: string[];
  kind: 'good' | 'warn' | 'tip';
}) {
  const Icon = kind === 'good' ? CheckCircle2 : kind === 'warn' ? Target : Lightbulb;
  const color = kind === 'good' ? 'text-emerald-600' : kind === 'warn' ? 'text-amber-600' : 'text-[#1769d4]';
  const bgColor = kind === 'good' ? 'bg-emerald-50/60' : kind === 'warn' ? 'bg-amber-50/60' : 'bg-[#f0f6ff]';

  return (
    <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
      <div className="flex items-center gap-2">
        <div className={`rounded p-1.5 ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <h3 className="text-sm font-bold text-[#10285a]">{title}</h3>
      </div>
      <ul className="mt-3.5 space-y-2 text-xs leading-5 text-slate-600">
        {items.length ? (
          items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${kind === 'good' ? 'bg-emerald-500' : kind === 'warn' ? 'bg-amber-500' : 'bg-[#1769d4]'}`} />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-slate-400">No persisted items for this category.</li>
        )}
      </ul>
    </div>
  );
}

export default function InterviewReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const id = new URLSearchParams(window.location.search).get('session');
      if (!id) {
        setError('No interview report selected.');
        setLoading(false);
        return;
      }
      const result = await getInterviewSession(id);
      if (result.success && result.interview?.session_status === 'completed') {
        const stored = result.interview.report_json || {};
        setSession(result.interview as Session);
        setReport({
          overall_score: result.interview.overall_score ?? 0,
          feedback_summary: result.interview.feedback_summary,
          strengths: stored.strengths || [],
          areas_to_improve: stored.areas_to_improve || [],
          recommendations: stored.recommendations || [],
          turns: result.turns || [],
        });
      } else {
        setError(result.error || 'Completed interview report not found.');
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f4f8fc]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Mock Interview', href: '/interview/setup' },
              { label: 'Evaluation Report' },
            ]}
          />

          {loading ? (
            <div className="mt-8 flex min-h-[360px] items-center justify-center">
              <LoadingState label="Loading evaluation report data..." />
            </div>
          ) : error ? (
            <div className="mt-6 bg-white p-8">
              <EmptyState
                title="No Interview Report Found"
                description={error}
                actionLabel="Configure Setup"
                onAction={() => router.push('/interview/setup')}
              />
            </div>
          ) : report && session ? (
            <>
              {/* Header Hero Section */}
              <section className="relative overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#eaf4fc] px-6 py-7 shadow-[0_2px_10px_rgba(29,67,110,0.04)] sm:px-10">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#1769d4]">
                  MOCK INTERVIEW · EVALUATION REPORT
                </p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-[#10285a] sm:text-4xl">
                      Session Performance Report
                    </h1>
                    <p className="mt-2 text-sm text-[#526d89]">
                      Target Role:{' '}
                      <span className="font-bold text-[#10285a]">
                        {session.career_roles?.title || 'Target Career'}
                      </span>{' '}
                      · Difficulty:{' '}
                      <span className="font-semibold capitalize">{session.difficulty}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded border border-[#cbe0f5] bg-white/80 px-5 py-3 shadow-sm">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Overall Score</p>
                      <p className="text-xs text-slate-400">Fact-based evaluation</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-[#10285a]">{report.overall_score}</span>
                      <span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Main Content Area */}
                <section className="space-y-5">
                  {/* Executive Summary Card */}
                  <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center gap-2.5 border-b border-[#edf3f8] pb-4">
                      <div className="rounded bg-[#eaf3ff] p-2 text-[#1769d4]">
                        <MessageSquareText className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#10285a]">Executive Summary</h2>
                        <p className="text-[11px] text-slate-500">Persisted synthesis across all 5 turns</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-700">
                      {report.feedback_summary || 'No summary was persisted for this completed interview session.'}
                    </p>
                  </div>

                  {/* Insights Grid */}
                  <div className="grid gap-5 md:grid-cols-3">
                    <InsightCard title="Key Strengths" items={report.strengths} kind="good" />
                    <InsightCard title="Areas to Improve" items={report.areas_to_improve} kind="warn" />
                    <InsightCard title="Recommendations" items={report.recommendations} kind="tip" />
                  </div>

                  {/* Turn-by-Turn Breakdown */}
                  <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                      <h2 className="text-base font-bold text-[#10285a]">Turn-by-Turn Feedback</h2>
                      <span className="text-xs font-semibold text-[#1769d4]">
                        {report.turns.length} Questions Evaluated
                      </span>
                    </div>

                    <div className="mt-5 divide-y divide-[#edf3f8]">
                      {report.turns.map((turn) => (
                        <div key={turn.turn_number} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#1769d4]">
                              Question {turn.turn_number}
                            </p>
                            <Badge variant={turn.rubric_score === null || turn.rubric_score === undefined ? 'secondary' : 'info'}>
                              {turn.rubric_score === null || turn.rubric_score === undefined
                                ? 'Pending'
                                : `Score: ${turn.rubric_score}/100`}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-5 text-[#10285a]">
                            {turn.question}
                          </p>
                          <div className="mt-3 rounded border border-[#e8f0f8] bg-[#fbfdff] p-3 text-xs leading-5 text-slate-600">
                            {turn.feedback || 'No specific feedback persisted for this turn.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Sidebar Actions */}
                <aside className="space-y-5">
                  <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <h2 className="text-sm font-bold text-[#10285a]">Recommended Actions</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Integrate feedback into your learning path. Next, review your personalized career roadmap or start a fresh interview.
                    </p>
                    <div className="mt-4 space-y-2.5">
                      <Link
                        href="/roadmap"
                        className="flex items-center justify-between rounded border border-[#cbdbea] bg-[#f8fbfe] p-3 text-xs font-bold text-[#1769d4] hover:bg-[#edf6ff]"
                      >
                        <span>View Career Roadmap</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="govt"
                        onClick={() => router.push('/interview/setup')}
                        className="w-full justify-center"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Start New Interview
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[3px] border border-[#dbe8f5] bg-[#edf6ff] p-5">
                    <h3 className="text-xs font-bold text-[#10285a]">Readiness Integration</h3>
                    <p className="mt-2 text-[11px] leading-4 text-slate-600">
                      Completed interview results serve as empirical evidence for your deterministic readiness score calculation.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}


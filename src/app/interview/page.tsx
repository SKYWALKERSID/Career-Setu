'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileQuestion,
  HelpCircle,
  MessageSquare,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { getInterviewSession, submitInterviewAnswer } from '@/lib/ai/actions-interview';

type Session = {
  id: string;
  session_status: string;
  difficulty: string;
  career_roles?: { title?: string } | null;
};
type Turn = {
  turn_number: number;
  question: string;
  answer?: string | null;
};

export default function InterviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session');
    if (!id) {
      setLoading(false);
      return;
    }
    void getInterviewSession(id).then((result) => {
      if (result.success && result.interview) {
        setSession(result.interview as Session);
        const nextTurns = (result.turns || []) as Turn[];
        setTurns(nextTurns);
        const pending = nextTurns.find((turn) => !turn.answer);
        if (pending) {
          setQuestion(pending.question);
        } else if (result.interview.session_status === 'completed') {
          setError('This interview is already completed.');
        }
      } else {
        setError(result.error || 'Interview session not found.');
      }
      setLoading(false);
    });
  }, []);

  async function submit() {
    if (!session || !answer.trim() || busy) return;
    setBusy(true);
    setError('');
    const result = await submitInterviewAnswer(session.id, answer);
    if (result.success) {
      if (result.completed) {
        window.location.href = `/interview/report?session=${session.id}`;
      } else {
        setQuestion(result.question || '');
        setAnswer('');
        setTurns((current) => [
          ...current,
          { turn_number: result.turnNumber || current.length + 1, question: result.question || '' },
        ]);
      }
    } else {
      setError(result.error || 'Answer evaluation failed. Your session remains preserved.');
    }
    setBusy(false);
  }

  const currentNumber = turns.find((turn) => !turn.answer)?.turn_number || turns.length || 1;
  const completedTurnsCount = turns.filter((t) => t.answer).length;

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
              { label: 'Active Session' },
            ]}
          />

          {loading ? (
            <div className="mt-8 flex min-h-[360px] items-center justify-center">
              <LoadingState label="Loading active interview session..." />
            </div>
          ) : error && !session ? (
            <div className="mt-6 bg-white p-8">
              <EmptyState
                title="Interview Unavailable"
                description={error}
                actionLabel="Configure Setup"
                onAction={() => router.push('/interview/setup')}
              />
            </div>
          ) : session ? (
            <>
              {/* Header Card */}
              <section className="rounded-[3px] border border-[#dbe7f3] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#1769d4]">
                        MOCK INTERVIEW · LIVE SESSION
                      </p>
                      <Badge variant="info" className="text-xs uppercase">
                        {session.difficulty}
                      </Badge>
                    </div>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#10285a] sm:text-4xl">
                      {session.career_roles?.title || 'Target Career Interview'}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-4 w-4 text-[#1769d4]" /> Bounded (5 turns)
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Private Session
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 flex items-center gap-4 border-t border-[#edf3f8] pt-5">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5edf6]">
                    <div
                      className="h-full rounded-full bg-[#1769d4] transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentNumber / 5) * 100)}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-xs font-bold text-[#425d7c]">
                    Question {Math.min(currentNumber, 5)} of 5
                  </span>
                </div>
              </section>

              <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Active Workspace Main Card */}
                <section className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)] sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1769d4]">
                    <FileQuestion className="h-4 w-4" /> Current Prompt
                  </div>

                  <h2 className="mt-4 max-w-3xl text-xl font-bold leading-8 text-[#10285a] sm:text-2xl">
                    {question || 'Your next question is being prepared...'}
                  </h2>

                  <div className="mt-8">
                    <label htmlFor="answer" className="block text-sm font-semibold text-[#10285a]">
                      Your Answer
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Provide a clear, detailed response drawing on your practical knowledge and experience.
                    </p>
                    <textarea
                      id="answer"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      disabled={busy || !question}
                      className="mt-3 min-h-48 w-full resize-y rounded border border-[#cbdbea] bg-[#fbfdff] p-4 text-base leading-6 text-slate-800 outline-none transition focus:border-[#1769d4] focus:ring-2 focus:ring-[#1769d4]/15 disabled:bg-slate-50"
                      placeholder="Type your response here..."
                    />
                  </div>

                  {error && (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#edf3f8] pt-5">
                    <p className="text-xs text-slate-400">
                      Evaluated against catalog skill expectations for this role.
                    </p>
                    <Button
                      variant="govt"
                      onClick={submit}
                      disabled={busy || !answer.trim() || !question}
                      className="px-6 text-sm font-semibold"
                    >
                      {busy ? (
                        'Evaluating Answer...'
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Submit Answer <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </section>

                {/* Sidebar Guidance & Turn Log */}
                <aside className="space-y-5">
                  <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#10285a]">
                      <MessageSquare className="h-4 w-4 text-[#1769d4]" /> Session Progress
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {completedTurnsCount} of 5 turns completed
                    </p>
                    <div className="mt-4 space-y-2">
                      {turns.map((turn) => (
                        <div
                          key={turn.turn_number}
                          className={`rounded border p-2.5 text-xs ${
                            turn.answer
                              ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                              : turn.turn_number === currentNumber
                              ? 'border-[#1769d4] bg-[#f0f6ff] font-semibold text-[#10285a]'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Turn {turn.turn_number}</span>
                            {turn.answer ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : turn.turn_number === currentNumber ? (
                              <span className="text-xs uppercase tracking-wide text-[#1769d4]">Current</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-[#10285a]">
                      <HelpCircle className="h-4 w-4 text-[#1769d4]" /> Guidance
                    </h2>
                    <ul className="mt-3 space-y-2.5 text-sm leading-5 text-slate-600">
                      <li>• Answer each prompt sequentially before proceeding.</li>
                      <li>• Focus on specific examples and technical clarity.</li>
                      <li>• Evaluation is saved per turn to ensure data persistence.</li>
                    </ul>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="mt-6 bg-white p-8">
              <EmptyState
                title="No Active Interview Session"
                description="Start a new mock interview session from the setup page."
                actionLabel="Configure Setup"
                onAction={() => router.push('/interview/setup')}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

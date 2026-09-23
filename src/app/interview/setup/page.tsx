'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { getStudentProfile, getCatalogItems } from '@/lib/profile/actions';
import { startInterview } from '@/lib/ai/actions-interview';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileQuestion,
  HelpCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

export default function InterviewSetupPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Array<{ id: string; title: string; category?: string }>>([]);
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([getStudentProfile(), getCatalogItems()]).then(([profile, catalog]) => {
      const ids =
        profile.success && profile.studentProfile && Array.isArray(profile.studentProfile.target_careers)
          ? profile.studentProfile.target_careers
          : [];
      const available = catalog.careerRoles.filter((item) => ids.includes(item.id));
      setRoles(available);
      if (available[0]) setRole(available[0].id);
      setLoading(false);
    });
  }, []);

  async function submit() {
    if (!role) return;
    setBusy(true);
    setError('');
    const result = await startInterview(role, difficulty);
    if (result.success && result.interviewId) {
      router.push(`/interview?session=${result.interviewId}`);
    } else {
      setError(result.error || 'Interview session could not be started.');
    }
    setBusy(false);
  }

  const selectedRoleObj = roles.find((r) => r.id === role);

  return (
    <div className="flex min-h-screen bg-[#f4f8fc]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-4 p-4 sm:p-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Mock Interview', href: '/interview' },
              { label: 'Setup' },
            ]}
          />

          {/* Hero Banner matched to Career/Resume pages */}
          <section className="relative overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#eaf4fc] px-6 py-7 shadow-[0_2px_10px_rgba(29,67,110,0.04)] sm:px-10">
            <div className="relative max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#1769d4]">
                MOCK INTERVIEW · SETUP
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#10285a] sm:text-4xl">
                Practice with Purpose.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#526d89]">
                Prepare for your target career with a bounded, 5-question interview. Every answer is evaluated against real role criteria to deliver actionable, persisted feedback.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5 text-xs font-semibold text-[#375d87]">
                <span className="flex items-center gap-1.5">
                  <FileQuestion className="h-4 w-4 text-[#1769d4]" /> 5 Questions per Session
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#1769d4]" /> Private & Persisted
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#1769d4]" /> Fact-Based Evaluation
                </span>
              </div>
            </div>
          </section>

          {/* Tab navigation matching shared visual language */}
          <div className="flex flex-wrap items-center gap-6 border-b border-[#dce7f0] text-xs font-semibold text-[#61728a]">
            <button type="button" className="border-b-2 border-[#1769d4] px-2 py-3 text-[#1769d4]">
              New Session Setup
            </button>
            <button
              type="button"
              onClick={() => router.push('/interview')}
              className="border-b-2 border-transparent px-2 py-3 text-slate-500 hover:text-slate-800"
            >
              Active Session
            </button>
          </div>

          {loading ? (
            <div className="mt-8 flex min-h-[300px] items-center justify-center">
              <LoadingState label="Loading catalog target roles..." />
            </div>
          ) : (
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Configuration Form Card */}
              <section className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)] sm:p-8">
                <div className="flex items-start gap-3.5 border-b border-[#edf3f8] pb-5">
                  <div className="rounded bg-[#eaf3ff] p-2.5 text-[#1769d4]">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#10285a]">Configure Session Parameters</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Questions are generated dynamically from catalog requirements associated with your selected target career.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                {!roles.length ? (
                  <div className="py-8">
                    <EmptyState
                      icon={<Target className="h-10 w-10 text-slate-400" />}
                      title="No Target Careers Selected"
                      description="You need to select at least one target career in your profile or career explorer before starting a mock interview."
                      actionLabel="Explore Career Roles"
                      onAction={() => router.push('/career')}
                    />
                  </div>
                ) : (
                  <div className="mt-7 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField label="Target Career Role" required>
                        <Select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 text-xs">
                          <option value="">Select a target role</option>
                          {roles.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                              {item.category ? ` · ${item.category}` : ''}
                            </option>
                          ))}
                        </Select>
                      </FormField>

                      <FormField label="Difficulty Level" required>
                        <Select
                          value={difficulty}
                          onChange={(event) => setDifficulty(event.target.value)}
                          className="h-10 text-xs"
                        >
                          <option value="easy">Easy (Foundational Concepts)</option>
                          <option value="medium">Medium (Applied Problem Solving)</option>
                          <option value="hard">Hard (Advanced System & Architecture)</option>
                        </Select>
                      </FormField>
                    </div>

                    {selectedRoleObj && (
                      <div className="rounded border border-[#e2edf7] bg-[#f8fbfe] p-4 text-xs">
                        <p className="font-bold text-[#10285a]">Role Overview: {selectedRoleObj.title}</p>
                        <p className="mt-1 text-slate-600">
                          Questions will test technical depth, practical problem solving, and role readiness tailored for {selectedRoleObj.category || 'this career domain'}.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#edf3f8] pt-6">
                      <p className="text-[11px] text-slate-400">
                        Session length: 5 sequential questions.
                      </p>
                      <Button
                        variant="govt"
                        onClick={submit}
                        disabled={busy || !role}
                        className="px-6"
                      >
                        {busy ? (
                          'Preparing Session...'
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4 fill-current" /> Start Mock Interview <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              {/* Sidebar Info Card */}
              <aside className="space-y-5">
                <div className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-[#10285a]">
                    <HelpCircle className="h-4 w-4 text-[#1769d4]" /> Session Guidelines
                  </h2>
                  <div className="mt-4 space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#1769d4]" />
                      <span><strong>Bounded turns:</strong> Complete 5 questions sequentially to generate your evaluation report.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-[#1769d4]" />
                      <span><strong>Domain-aligned:</strong> Prompts draw from verified skill requirements for your chosen role.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span><strong>Report saved:</strong> Results are persisted to your profile upon interview completion.</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[3px] border border-[#dbe8f5] bg-[#edf6ff] p-5">
                  <h3 className="text-xs font-bold text-[#10285a]">AI Provider Transparency</h3>
                  <p className="mt-2 text-[11px] leading-4 text-slate-600">
                    Integrity is maintained by showing real provider states. If AI evaluation is temporarily unavailable, sessions pause safely without creating unverified fake scores.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


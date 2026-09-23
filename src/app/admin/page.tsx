'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Cpu,
  Database,
  FileText,
  Layers,
  Mic,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getAdminMetrics } from '@/lib/admin/actions';
import type { AdminMetrics } from '@/lib/admin/types';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Users;
  badge?: string;
}) {
  return (
    <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-5 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
      <div className="flex items-start justify-between">
        <div className="rounded bg-[#eaf3ff] p-2 text-[#1769d4]">
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <Badge variant="secondary" className="text-[10px]">
            {badge}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{value}</p>
        {subtitle && <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>}
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void getAdminMetrics().then((result) => {
      if (result.success && result.metrics) {
        setMetrics(result.metrics);
      } else {
        setError(result.error || 'Admin aggregate metrics unavailable.');
      }
      setLoading(false);
    });
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
              { label: 'Admin Dashboard' },
            ]}
          />

          {/* Hero Banner Section */}
          <section className="relative overflow-hidden rounded-[3px] border border-[#dbe7f3] bg-[#eaf4fc] px-6 py-7 shadow-[0_2px_10px_rgba(29,67,110,0.04)] sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#1769d4]">
                  GOVERNMENT ADMINISTRATION · OVERVIEW
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[#10285a] sm:text-4xl">
                  MP CareerSetu System Analytics
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#526d89]">
                  Aggregate platform usage, student readiness metrics, catalog volume, and AI engine telemetry for state-wide program management.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="verified" className="flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Admin Authorized
                </Badge>
                <Link
                  href="/dashboard"
                  className="rounded border border-[#cbdbea] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1769d4] shadow-sm hover:bg-[#edf6ff]"
                >
                  Student View <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="mt-8 flex min-h-[360px] items-center justify-center">
              <LoadingState label="Loading aggregate administrative metrics..." />
            </div>
          ) : error ? (
            <div className="mt-6 bg-white p-8">
              <EmptyState
                title="Admin Dashboard Access Denied"
                description={error}
                actionLabel="Back to Student Dashboard"
                onAction={() => {
                  window.location.href = '/dashboard';
                }}
              />
            </div>
          ) : metrics ? (
            <>
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Students Registered"
                  value={metrics.totalStudents}
                  subtitle={`${metrics.studentsWithProfiles} with completed profiles`}
                  icon={Users}
                  badge="Registered"
                />
                <StatCard
                  title="Average Latest Readiness"
                  value={
                    metrics.averageLatestReadiness === null
                      ? 'No data'
                      : `${metrics.averageLatestReadiness} / 100`
                  }
                  subtitle={`${metrics.studentsWithReadiness} students assessed`}
                  icon={TrendingUp}
                  badge="Readiness"
                />
                <StatCard
                  title="Roadmap Task Completion"
                  value={
                    metrics.roadmapTaskCompletion.percent === null
                      ? 'No data'
                      : `${metrics.roadmapTaskCompletion.percent}%`
                  }
                  subtitle={`${metrics.roadmapTaskCompletion.completed} of ${metrics.roadmapTaskCompletion.total} tasks completed`}
                  icon={Layers}
                  badge="Milestones"
                />
                <StatCard
                  title="Opportunity Match Records"
                  value={metrics.opportunityMatchCount}
                  subtitle={`${metrics.verifiedOpportunityCount} verified postings`}
                  icon={BriefcaseBusiness}
                  badge="Matching"
                />
              </div>

              {/* Middle Section: Catalog, Engagement, AI Telemetry */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Target Career Role Demand */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <TargetIcon className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Career Role Selection Volume</h2>
                    </div>
                    <span className="text-xs text-slate-400">Student Selections</span>
                  </div>

                  <div className="mt-5">
                    {!metrics.careerRoleUsage.length ? (
                      <p className="text-xs text-slate-500">No target career selections recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {metrics.careerRoleUsage.map((role) => (
                          <div key={role.roleId} className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{role.title}</span>
                            <Badge variant="secondary" className="font-bold text-[#10285a]">
                              {role.count} {role.count === 1 ? 'student' : 'students'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Platform Catalog Aggregate */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Catalog & Opportunities Overview</h2>
                    </div>
                    <span className="text-xs text-slate-400">System State</span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3.5">
                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Course Catalog</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{metrics.courseCatalogCount}</p>
                      <p className="text-[10px] text-slate-400">Mapped courses</p>
                    </div>

                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Total Opportunities</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{metrics.opportunityCatalogCount}</p>
                      <p className="text-[10px] text-slate-400">Catalog postings</p>
                    </div>

                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Verified Opportunities</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{metrics.verifiedOpportunityCount}</p>
                      <p className="text-[10px] text-slate-400">Official postings</p>
                    </div>

                    <div className="rounded border border-[#e5edf5] bg-[#f8fbfe] p-3.5">
                      <p className="text-[11px] font-semibold text-slate-500">Roadmaps Generated</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#10285a]">{metrics.roadmapCount}</p>
                      <p className="text-[10px] text-slate-400">Active student paths</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Bottom Section: Feature Engagement & AI Telemetry */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Feature Engagement Totals */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">Student Feature Engagement</h2>
                    </div>
                    <span className="text-xs text-slate-400">Aggregate Activity</span>
                  </div>

                  <div className="mt-5 divide-y divide-[#edf3f8] text-xs">
                    <div className="flex items-center justify-between py-2.5 first:pt-0">
                      <span className="flex items-center gap-2 text-slate-700">
                        <Sparkles className="h-4 w-4 text-[#1769d4]" /> Career Recommendations Generated
                      </span>
                      <span className="font-bold text-[#10285a]">{metrics.recommendationCount}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-slate-700">
                        <FileText className="h-4 w-4 text-[#1769d4]" /> Resumes Analyzed
                      </span>
                      <span className="font-bold text-[#10285a]">{metrics.analyzedResumeCount}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-slate-700">
                        <Mic className="h-4 w-4 text-[#1769d4]" /> Mock Interviews Completed
                      </span>
                      <span className="font-bold text-[#10285a]">{metrics.completedInterviewCount}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5 last:pb-0">
                      <span className="flex items-center gap-2 text-slate-700">
                        <TrendingUp className="h-4 w-4 text-[#1769d4]" /> Readiness Assessments Run
                      </span>
                      <span className="font-bold text-[#10285a]">{metrics.readinessAssessments}</span>
                    </div>
                  </div>
                </Card>

                {/* AI Gateway Telemetry */}
                <Card className="rounded-[3px] border border-[#dfe8f1] bg-white p-6 shadow-[0_2px_9px_rgba(27,63,105,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#edf3f8] pb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-[#1769d4]" />
                      <h2 className="text-base font-bold text-[#10285a]">AI Infrastructure Telemetry</h2>
                    </div>
                    <Badge variant="info" className="text-[10px]">
                      {metrics.aiRuns.total} Total Runs
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2.5">
                        <p className="text-[10px] font-semibold text-emerald-800">Successful</p>
                        <p className="mt-0.5 text-lg font-extrabold text-emerald-900">{metrics.aiRuns.successful}</p>
                      </div>

                      <div className="rounded border border-red-200 bg-red-50/60 p-2.5">
                        <p className="text-[10px] font-semibold text-red-800">Failed</p>
                        <p className="mt-0.5 text-lg font-extrabold text-red-900">{metrics.aiRuns.failed}</p>
                      </div>

                      <div className="rounded border border-[#cbe0f5] bg-[#edf6ff] p-2.5">
                        <p className="text-[10px] font-semibold text-[#10285a]">Persisted Tokens</p>
                        <p className="mt-0.5 text-lg font-extrabold text-[#10285a]">
                          {metrics.aiRuns.tokensUsed === null ? 'Unavailable' : metrics.aiRuns.tokensUsed}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#edf3f8] pt-3">
                      <p className="text-[11px] font-bold text-[#10285a]">Runs by Feature Subsystem</p>
                      <div className="mt-2 space-y-2 text-xs">
                        {metrics.aiRuns.byFeature.map((feature) => (
                          <div key={feature.feature} className="flex justify-between text-slate-600">
                            <span className="capitalize">{feature.feature.replace('_', ' ')}</span>
                            <span className="font-semibold text-[#10285a]">{feature.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}



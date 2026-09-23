'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ArrowRight, Award, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronRight, FileText, Mic, Sparkles, Target, TrendingUp } from 'lucide-react';
import { getDashboardData, type DashboardData } from '@/lib/dashboard/queries';
import { generateCareerRecommendations } from '@/lib/ai/actions-recommendations';

function PortalFrame({ children }: { children: React.ReactNode }) {
  return <div className="portal-page min-h-screen flex"><Sidebar /><div className="flex-1 min-w-0 flex flex-col"><TopNav />{children}</div></div>;
}

function PanelHeading({ icon: Icon, title, href, action = 'View All' }: { icon: typeof TrendingUp; title: string; href?: string; action?: string }) {
  return <CardHeader className="px-4 py-3 flex-row items-center justify-between space-y-0 border-b border-slate-100"><CardTitle className="text-[13px] font-bold flex items-center gap-2"><Icon className="h-4 w-4 text-brand-700" />{title}</CardTitle>{href && <Link href={href} className="text-[10px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1">{action}<ArrowRight className="h-3 w-3" /></Link>}</CardHeader>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getDashboardData();
        if (result.success && result.data) setDashboardData(result.data);
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PortalFrame><main className="flex-1 flex items-center justify-center p-6"><LoadingState label="Loading your personalized dashboard metrics..." /></main></PortalFrame>;

  const sp = dashboardData?.studentProfile;
  const assessment = dashboardData?.readinessAssessment;
  const recommendations = dashboardData?.careerRecommendations || [];
  const roadmapTasks = dashboardData?.roadmapTasks || [];
  const courses = dashboardData?.previewCourses || [];
  const opportunities = dashboardData?.previewOpportunities || [];
  const studentSkills = dashboardData?.studentSkills || [];

  async function handleGenerateRecommendations() {
    setRecommendationsLoading(true);
    setRecommendationsError('');
    const result = await generateCareerRecommendations();
    if (result.success) {
      const refreshed = await getDashboardData();
      if (refreshed.success && refreshed.data) setDashboardData(refreshed.data);
    } else setRecommendationsError(result.error || 'Career recommendations are temporarily unavailable.');
    setRecommendationsLoading(false);
  }

  const scoreRows = assessment ? [
    ['Technical Skills', assessment.technical_score],
    ['Academic Foundation', assessment.academic_score],
    ['Projects & Experience', assessment.project_score],
    ['Resume Quality', assessment.resume_score],
    ['Interview Performance', assessment.interview_score],
    ['Career Alignment', assessment.alignment_score],
  ] as const : [];

  return <PortalFrame>
    <main className="flex-1 bg-[#f4f8fc] p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-5">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-[0.22em] font-bold text-brand-700 mb-1">Student dashboard</p><h1 className="text-[27px] leading-tight font-extrabold text-[#102b63]">Good morning, {sp?.name || 'Student'} <span aria-hidden="true">👋</span></h1><p className="text-xs text-slate-500 mt-1">Here&apos;s your personalized career overview.</p></div>
        <div className="text-right text-[10px] text-slate-500"><p><span className="font-semibold text-slate-700">हिंदी</span><span className="mx-1">|</span>English</p><p className="mt-2">{sp?.college ? `${sp.college} · ${sp.semester || ''}th Sem` : 'Madhya Pradesh Student Employability Portal'}</p></div>
      </section>

      <section className="relative overflow-hidden rounded-md border border-blue-100 bg-[#e8f2ff] px-5 py-4 min-h-[82px] flex items-center"><div className="absolute inset-y-0 right-0 w-2/5 bg-[url('/dashboard-reference.jpg')] bg-cover bg-right opacity-15" /><div className="relative z-10"><p className="text-[14px] font-semibold text-[#143b7a]">“Your skills today can build a stronger Madhya Pradesh tomorrow.”</p><p className="text-[11px] text-slate-600 mt-1">Explore. Learn. Grow.</p></div><div className="absolute right-5 bottom-3 text-[10px] text-slate-500">📍 {sp?.location || 'Madhya Pradesh'}</div></section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden"><PanelHeading icon={TrendingUp} title="Career Readiness Score" href="/progress" action="View Report" /><CardContent className="p-4">{assessment ? <div className="flex gap-4 items-center"><div className="h-[108px] w-[108px] shrink-0 rounded-full border-[7px] border-brand-600 border-r-blue-100 flex items-center justify-center bg-white"><div className="text-center"><span className="text-[30px] font-extrabold text-[#102b63]">{assessment.overall_score}</span><span className="block text-[10px] text-slate-500">/ 100</span></div></div><div className="flex-1 space-y-2">{scoreRows.map(([label, value]) => <div key={label}><div className="flex justify-between text-[9px] text-slate-600 mb-0.5"><span>{label}</span><span className="font-bold text-slate-800">{value ?? '—'}</span></div><Progress value={value ?? 0} className="h-1.5 bg-slate-100" /></div>)}</div></div> : <EmptyState icon={<Award className="h-7 w-7 text-slate-400" />} title="Assessment Pending" description="Complete your assessment to see your readiness score." />}</CardContent></Card>

        <Card className="overflow-hidden"><PanelHeading icon={Target} title="Top Career Recommendations" href="/career" /><CardContent className="p-3">{recommendationsError && <p className="text-[10px] text-red-700 px-1 pb-2">{recommendationsError}</p>}{recommendations.length ? recommendations.map((recommendation, index) => <Link key={recommendation.id} href={`/career/${recommendation.role?.id || ''}`} className="flex items-center gap-3 px-2 py-2.5 border-b last:border-0 border-slate-100 hover:bg-blue-50/50"><span className="h-7 w-7 rounded-full bg-blue-50 text-brand-700 flex items-center justify-center text-xs font-bold">{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold text-slate-900 truncate">{recommendation.role?.title}</span><span className="block text-[10px] text-slate-500 truncate">{recommendation.rationale}</span></span><Badge variant="success" className="text-[9px] shrink-0">{recommendation.score}% Match</Badge><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></Link>) : <EmptyState icon={<Sparkles className="h-7 w-7 text-slate-400" />} title="Recommendations Pending" description="Generate recommendations from your profile and skills." actionLabel={recommendationsLoading ? 'Generating...' : 'Generate Recommendations'} onAction={handleGenerateRecommendations} />}</CardContent></Card>

        <Card className="overflow-hidden"><PanelHeading icon={CalendarDays} title="Your 90-Day Plan" href="/roadmap" action="View Plan" /><CardContent className="p-4">{roadmapTasks.length ? <div className="space-y-3">{roadmapTasks.map((task) => <div key={task.id} className="flex gap-3 items-start"><div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-brand-700'}`}>{task.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-[10px] font-bold">{task.week}</span>}</div><div><p className="text-[11px] font-semibold text-slate-800">{task.title}</p><p className="text-[9px] text-slate-500">Week {task.week}</p></div></div>)}</div> : <EmptyState icon={<CalendarDays className="h-7 w-7 text-slate-400" />} title="Roadmap Pending" description="Your personalized learning plan will appear here after profile evaluation." />}</CardContent></Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden"><PanelHeading icon={BookOpen} title="Recommended Courses" href="/courses" /><CardContent className="p-3 space-y-2">{courses.length ? courses.map((course) => <div key={course.id} className="flex items-center gap-3 p-2 rounded border border-slate-100"><div className="h-8 w-8 rounded bg-blue-50 text-brand-700 flex items-center justify-center"><BookOpen className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold truncate">{course.title}</p><p className="text-[9px] text-slate-500">{course.provider} · {course.level}</p></div><Badge variant="success" className="text-[9px]">{course.is_free ? 'Free' : course.price}</Badge></div>) : <EmptyState icon={<BookOpen className="h-7 w-7 text-slate-400" />} title="No courses available" description="Recommended catalog courses will appear here when available." />}</CardContent></Card>
        <Card className="overflow-hidden"><PanelHeading icon={Building2} title="Matching Opportunities" href="/opportunities" /><CardContent className="p-3 space-y-2">{opportunities.length ? opportunities.map((opportunity) => <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`} className="flex items-center gap-3 p-2 rounded border border-slate-100 hover:border-blue-200"><div className="h-8 w-8 rounded bg-blue-50 text-brand-700 flex items-center justify-center"><Building2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold truncate">{opportunity.title}</p><p className="text-[9px] text-slate-500">{opportunity.organization} · {opportunity.location}</p></div>{opportunity.is_verified && <Badge variant="verified" className="text-[9px]">Verified</Badge>}<ChevronRight className="h-3.5 w-3.5 text-slate-400" /></Link>) : <EmptyState icon={<Building2 className="h-7 w-7 text-slate-400" />} title="No opportunities available" description="Matching opportunities will appear here when the catalog has active listings." />}</CardContent></Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card className="p-3 flex items-center justify-between"><div><p className="text-[10px] text-slate-500">Mapped Skills</p><p className="text-lg font-bold text-[#102b63]">{studentSkills.length}</p></div><Link href="/onboarding"><Button variant="outline" size="sm" className="text-[10px]">Update <ArrowRight className="h-3 w-3" /></Button></Link></Card><Card className="p-3 flex items-center justify-between"><div className="min-w-0"><p className="text-[10px] text-slate-500">Target Career Goals</p><p className="text-[11px] font-bold truncate max-w-[170px]">{sp?.target_careers?.length ? sp.target_careers.join(', ') : 'Not selected'}</p></div><Link href="/career"><Button variant="outline" size="sm" className="text-[10px]">Explore <ArrowRight className="h-3 w-3" /></Button></Link></Card><Card className="p-3 flex items-center justify-between"><div className="min-w-0"><p className="text-[10px] text-slate-500">Profile Completion</p><p className="text-lg font-bold text-[#102b63]">{dashboardData?.completionScore || 0}%</p></div><Link href="/settings"><Button variant="outline" size="sm" className="text-[10px]">Edit <ArrowRight className="h-3 w-3" /></Button></Link></Card></section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4"><Card className="p-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded bg-blue-50 text-brand-700 flex items-center justify-center"><FileText className="h-4 w-4" /></div><div><p className="text-[12px] font-bold">Resume Copilot</p><p className="text-[10px] text-slate-500">Get fact-preserving feedback on your resume.</p></div></div><Link href="/resume"><Button variant="outline" size="sm" className="text-[10px] shrink-0">Open <ArrowRight className="h-3 w-3" /></Button></Link></Card><Card className="p-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded bg-blue-50 text-brand-700 flex items-center justify-center"><Mic className="h-4 w-4" /></div><div><p className="text-[12px] font-bold">Mock Interview</p><p className="text-[10px] text-slate-500">Practice role-specific questions with feedback.</p></div></div><Link href="/interview/setup"><Button variant="govt" size="sm" className="text-[10px] shrink-0">Start <ArrowRight className="h-3 w-3" /></Button></Link></Card></section>
    </main>
  </PortalFrame>;
}

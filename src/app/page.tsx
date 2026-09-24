import Link from 'next/link';
import { ArrowRight, BookOpen, BriefcaseBusiness, Compass, Mic, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

async function getCatalogCounts() {
  const supabase = await createClient();
  const [roles, courses, opportunities] = await Promise.all([
    supabase.from('career_roles').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }),
  ]);
  return { roles: roles.count ?? 0, courses: courses.count ?? 0, opportunities: opportunities.count ?? 0 };
}

export default async function LandingPage() {
  const counts = await getCatalogCounts();
  const features = [
    ['Personalized guidance', 'Career recommendations grounded in your profile.', Compass],
    ['Skill gap analysis', 'See what to learn next for your target role.', TrendingUp],
    ['Courses and certifications', 'Find catalog learning resources mapped to skills.', BookOpen],
    ['Real opportunities', 'Explore verified catalog opportunities and programs.', BriefcaseBusiness],
    ['Interview preparation', 'Practice with structured mock interview sessions.', Mic],
  ] as const;
  const steps = ['Create your profile', 'Get transparent insights', 'Follow your roadmap', 'Move toward opportunities'];
  const stepCopy = ['Add your academic details, skills, and interests.', 'Understand your readiness and career fit.', 'Turn skill gaps into focused weekly action.', 'Use your preparation to explore real catalog opportunities.'];

  return (
    <main className="min-h-screen bg-[#f5f9fd] text-[#10295d]">
      <header className="border-b border-[#dce7f2] bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="MP CareerSetu home"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7d3d] text-[10px] font-bold text-white">MP</span><span><strong className="block text-[15px] leading-tight">MP CareerSetu</strong><small className="block text-[10px] font-medium text-slate-500">Government of Madhya Pradesh</small></span></Link>
          <nav className="hidden items-center gap-7 text-[12px] font-medium text-slate-600 md:flex"><Link href="#home" className="border-b-2 border-[#1559c7] pb-1 text-[#1559c7]">Home</Link><Link href="#features" className="hover:text-[#1559c7]">About</Link><Link href="#features" className="hover:text-[#1559c7]">Features</Link><Link href="/opportunities" className="hover:text-[#1559c7]">Opportunities</Link><Link href="/courses" className="hover:text-[#1559c7]">Resources</Link></nav>
          <div className="flex items-center gap-2"><button aria-label="Search" className="hidden rounded-md p-2 text-slate-500 hover:bg-slate-50 sm:block"><Search className="h-4 w-4" /></button><Link href="/login"><Button variant="outline" size="sm">Sign In</Button></Link><Link href="/signup"><Button variant="govt" size="sm">Get Started <ArrowRight className="h-4 w-4" /></Button></Link></div>
        </div>
      </header>

      <section id="home" className="relative border-b border-[#dce7f2] bg-[url('/landing-student-hero.jpg')] bg-cover bg-right bg-no-repeat"><div className="absolute inset-0 bg-gradient-to-r from-[#eaf4ff] via-[#eaf4ff]/90 to-[#eaf4ff]/30 sm:to-transparent" /><div className="relative mx-auto min-h-[520px] max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20 flex items-center"><div className="max-w-[580px]"><p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1559c7]">Career readiness for MP students</p><h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] text-[#10295d] sm:text-6xl">Your Skills.<br /><span className="text-[#1559c7]">A Stronger Madhya Pradesh.</span></h1><p className="mt-6 max-w-[520px] text-[17px] leading-7 text-[#536987]">Personalized career guidance, skill development, and real opportunities in one place.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/signup"><Button variant="govt" size="lg">Get Started <ArrowRight className="h-5 w-5" /></Button></Link><Link href="#features"><Button variant="outline" size="lg" className="bg-white/90 backdrop-blur-sm">Explore the platform</Button></Link></div></div></div></section>

      <section id="features" className="border-b border-[#dce7f2] bg-white"><div className="mx-auto grid max-w-[1240px] grid-cols-1 divide-y divide-[#e5edf5] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5 lg:px-8">{features.map(([title, copy, Icon]) => <div key={title} className="px-6 py-7 text-center"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf4ff] text-[#1559c7]"><Icon className="h-5 w-5" /></div><h2 className="text-[13px] font-bold text-[#10295d]">{title}</h2><p className="mt-1 text-[11px] leading-5 text-slate-500">{copy}</p></div>)}</div></section>

      <section className="bg-[#f5f9fd] py-12"><div className="mx-auto max-w-[1240px] px-5 lg:px-8"><div className="grid grid-cols-2 gap-4 border border-[#dce7f2] bg-white px-5 py-7 text-center shadow-[0_2px_10px_rgba(25,70,120,0.04)] md:grid-cols-4"><div><strong className="text-3xl text-[#10295d]">{counts.roles}</strong><p className="mt-1 text-[11px] text-slate-500">Career roles in catalog</p></div><div><strong className="text-3xl text-[#10295d]">{counts.courses}</strong><p className="mt-1 text-[11px] text-slate-500">Courses and certifications</p></div><div><strong className="text-3xl text-[#10295d]">{counts.opportunities}</strong><p className="mt-1 text-[11px] text-slate-500">Catalog opportunities</p></div><div className="col-span-2 border-t border-[#e5edf5] pt-5 md:col-span-1 md:border-l md:border-t-0 md:pl-6 md:pt-0"><p className="text-sm italic text-[#536987]">“Every skill is a step toward a stronger tomorrow.”</p><p className="mt-2 text-[11px] font-semibold text-[#10295d]">MP CareerSetu</p></div></div></div></section>

      <section className="bg-white py-16"><div className="mx-auto max-w-[1240px] px-5 lg:px-8"><p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#1559c7]">Simple steps. Real progress.</p><h2 className="mt-2 text-center text-3xl font-extrabold text-[#10295d]">How MP CareerSetu works</h2><div className="mt-10 grid gap-5 md:grid-cols-4">{steps.map((title, index) => <div key={title} className="border border-[#dce7f2] bg-[#f7fbff] p-6"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1559c7] text-sm font-bold text-white">{index + 1}</span><h3 className="mt-5 text-sm font-bold text-[#10295d]">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{stepCopy[index]}</p></div>)}</div></div></section>
      <footer className="border-t border-[#dce7f2] bg-[#10295d] py-7 text-xs text-blue-100"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 px-5 sm:flex-row lg:px-8"><p>MP CareerSetu · Government of Madhya Pradesh</p><div className="flex gap-5"><Link href="/login" className="hover:text-white">Sign In</Link><Link href="/signup" className="hover:text-white">Get started</Link></div></div></footer>
    </main>
  );
}

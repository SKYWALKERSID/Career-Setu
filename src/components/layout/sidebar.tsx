'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  UserCog,
  Compass,
  GitPullRequest,
  BookOpen,
  Building2,
  FileText,
  Mic,
  TrendingUp,
  ShieldCheck,
  Award
} from 'lucide-react';

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Career Recommendations', href: '/career', icon: Compass },
  { label: 'Skill Gaps & Roadmap', href: '/roadmap', icon: GitPullRequest },
  { label: 'Courses & Certifications', href: '/courses', icon: BookOpen },
  { label: 'Opportunities', href: '/opportunities', icon: Building2 },
  { label: 'Resume Copilot', href: '/resume', icon: FileText },
  { label: 'Mock Interview', href: '/interview', icon: Mic },
  { label: 'Progress Tracking', href: '/progress', icon: TrendingUp },
  { label: 'Profile / Settings', href: '/settings', icon: UserCog },
];

const adminNavItems = [
  { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
      if (mounted) setIsAdmin(profile?.role === 'admin');
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <aside className="w-[190px] shrink-0 border-r border-[#dce7f2] bg-white flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="h-[58px] px-4 border-b border-[#e8f0f7] flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-[#2f7d3d] flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
          MP
        </div>
        <div>
          <h1 className="font-bold text-[#10295d] text-[13px] leading-tight">MP CareerSetu</h1>
          <p className="text-[9px] text-slate-500 font-medium">Government of Madhya Pradesh</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-2.5 space-y-5 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Student Platform
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
            'flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-[#e7f0ff] text-[#1559c7] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-[#1559c7]' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            For Institutions
          </p>
          <nav className="space-y-1">
            {isAdmin && adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#e7f0ff] text-[#1559c7] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-[#1559c7]' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="p-3 border-t border-slate-100 bg-[#f5f9ff] m-2.5 rounded-md border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Award className="h-4 w-4 text-emerald-600" />
          <span className="text-[10px] font-semibold text-slate-900">Skilled Youth MP</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          Stronger Madhya Pradesh. More opportunities, brighter futures.
        </p>
      </div>
    </aside>
  );
}

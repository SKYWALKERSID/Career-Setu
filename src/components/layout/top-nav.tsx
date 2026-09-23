'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function TopNav() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  return (
    <header className="h-[58px] border-b border-[#dce7f2] bg-white px-7 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="relative w-[390px] max-w-[48vw]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search for careers, courses, colleges, opportunities..."
          className="w-full h-9 pl-9 pr-4 text-[11px] bg-[#f4f8fd] border border-[#dce7f2] rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <div className="text-[11px] text-slate-500 font-medium">
          <span className="cursor-pointer hover:text-slate-900">हिंदी</span>
          <span className="mx-1">|</span>
          <span className="font-semibold text-slate-900">English</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-600" />
        </button>

        {/* User Profile Summary & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <Link href="/settings" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-full bg-brand-700 text-white font-bold text-[11px] flex items-center justify-center shadow-sm">
              AS
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-semibold text-slate-900 leading-tight">Ananya Sharma</p>
              <p className="text-[9px] text-slate-500 font-medium">B.Tech (CSE) • 7th Sem</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

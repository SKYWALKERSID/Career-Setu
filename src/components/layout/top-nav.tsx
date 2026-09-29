'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUserProfileSummary, UserProfileSummary } from '@/lib/profile/user-profile-summary';

export function TopNav() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const summary = await getCurrentUserProfileSummary();
        if (mounted) setProfile(summary);
      } catch (err) {
        console.error('Failed to load user profile for TopNav:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      const { data: sessionData } = await supabase.auth.getSession();
      if (error || sessionData.session) {
        console.error('Logout did not clear the current local session:', error?.message || 'session still active');
        return;
      }
      router.replace('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="flex h-[62px] min-w-0 items-center justify-between gap-3 border-b border-[#dce7f2] bg-white px-4 sticky top-0 z-30 sm:px-7">
      <div className="min-w-0 flex-1" aria-hidden="true" />

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-4">
        {/* User Profile Summary & Logout */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 sm:gap-2 sm:pl-4">
          <Link href="/settings" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-full bg-brand-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {profile?.initials || '..'}
            </div>
            <div className="text-left hidden sm:block min-w-0 max-w-[170px]">
              <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                {profile?.name || 'Student'}
              </p>
              <p className="text-xs text-slate-500 font-medium truncate">
                {profile?.academicSubtitle || 'Student career profile'}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="ml-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:ml-2"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

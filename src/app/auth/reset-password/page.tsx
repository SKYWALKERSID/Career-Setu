'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';

// ─── helpers ──────────────────────────────────────────────────────────────────

function friendlyUpdateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('characters'))) {
    return 'Please choose a stronger password (minimum 6 characters).';
  }
  if (m.includes('same password') || m.includes('different from')) {
    return 'New password must be different from your current password.';
  }
  if (m.includes('expired') || m.includes('invalid')) {
    return 'This password reset link has expired. Please request a new one.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Something went wrong. Please check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

// ─── inner form (needs useSearchParams so must be in Suspense) ────────────────

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionReady, setSessionReady] = useState<boolean | null>(null); // null = checking
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Supabase appends #access_token=… or ?code=… to the reset link.
  // The browser client picks up the fragment automatically via onAuthStateChange.
  // We also handle the PKCE ?code= flow explicitly.
  useEffect(() => {
    const supabase = createClient();

    // Handle PKCE code exchange (Supabase auth v2 recovery flow)
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setSessionReady(false);
        } else {
          setSessionReady(true);
        }
      });
      return;
    }

    // Fragment-based flow: listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if there is already a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else if (sessionReady === null) {
        // Give the PASSWORD_RECOVERY event a moment to fire before giving up
        const timer = setTimeout(() => setSessionReady((prev) => prev === null ? false : prev), 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    // Client-side validation
    if (newPassword.length < 6) {
      setErrorMsg('Please choose a stronger password (minimum 6 characters).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMsg(friendlyUpdateError(error.message));
        return;
      }

      setSuccess(true);
      // Sign out the recovery session so the user signs in fresh
      await supabase.auth.signOut();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? friendlyUpdateError(err.message) : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── loading while checking session ────────────────────────────────────────────
  if (sessionReady === null) {
    return (
      <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#dce7f2] border-t-[#1559c7]" />
          <p className="text-sm text-[#536987]">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  // ── invalid / expired link ────────────────────────────────────────────────────
  if (sessionReady === false) {
    return (
      <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          This password reset link is invalid or has expired.
        </div>
        <p className="mt-5 text-sm text-[#536987]">Please request a new password reset link.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="govt"
            size="lg"
            className="h-11 w-full"
            onClick={() => router.push('/forgot-password')}
          >
            Request a new reset link
          </Button>
          <Link
            href="/login"
            className="text-center text-xs font-semibold text-[#1559c7] hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── success state ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#10295d]">
          Password updated
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#536987]">
          Your password has been updated successfully. Please sign in with your new password.
        </p>
        <Button
          variant="govt"
          size="lg"
          className="mt-8 h-11 w-full"
          onClick={() => router.push('/login')}
        >
          Continue to Sign In
        </Button>
      </div>
    );
  }

  // ── set new password form ─────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7789a5]">
        Account Recovery
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#10295d]">
        Set a new password
      </h2>
      <p className="mt-2 text-sm text-[#536987]">
        Choose a strong password you haven&apos;t used before.
      </p>

      {errorMsg && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="mt-7 space-y-5">
        <label className="block text-xs font-semibold text-[#10295d]">
          New password
          <div className="relative mt-2">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" />
            <Input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="h-11 pl-10 pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              aria-label={showNew ? 'Hide password' : 'Show password'}
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b8da7]"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block text-xs font-semibold text-[#10295d]">
          Confirm new password
          <div className="relative mt-2">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" />
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="h-11 pl-10 pr-10"
              required
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b8da7]"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <Button
          type="submit"
          variant="govt"
          size="lg"
          className="h-11 w-full"
          isLoading={loading}
          disabled={loading}
        >
          Update Password
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-7 block text-center text-xs font-semibold text-[#1559c7] hover:underline"
      >
        Back to Sign In
      </Link>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen bg-[#f7faff] lg:grid-cols-[1fr_1fr]">
      <section className="flex min-h-screen flex-col bg-[#f7faff] px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex justify-end text-xs font-semibold text-[#10295d]">English⌄</div>
        <div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-8">
          <Suspense fallback={<div className="w-full" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="text-center text-[11px] text-[#7789a5]">Skilled youth · Stronger Madhya Pradesh</p>
      </section>
      <AuthVisualPanel />
    </main>
  );
}

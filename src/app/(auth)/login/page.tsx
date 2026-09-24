'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';

// ─── helpers ──────────────────────────────────────────────────────────────────

function friendlyLoginError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('invalid login') ||
    m.includes('invalid credentials') ||
    m.includes('wrong password') ||
    m.includes('email not confirmed') === false && m.includes('credentials')
  ) {
    return 'Incorrect email or password. Please try again.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for a confirmation link.';
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Something went wrong. Please check your connection and try again.';
  }
  return message || 'Authentication failed. Please try again.';
}

// ─── form component ────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── email / password sign-in ─────────────────────────────────────────────────
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || googleLoading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setErrorMsg(friendlyLoginError(result.error.message));
        return;
      }

      // Onboarding-aware redirect: check whether student profile exists
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', result.data.user.id)
        .single();

      if (!studentProfile) {
        router.push('/onboarding');
      } else {
        router.push(redirectTo);
      }
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error
          ? friendlyLoginError(error.message)
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg('Google sign-in could not be completed. Please try again.');
        setGoogleLoading(false);
      }
      // On success Supabase redirects the browser — no further action needed
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setGoogleLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7789a5]">
        Welcome back
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#10295d]">
        Sign in to MP CareerSetu
      </h2>
      <p className="mt-2 text-sm text-[#536987]">
        Sign in to continue your career journey.
      </p>

      {errorMsg && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
        >
          <p>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-7 space-y-5">
        <label className="block text-xs font-semibold text-[#10295d]">
          Email address
          <div className="relative mt-2">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-11 pl-10"
              required
            />
          </div>
        </label>

        <label className="block text-xs font-semibold text-[#10295d]">
          Password
          <div className="relative mt-2">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-11 pl-10 pr-10"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b8da7]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <div className="text-right text-xs font-semibold text-[#1559c7]">
          <button
            type="button"
            className="hover:underline"
            onClick={() => router.push('/forgot-password')}
          >
            Forgot Password?
          </button>
        </div>

        <Button
          type="submit"
          variant="govt"
          size="lg"
          className="h-11 w-full"
          isLoading={loading}
          disabled={loading || googleLoading}
        >
          Sign In <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[11px] text-[#94a2b5]">
        <span className="h-px flex-1 bg-[#e4ebf3]" />
        OR
        <span className="h-px flex-1 bg-[#e4ebf3]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        aria-label="Continue with Google"
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-[#d0dcea] bg-white text-xs font-semibold text-[#3c4858] shadow-sm transition-colors hover:bg-[#f7faff] hover:border-[#b0c6e0] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d0dcea] border-t-[#1559c7]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/google-icon.svg"
            alt=""
            className="h-4 w-4"
          />
        )}
        {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
      </button>

      <p className="mt-7 text-center text-xs text-[#536987]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-bold text-[#1559c7] hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7faff] lg:grid-cols-[1fr_1fr]">
      <section className="flex min-h-screen flex-col bg-[#f7faff] px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex justify-end text-xs font-semibold text-[#10295d]">English⌄</div>
        <div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-8">
          <Suspense fallback={<div className="w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-[11px] text-[#7789a5]">
          Skilled youth · Stronger Madhya Pradesh
        </p>
      </section>
      <AuthVisualPanel />
    </main>
  );
}

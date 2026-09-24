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

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsAlreadyRegistered(false);

    try {
      const supabase = createClient();
      const redirectUrl = `${getURL()}/onboarding`;

      const result = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (result.error) {
        const msg = result.error.message.toLowerCase();
        if (
          result.error.code === 'user_already_exists' ||
          msg.includes('already registered') ||
          msg.includes('already exists')
        ) {
          setIsAlreadyRegistered(true);
          setErrorMsg('This email is already registered. Please sign in instead.');
        } else {
          setErrorMsg(result.error.message || 'Signup failed. Please try again.');
        }
        return;
      }

      // Supabase anti-enumeration: existing email returns user with identities: []
      if (
        result.data.user &&
        Array.isArray(result.data.user.identities) &&
        result.data.user.identities.length === 0
      ) {
        setIsAlreadyRegistered(true);
        setErrorMsg('This email is already registered. Please sign in instead.');
        return;
      }

      if (result.data.session) {
        router.push('/onboarding');
      } else {
        setSuccessMsg(
          'Account created successfully. Please check your email inbox and spam folder to verify your account.'
        );
      }
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    const query = params.toString();
    router.push(`/login${query ? `?${query}` : ''}`);
  };

  return (
    <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7789a5]">
        Get started — it&apos;s free
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#10295d]">
        Create your account
      </h2>
      <p className="mt-2 text-sm text-[#536987]">
        Start your journey toward better skills and career opportunities.
      </p>

      {successMsg && (
        <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-3.5 text-xs text-green-800">
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mt-5 space-y-2 rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <p>{errorMsg}</p>
          {isAlreadyRegistered && (
            <button
              type="button"
              onClick={goToLogin}
              className="inline-flex items-center gap-1 font-bold text-[#1559c7] underline hover:text-[#10295d]"
            >
              Sign in instead <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSignUp} className="mt-7 space-y-5">
        <label className="block text-xs font-semibold text-[#10295d]">
          Email address
          <div className="relative mt-2">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" />
            <Input
              id="signup-email"
              type="email"
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
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="h-11 pl-10 pr-10"
              required
              minLength={6}
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

        <Button
          type="submit"
          variant="govt"
          size="lg"
          className="h-11 w-full"
          isLoading={loading}
          disabled={loading}
        >
          Create Account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[11px] text-[#94a2b5]">
        <span className="h-px flex-1 bg-[#e4ebf3]" />
        OR
        <span className="h-px flex-1 bg-[#e4ebf3]" />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#9dbce7] text-xs font-semibold text-[#536987] opacity-60"
          title="Google OAuth coming soon"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/google-icon.svg" alt="" className="h-4 w-4" />
          Continue with Google
        </button>
        <button
          type="button"
          disabled
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#9dbce7] text-xs font-semibold text-[#536987] opacity-60"
          title="LinkedIn OAuth coming soon"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/linkedin-icon.svg" alt="" className="h-4 w-4" />
          Continue with LinkedIn
        </button>
      </div>

      <p className="mt-7 text-center text-xs text-[#536987]">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#1559c7] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen bg-[#f7faff] lg:grid-cols-[1fr_1fr]">
      <section className="flex min-h-screen flex-col bg-[#f7faff] px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex justify-end text-xs font-semibold text-[#10295d]">English⌄</div>
        <div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-8">
          <Suspense fallback={<div className="w-full" />}>
            <SignUpForm />
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';
import { AuthVisualPanel } from '@/components/auth/auth-visual-panel';

// ─── helpers ──────────────────────────────────────────────────────────────────

function friendlyResetError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid email') || m.includes('valid email')) {
    return 'Please enter a valid email address.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Something went wrong. Please check your connection and try again.';
  }
  return 'We couldn\'t send the reset email right now. Please try again.';
}

// ─── form ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(friendlyResetError(error.message));
        return;
      }

      // Always show the generic success state — avoids revealing whether
      // the email is registered (prevents account enumeration).
      setSent(true);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? friendlyResetError(err.message) : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── success state ─────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <main className="grid min-h-screen bg-[#f7faff] lg:grid-cols-[1fr_1fr]">
        <section className="flex min-h-screen flex-col bg-[#f7faff] px-5 py-6 sm:px-10 lg:px-16">
          <div className="flex justify-end text-xs font-semibold text-[#10295d]">English⌄</div>
          <div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-8">
            <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#10295d]">
                Check your email
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#536987]">
                If an account exists for <strong className="text-[#10295d]">{email}</strong>, we&apos;ve
                sent a password reset link to that address.
              </p>
              <p className="mt-3 text-xs text-[#7789a5]">
                Didn&apos;t receive it? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="font-semibold text-[#1559c7] hover:underline"
                >
                  request another link
                </button>
                .
              </p>
              <Link
                href="/login"
                className="mt-8 flex items-center gap-1.5 text-xs font-semibold text-[#1559c7] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
          <p className="text-center text-[11px] text-[#7789a5]">Skilled youth · Stronger Madhya Pradesh</p>
        </section>
        <AuthVisualPanel />
      </main>
    );
  }

  // ── request form ──────────────────────────────────────────────────────────────
  return (
    <main className="grid min-h-screen bg-[#f7faff] lg:grid-cols-[1fr_1fr]">
      <section className="flex min-h-screen flex-col bg-[#f7faff] px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex justify-end text-xs font-semibold text-[#10295d]">English⌄</div>
        <div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-8">
          <div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7789a5]">
              Account Recovery
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#10295d]">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#536987]">
              Enter the email address associated with your account and we&apos;ll send you a
              password reset link.
            </p>

            {errorMsg && (
              <div
                role="alert"
                className="mt-5 rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block text-xs font-semibold text-[#10295d]">
                Email address
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" />
                  <Input
                    id="reset-email"
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

              <Button
                type="submit"
                variant="govt"
                size="lg"
                className="h-11 w-full"
                isLoading={loading}
                disabled={loading}
              >
                Send Reset Link
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-7 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1559c7] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
        <p className="text-center text-[11px] text-[#7789a5]">Skilled youth · Stronger Madhya Pradesh</p>
      </section>
      <AuthVisualPanel />
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setErrorMsg('');
    try {
      const supabase = createClient();
      const redirectUrl = `${getURL()}/onboarding`;
      const result = isSignUp 
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } }) 
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      router.push(isSignUp ? '/onboarding' : '/dashboard');
    } catch (error: unknown) { setErrorMsg(error instanceof Error ? error.message : 'Authentication failed. Please check your credentials.'); }
    finally { setLoading(false); }
  };

  return <main className="grid min-h-screen bg-[#f7faff] lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-[#dcecff] lg:block"><div className="absolute inset-0 bg-[url('/login-student-panel.jpg')] bg-cover bg-center" /><div className="absolute inset-0 bg-gradient-to-t from-[#eef6ff]/90 via-[#eef6ff]/50 to-[#dcecff]/30" /><div className="relative flex h-full min-h-screen flex-col justify-between p-12 text-[#10295d]"><Link href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7d3d] text-[10px] font-bold text-white">MP</span><span><strong className="block text-[15px] leading-tight">MP CareerSetu</strong><small className="block text-[10px] text-slate-600">Government of Madhya Pradesh</small></span></Link><div className="max-w-[450px] pb-20"><p className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#1559c7]">Learn. Upskill. Explore. Grow.</p><h1 className="text-5xl font-extrabold leading-[1.03]">Your Goals<br />Today.<br />A Stronger<br />Madhya Pradesh<br />Tomorrow.</h1><p className="mt-5 max-w-[380px] text-[16px] leading-6 text-[#536987]">Personalized career guidance, skill development and real opportunities — all in one platform for MP&apos;s students.</p><div className="mt-8 grid grid-cols-4 gap-3 text-center text-[10px] font-semibold"><span>Personalized<br />Guidance</span><span>Learn<br />New Skills</span><span>Explore<br />Opportunities</span><span>Build a<br />Brighter Future</span></div></div><p className="text-sm italic text-[#536987]">“Empowering youth for a stronger Madhya Pradesh.”<br /><span className="text-xs not-italic">— Government of Madhya Pradesh</span></p></div></section>
    <section className="flex min-h-screen flex-col bg-[#f7faff] px-5 py-6 sm:px-10 lg:px-16"><div className="flex justify-end text-xs font-semibold text-[#10295d]">English⌄</div><div className="mx-auto flex w-full max-w-[470px] flex-1 items-center py-8"><div className="w-full rounded-[10px] border border-[#edf1f6] bg-white p-7 shadow-[0_10px_30px_rgba(25,70,120,0.06)] sm:p-9"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7789a5]">Welcome back</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#10295d]">{isSignUp ? 'Create your account' : 'Login to MP CareerSetu'}</h2><p className="mt-2 text-sm text-[#536987]">Continue your journey towards a brighter future.</p>{errorMsg && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{errorMsg}</div>}<form onSubmit={handleAuth} className="mt-7 space-y-5"><label className="block text-xs font-semibold text-[#10295d]">Email ID / Mobile Number<div className="relative mt-2"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email ID" className="h-11 pl-10" required /></div></label><label className="block text-xs font-semibold text-[#10295d]">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da7]" /><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-11 pl-10 pr-10" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b8da7]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>{!isSignUp && <div className="text-right text-xs font-semibold text-[#1559c7]">Forgot Password?</div>}<Button type="submit" variant="govt" size="lg" className="h-11 w-full" isLoading={loading}>{isSignUp ? 'Create Account' : 'Login'} <ArrowRight className="h-4 w-4" /></Button></form><div className="my-6 flex items-center gap-3 text-[11px] text-[#94a2b5]"><span className="h-px flex-1 bg-[#e4ebf3]" />OR<span className="h-px flex-1 bg-[#e4ebf3]" /></div><button type="button" disabled className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#9dbce7] text-xs font-semibold text-[#536987] opacity-70" title="Single sign-on is not configured">Login with SSO <ArrowRight className="h-4 w-4" /></button><p className="mt-7 text-center text-xs text-[#536987]">{isSignUp ? 'Already have an account?' : 'Don’t have an account?'} <button type="button" onClick={() => setIsSignUp((value) => !value)} className="font-bold text-[#1559c7] hover:underline">{isSignUp ? 'Sign In' : 'Create New Account'}</button></p></div></div><p className="text-center text-[11px] text-[#7789a5]">Skilled youth · Stronger Madhya Pradesh</p></section>
  </main>;
}

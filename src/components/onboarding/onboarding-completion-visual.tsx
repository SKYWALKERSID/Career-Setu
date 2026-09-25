'use client';

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export function OnboardingCompletionVisual() {
  return (
    <section className="relative hidden overflow-hidden bg-[#e8f2ff] lg:block">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/landing-student-hero.jpg')] bg-cover bg-center" />

      {/* Elegant Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#10295d]/90 via-[#10295d]/40 to-transparent" />

      {/* Foreground Content */}
      <div className="relative flex h-full min-h-screen flex-col justify-between p-12 text-white">
        {/* Top subtle status pill */}
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide text-white uppercase">
              Profile Complete
            </span>
          </div>
        </div>

        {/* Bottom Editorial Copy */}
        <div className="max-w-[460px] pb-12">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Ready to Explore
          </div>
          <h2 className="text-4xl font-extrabold leading-tight text-white tracking-[-0.01em]">
            Your Journey Starts Here.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Learn. Build. Grow. Unlock personalized career pathways, government-backed courses, and real opportunities across Madhya Pradesh.
          </p>
        </div>
      </div>
    </section>
  );
}

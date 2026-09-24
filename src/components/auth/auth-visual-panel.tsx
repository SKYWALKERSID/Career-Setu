'use client';

import React from 'react';
import Link from 'next/link';

export function AuthVisualPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-[#dcecff] lg:block">
      <div className="absolute inset-0 bg-[url('/login-student-panel.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#eef6ff]/90 via-[#eef6ff]/50 to-[#dcecff]/30" />
      <div className="relative flex h-full min-h-screen flex-col justify-between p-12 text-[#10295d]">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f7d3d] text-[10px] font-bold text-white">
            MP
          </span>
          <span>
            <strong className="block text-[15px] leading-tight">MP CareerSetu</strong>
            <small className="block text-[10px] text-slate-600">
              Government of Madhya Pradesh
            </small>
          </span>
        </Link>
        <div className="max-w-[450px] pb-20">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#1559c7]">
            Learn. Upskill. Explore. Grow.
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.03]">
            Your Goals<br />Today.<br />A Stronger<br />Madhya Pradesh<br />Tomorrow.
          </h1>
          <p className="mt-5 max-w-[380px] text-[16px] leading-6 text-[#536987]">
            Personalized career guidance, skill development and real opportunities — all in one platform for MP&apos;s students.
          </p>
          <div className="mt-8 grid grid-cols-4 gap-3 text-center text-[10px] font-semibold">
            <span>Personalized<br />Guidance</span>
            <span>Learn<br />New Skills</span>
            <span>Explore<br />Opportunities</span>
            <span>Build a<br />Brighter Future</span>
          </div>
        </div>
        <p className="text-sm italic text-[#536987]">
          “Empowering youth for a stronger Madhya Pradesh.”<br />
          <span className="text-xs not-italic">— Government of Madhya Pradesh</span>
        </p>
      </div>
    </section>
  );
}

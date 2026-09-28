import Link from 'next/link';

export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#f5f9fd] px-5 py-12 text-[#10295d]"><div className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-10"><Link href="/" className="text-sm font-semibold text-[#1559c7]">Back to MP CareerSetu</Link><h1 className="mt-8 text-3xl font-extrabold">Privacy Policy</h1><p className="mt-4 text-base leading-7 text-slate-600">CareerSetu uses your account and profile information to provide personalized career guidance, learning recommendations, opportunity discovery, and progress views. We do not use this page to claim legal compliance beyond the controls implemented in the application.</p><h2 className="mt-8 text-xl font-bold">Your information</h2><p className="mt-2 text-base leading-7 text-slate-600">Profile, resume, interview, and progress records are scoped to your authenticated account. Catalog information is separate from private student records.</p></div></main>;
}

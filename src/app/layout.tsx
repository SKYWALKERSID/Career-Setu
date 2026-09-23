import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MP CareerSetu — AI-Powered Career Readiness & Employability Platform',
  description: 'Personalized career guidance, skill gap analysis, roadmaps, and opportunities for Madhya Pradesh students.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}

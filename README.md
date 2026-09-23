# MP CareerSetu

AI-Powered Career Readiness & Employability Platform for Students in Madhya Pradesh.

Built for the MP Government Hackathon MVP using Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres, Auth, Storage), and OpenAI API.

## Features & Core User Journey

1. **Onboarding & Profile Setup:** Academic details, skills with evidence types, career interests, and location preferences.
2. **AI Career Intelligence:** Explainable Career Readiness Score (0-100 across 6 dimensions) and top 3 evidence-based career path recommendations.
3. **Skill Gap Engine & 90-Day Roadmap:** Comparative analysis of target role requirements vs student skills, yielding weekly learning tasks.
4. **Courses & Certifications:** Curated courses (NPTEL, Swayam, AWS, Google, Meta) mapped to skill gaps.
5. **Opportunity Engine:** Hard filter + skill similarity matching for internships, entry-level jobs, and MP state government programs with verification metadata.
6. **Resume Copilot:** Fact-preserving resume scoring and bullet improvement.
7. **Mock Interview Workspace:** Role-specific conversational AI interviews with rubric scoring and detailed feedback reports.
8. **Progress Tracking:** Readiness score trends and task completion history.
9. **Admin Analytics:** Anonymized aggregate dashboard for placement officers and administrators.

## Tech Stack

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
* **Backend & Database:** Supabase PostgreSQL, Supabase Auth, Supabase Storage
* **AI Orchestration:** Server-side Next.js AI Gateway with Zod JSON Schema validation
* **Design Aesthetic:** Serious, trustworthy, modern government/education platform adhering strictly to reference UI mockups.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and set your Supabase & OpenAI credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Database Migration & Seeding:**
   Apply `supabase/migrations/01_initial_schema.sql` to your Supabase PostgreSQL instance, then run the seed script:
   ```bash
   npm run seed
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

Modular Monolith structured under `src/`:
* `src/app/` — Next.js App Router pages and API routes
* `src/components/ui/` — Accessible UI design system primitives
* `src/lib/ai/` — AI gateway prompts, schemas, and API client
* `src/lib/supabase/` — Supabase client and server instances
* `src/lib/scoring/` — Career Readiness Score calculation engine
* `src/lib/matching/` — Opportunity matching engine
* `src/types/` — TypeScript interfaces and schemas

<div align="center">

# MP CareerSetu 🚀

**Bridging Higher Education to Meaningful Careers Across Madhya Pradesh**

An AI-driven career guidance, skill readiness, and placement enablement platform built for students across universities, colleges, and polytechnics in MP.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

[**Explore Live Demo**](https://career-setu-hslc.vercel.app) • [**Report an Issue**](https://github.com/SKYWALKERSID/Career-Setu/issues) • [**Architecture & Docs**](#architecture)

</div>

---

## 💡 Why MP CareerSetu?

Most college students in Tier-2 and Tier-3 institutions across Madhya Pradesh face a common barrier: **the gap between what is taught in academic syllabi and what modern employers or state public sector exams demand.**

Without access to personalized career coaching or placement cells, students frequently don't know:
- Which career trajectories match their degree, branch, and current semester.
- What specific skills they lack compared to industry job requirements.
- How to structure their remaining semesters into a concrete, week-by-week learning plan.
- How to draft an ATS-friendly, evidence-backed resume without exaggerating facts.
- How to practice technical and behavioral interviews with real-time feedback.

**MP CareerSetu** addresses this challenge with a unified platform that transforms a student's profile into an **actionable, evidence-backed 90-day readiness roadmap**.

---

## 🌟 Key Features

### 1. 🎓 Degree-Aware Academic Profiling
- Built on a comprehensive academic taxonomy covering UGC, AICTE, and state university degrees (**B.Tech, BCA, B.Sc, B.Com, MCA, Polytechnic Diplomas, and more**).
- Dynamic semester progression awareness (2-year to 5-year degrees).
- District-level location preferences across all 55+ districts in Madhya Pradesh.

### 2. 📊 Explainable Career Readiness Score (0–100)
Rather than a black-box percentage, the platform evaluates readiness across six transparent, weighted dimensions:
- **Technical & Domain Skills (25%)**: Skill inventory matched against role requirements.
- **Practical Projects & Evidence (20%)**: Hands-on project portfolio and repository links.
- **Academic Foundation (15%)**: Coursework, branch alignment, and aggregate CGPA.
- **Resume Quality (15%)**: Structural clarity, ATS readability, and impact metrics.
- **Communication & Interview Confidence (15%)**: Practice mock interview performance.
- **Career Alignment (10%)**: Consistency between chosen domains and target roles.

### 3. 🎯 AI Career Recommendations & Skill-Gap Analysis
- Analyzes candidate skills against a catalog of 30+ specialized career paths.
- Computes exact match percentages, highlighting high-priority missing skills.
- Optimized AI pipeline using compact server-side skill intersections and dual-layer caching (in-memory TTL + database-backed run hashing) to guarantee fast, sub-3-second responses without token limits.

### 4. 🗓️ 90-Day Actionable Roadmap
- Generates a 12-week structured curriculum broken into three 30-day phases:
  - **Weeks 1–4**: Foundational core concepts & prerequisite tooling.
  - **Weeks 5–8**: Real-world portfolio project implementation.
  - **Weeks 9–12**: Interview preparation, system design/problem solving, and application prep.
- Interactive task tracking with completion progress synced directly to your readiness score.

### 5. 💼 Opportunity Matching & State Initiatives
- Aggregates internships, entry-level corporate openings, and Madhya Pradesh state public initiatives.
- Provides transparent match breakdowns explaining *why* an opportunity fits your profile.
- Hard filters for district location, minimum eligibility, degree level, and semester.

### 6. 📄 Resume Copilot (Evidence-Grounded)
- Direct PDF parsing using `pdfjs-dist` on the client and server.
- Analyzes resume bullet points against your target role.
- Generates metric-driven rewrites using the Google/Harvard **"Accomplished [X], as measured by [Y], by doing [Z]"** format.
- Strictly guards against fact hallucination—only refines existing experience without fabricating credentials.

### 7. 🎙️ Role-Specific AI Mock Interviews
- Simulates realistic technical and behavioral interviews tailored to your target job role.
- Supports multi-turn conversational dialogue with dynamic follow-up questions.
- Produces comprehensive post-interview feedback evaluated on the STAR method (Situation, Task, Action, Result) with scores for technical accuracy, clarity, and depth.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Client Layer                  │
│       Tailwind CSS  •  shadcn/ui  •  Lucide  •  Recharts     │
└───────────────┬─────────────────────────────▲───────────────┘
                │ HTTP / Server Actions       │ Hydrated State
┌───────────────▼─────────────────────────────┴───────────────┐
│                   Next.js App Router (Node.js)              │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │    Profile Service    │       │   Roadmap Service     │  │
│  ├───────────────────────┤       ├───────────────────────┤  │
│  │ Recommendation Engine │       │  Resume Copilot / PDF │  │
│  ├───────────────────────┤       ├───────────────────────┤  │
│  │   Interview Service   │       │ Opportunities Matcher │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            AI Gateway & Multi-Layer Cache             │  │
│  │  • 15-Minute In-Memory TTL Cache                      │  │
│  │  • Database Input-Hash Versioned Prompt Cache         │  │
│  │  • Primary: Groq (openai/gpt-oss-120b)                │  │
│  │  • Fallback: Google Gemini (gemini-2.0-flash)         │  │
│  │  • Zod Strict Schema Enforcement & Auto-Repair        │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase / PostgreSQL 15                   │
│   • Row-Level Security (RLS) on all user data               │
│   • Relational Catalog (Degrees, Branches, Skills, Roles)   │
│   • Stored Resumes in Secure Encrypted Storage              │
│   • AI Audit Run Logs & Versioned Evaluation Results        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) with custom MP Government theme palette |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) primitives + [Lucide Icons](https://lucide.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security, Auth, Storage) |
| **AI Providers** | [Groq](https://groq.com/) (`openai/gpt-oss-120b`) & [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash`) |
| **Schema Validation** | [Zod 3.24](https://zod.dev/) for type-safe inputs and AI output parsing |
| **Document Processing** | `pdfjs-dist` for in-browser and server-side resume parsing |
| **Data Visualization** | [Recharts](https://recharts.org/) for readiness radar and progress charts |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📂 Project Structure

```text
├── public/                 # Static assets, branding logos, icons
├── src/
│   ├── app/                # Next.js App Router pages & server routes
│   │   ├── (auth)/         # Login, Sign Up, and Password Reset flows
│   │   ├── admin/          # Institutional insight & analytics dashboard
│   │   ├── career/         # Career path discovery & skill-gap inspection
│   │   ├── courses/        # Recommended course resources & certifications
│   │   ├── dashboard/      # Main student dashboard & readiness summary
│   │   ├── interview/      # Mock interview setup, chat session & report
│   │   ├── onboarding/     # 5-step guided student onboarding wizard
│   │   ├── opportunities/  # Internship and job matching portal
│   │   ├── progress/       # 90-day roadmap task checklist & milestones
│   │   ├── resume/         # Resume upload, ATS scanner & bullet enhancer
│   │   └── settings/       # Profile management & academic information
│   ├── components/         # Reusable React UI components
│   │   ├── academic/       # Degree & branch searchable comboboxes
│   │   ├── onboarding/     # Step visuals and completion graphics
│   │   └── ui/             # Core UI atoms (Button, Card, Select, Badge)
│   ├── lib/                # Business logic, services & shared utilities
│   │   ├── academic/       # UGC/AICTE degree & branch taxonomies
│   │   ├── ai/             # AI gateway, prompt templates, and caching
│   │   │   ├── providers/  # Groq and Gemini API client integrations
│   │   │   └── prompts/    # Validated prompt builders for all features
│   │   ├── profile/        # Profile actions, scoring algorithms & schemas
│   │   └── supabase/       # Supabase client & server session helpers
│   └── types/              # Global TypeScript definitions
├── supabase/               # Database migrations, seed data & schema DDL
└── tests/                  # Playwright end-to-end and smoke test specs
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js**: v18.18 or higher (LTS recommended)
- **npm** or **pnpm**
- **Supabase Account**: A free project with PostgreSQL and Auth enabled
- **AI API Key**: Groq API Key (recommended) or Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/SKYWALKERSID/Career-Setu.git
cd Career-Setu
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Fill in your configuration keys:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Provider Configuration (groq or gemini)
AI_PROVIDER=groq

# Groq Credentials (Recommended)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Google Gemini Credentials (Alternative / Fallback)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### 4. Seed the Database

Run the database seed script to populate academic degrees, branches, canonical skills, career roles, and verified opportunities:

```bash
npm run seed
```

### 5. Launch Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

The project includes unit verification, type checks, linting, and smoke tests:

```bash
# Type-check entire codebase
npx tsc --noEmit

# Run ESLint rules
npm run lint

# Execute unit and contract test suites
npm test

# Run Playwright end-to-end smoke tests
npm run test:e2e:smoke

# Test production build locally
npm run build
```

---

## 🛡️ Security, Privacy & Compliance

- **Row Level Security (RLS)**: Strictly enforced at the database level so students can only read and modify their own records, resumes, and interview responses.
- **Private File Storage**: Uploaded resumes are placed in private, server-only Supabase storage buckets with time-limited signed access URLs.
- **Credential Hygiene**: Provider API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are server-only environment variables and are never transmitted to client bundles.
- **Fact-Grounded AI**: The platform relies on database-retrieved taxonomy records for skills and qualifications rather than generating fictitious job requirements or deadlines.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

---

<div align="center">

Built with ❤️ for the students of Madhya Pradesh.

[**Launch MP CareerSetu**](https://career-setu-hslc.vercel.app)

</div>

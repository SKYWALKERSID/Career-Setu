<div align="center">

# MP CareerSetu

### AI-Powered Career Readiness & Employability Platform

**Move from academic profile → career target → skill gap → action plan → opportunity → interview readiness.**

[Live Demo](https://career-setu-hslc.vercel.app) · [GitHub Repository](https://github.com/SKYALKERSID/Career-Setu)

</div>

---

## Overview

**MP CareerSetu** is an AI-enabled student career platform designed for the Madhya Pradesh government/public-service context. It analyzes a student's academic profile, skills, resume, and career interests, then converts that information into an actionable career plan.

The MVP is designed around demonstrable outcomes rather than feature breadth: a student should leave the platform knowing **what career to target, what skills are missing, what to learn next, which opportunities fit, and how prepared they are for selection**.

CareerSetu is intentionally designed as a continuous journey rather than a one-time chatbot interaction.

> **Readiness → Action, rather than Chatbot → Answer.**

Every AI output is intended to lead to a measurable next step.

---

## Problem It Solves

CareerSetu directly addresses the need for an AI-enabled platform that can:

- Analyze student profiles and academic records.
- Recommend career paths and government employment opportunities.
- Identify skill gaps and suggest learning interventions.
- Recommend courses and certifications.
- Match internships and job opportunities.
- Generate AI-based resume improvements.
- Conduct role-specific mock interviews.

The platform is aimed especially at students who do not have access to high-quality one-to-one career counselling.

---

## Product Vision

Make career guidance **personalized, evidence-driven, and actionable** for students across Madhya Pradesh.

CareerSetu is not intended to replace human career counsellors for high-stakes decisions, guarantee job placement, or act as the final authority on eligibility. Official sources remain authoritative for real-world eligibility decisions.

---

# Core User Journey

```text
Onboarding
    ↓
Profile Completion
    ↓
Resume Upload
    ↓
Career Assessment
    ↓
Career Readiness Score
    ↓
Recommended Career Paths
    ↓
Skill-Gap Analysis
    ↓
Personalized 90-Day Roadmap
    ↓
Course / Certification Suggestions
    ↓
Opportunity Matching
    ↓
Resume Improvement
    ↓
Mock Interview
    ↓
Progress Tracking
```

The PRD defines this as the central product journey, connecting career discovery with concrete preparation and measurable progress. fileciteturn12file0L62-L65

---

# Core Features

## 1. Student Profile

Students create and maintain a structured profile containing:

- academic details
- branch / discipline
- semester
- CGPA / grades where provided
- skills
- interests
- location
- preferred career domains
- target careers

The profile is editable and can be used to recalculate readiness. fileciteturn12file0L66-L74

---

## 2. AI Profile Analysis

The platform uses structured AI analysis of normalized student profile information and resume facts.

The intended output includes structured:

- strengths
- weaknesses
- evidence
- missing data

AI outputs are validated before being persisted or shown in the UI. fileciteturn12file0L75-L79 fileciteturn12file1L95-L108

---

## 3. Career Readiness Score

CareerSetu uses an explainable **0–100 Career Readiness Score** rather than an opaque model for the MVP.

| Dimension | Weight |
|---|---:|
| Technical / domain skills | 25% |
| Academic foundation | 15% |
| Projects / practical evidence | 20% |
| Resume quality | 15% |
| Communication / interview readiness | 15% |
| Career alignment | 10% |

The score is an **advisory indicator**, not a hiring decision. fileciteturn12file0L149-L150 fileciteturn12file0L155-L168

---

## 4. Career Recommendations

CareerSetu recommends career paths based on profile evidence and career-role context.

Each recommendation is intended to provide:

- a fit score
- rationale / explanation
- missing skills
- next steps

The MVP target is the **top 3 career paths with fit explanation** where defensible catalog matches exist. fileciteturn12file0L80-L88

---

## 5. Skill-Gap Engine

The Skill Gap Engine compares the student's current skills with the selected target role's requirements.

It is intended to produce:

- ranked skill gaps
- suggested learning actions

This connects career recommendations to practical preparation rather than stopping at a recommendation. fileciteturn12file0L93-L98

---

## 6. Personalized 90-Day Roadmap

The platform turns identified gaps into a structured 90-day action plan with weekly milestones for:

- learning
- projects
- interview preparation

The roadmap is expected to contain measurable tasks and coherent sequencing. fileciteturn12file0L99-L104

---

## 7. Course & Certification Discovery

CareerSetu maps identified gaps to curated learning resources.

The intended experience includes relevance and reasons for each recommendation, connecting learning directly to the student's identified needs. fileciteturn12file0L120-L125

---

## 8. Opportunity Matching

Opportunity matching uses a hybrid approach:

```text
Hard Filters
    ↓
Skill Similarity
    ↓
Goal Alignment
    ↓
Evidence Strength
    ↓
Semantic Similarity
    ↓
Explain Match Reasons
```

Hard filters can include:

- location
- education level
- branch / discipline
- experience
- explicit eligibility where available

Semantic ranking then considers skill overlap, career goals, interests, and roadmap alignment. fileciteturn12file1L119-L131

The PRD also identifies government employment opportunities as a first-class destination in the product. fileciteturn12file0L141-L148

---

## 9. Resume Copilot

Resume Copilot provides AI-assisted resume improvement and targeted rewriting.

The technical design defines Resume Improvement as taking:

```text
Parsed Resume + Target Role
        ↓
Issues + Rewritten Bullets + Missing Evidence
```

The product requirement is explicit that improved bullets must **not invent facts**. fileciteturn12file1L99-L110 fileciteturn12file0L112-L115

The broader Resume Copilot workflow is intended to keep the resume grounded in source information while producing actionable career-specific improvements.

---

## 10. Mock Interview

The Mock Interview feature provides a role-specific conversational interview experience.

It is designed to:

- ask questions
- capture answers
- score responses
- return rubric-based feedback
- continue the interview with the next question

The technical prompt architecture uses target role, difficulty, and prior answers as inputs. fileciteturn12file0L116-L119 fileciteturn12file1L105-L110

---

## 11. Progress Tracking

Progress Tracking connects roadmap completion with readiness and score trends.

Students can mark roadmap tasks complete and review progress over time. fileciteturn12file0L126-L129

---

## 12. Admin / Institutional View

The planned admin experience is designed around aggregate, anonymized insight rather than unnecessary exposure of individual personal data.

The PRD identifies use cases including:

- common skill-gap analysis
- aggregate usage
- intervention metrics
- placement / counselling support

The admin dashboard is a P1 feature in the MVP prioritization and is intended for demo/admin use. fileciteturn12file0L130-L133

---

# Product Differentiator

CareerSetu is built around a **Readiness → Action** model rather than a **Chatbot → Answer** model.

The PRD highlights five differentiating principles:

1. Explainable readiness scoring instead of generic AI advice.
2. Evidence-backed recommendations tied to the student profile.
3. Government employment opportunities as a first-class destination.
4. A 90-day action plan that converts recommendations into tasks.
5. One continuous journey from profile to mock interview. fileciteturn12file0L141-L148

This creates a connected flow:

```text
Student Evidence
      ↓
Career Decision Support
      ↓
Skill Gaps
      ↓
Action Plan
      ↓
Learning
      ↓
Opportunity
      ↓
Resume
      ↓
Interview
      ↓
Progress
```

---

# AI Design Principles

CareerSetu's technical design intentionally keeps AI structured and controllable.

## Structured Outputs

Every AI feature feeding the UI should request JSON matching a strict schema and should be validated with Zod before persistence or display. Malformed responses are rejected and can be repaired once through a repair prompt. fileciteturn12file1L95-L98

## Retrieval-First Design

Factual catalogs should come from application-controlled records rather than being invented by the model.

Career role requirements, course metadata, and opportunities should be retrieved from controlled application data. The model interprets and ranks retrieved records; it does not create official eligibility facts from memory. fileciteturn12file1L111-L114

## AI as Interpretation, Not Authority

AI is designed to support decisions and provide explanations. Official sources remain authoritative for eligibility and real-world opportunity information. fileciteturn12file0L38-L43

---

# Architecture

CareerSetu follows a **modular monolith** approach using managed infrastructure and structured AI outputs.

The engineering principle is to maximize judging reliability and visible functionality while avoiding unnecessary microservices or custom model training. fileciteturn12file1L5-L8

### High-Level Architecture

```text
Browser
   ↓
Next.js UI
   ↓
API / Server Actions
   ↓
Domain Services
   ↓
PostgreSQL / Storage / Vector
   ↓
Search / AI Gateway
   ↓
LLM Provider
```

The AI Gateway centralizes prompt templates, model calls, retries, JSON-schema validation, and safety rules. fileciteturn12file1L48-L65

---

# Technology Stack

| Layer | Technology / Approach |
|---|---|
| Web app | Next.js + TypeScript + Tailwind CSS |
| UI | shadcn/ui + Lucide icons |
| Authentication | Supabase Auth |
| Database | PostgreSQL via Supabase |
| File storage | Supabase Storage |
| AI orchestration | Server-side TypeScript functions |
| LLM | Approved model endpoint behind the AI Gateway |
| Embeddings | pgvector / managed vector store |
| Charts | Recharts |
| Telemetry | Sentry + lightweight event logging |
| Deployment | Vercel + Supabase |

These choices come directly from the TRD's recommended stack. fileciteturn12file1L16-L41 fileciteturn12file1L43-L47

---

# Domain Services

The platform is organized into domain-oriented services:

| Service | Responsibility |
|---|---|
| Profile Service | Student profile CRUD and normalization |
| Assessment Service | Career Readiness Score and dimension breakdown |
| Recommendation Service | Career, course, and opportunity recommendations |
| Matching Service | Hard filters and semantic-similarity ranking |
| Resume Service | Resume text extraction, fact structuring, suggestions |
| Interview Service | Question generation, answer capture, scoring, feedback |
| AI Gateway | Prompt templates, model calls, retries, schema validation, safety |
| Data layer | Postgres, storage, vector embeddings, audit metadata |

fileciteturn12file1L51-L65

---

# Core Data Model

The TRD defines the following core entities:

```text
users
student_profiles
skills
student_skills
career_roles
career_recommendations
roadmaps
roadmap_tasks
opportunities
opportunity_matches
resumes
interviews
interview_turns
ai_runs
```

Important relationships include:

- student profiles → target careers
- student skills → canonical skills
- career roles → required / preferred skills
- recommendations → student + role
- roadmaps → student + target role
- roadmap tasks → roadmap
- opportunities → source / eligibility / skills
- opportunity matches → student + opportunity
- resumes → student + stored source + extracted text + parsed data
- interviews → student + role
- AI runs → feature-level AI telemetry

fileciteturn12file1L66-L76 fileciteturn12file1L81-L94

---

# API Surface

The technical design defines the following protected product actions:

| Method | Endpoint / Action | Purpose |
|---|---|---|
| POST | `/api/profile` | Create / update profile |
| POST | `/api/profile/analyze` | Run profile analysis |
| POST | `/api/career/recommend` | Generate career recommendations |
| POST | `/api/roadmap/generate` | Generate 90-day roadmap |
| GET | `/api/opportunities` | List filtered opportunities |
| POST | `/api/opportunities/match` | Return ranked matches |
| POST | `/api/resume/parse` | Parse uploaded resume |
| POST | `/api/resume/improve` | Generate targeted improvements |
| POST | `/api/interview/start` | Create interview session |
| POST | `/api/interview/respond` | Score answer and generate next question |
| GET | `/api/dashboard` | Return student progress data |

Every protected action should apply server-side authorization, and provider API keys must never reach the client. fileciteturn12file1L132-L146

---

# Security & Privacy

Security is part of the technical architecture, not an afterthought.

CareerSetu is designed to:

- use Supabase Row Level Security for student-owned records
- store uploaded resumes in private buckets
- generate short-lived signed URLs where needed
- use HTTPS for data in transit
- rely on managed encrypted storage at rest
- avoid logging raw resumes, interview answers, or AI tokens
- keep provider keys only in server-side environment variables
- apply rate limits to AI endpoints
- use least-privilege database roles
- avoid sensitive demographic attributes in recommendation scores
- provide account/data deletion workflow in the technical backlog

fileciteturn12file1L147-L160

The product also requires unauthorized access to another student's data to fail. fileciteturn12file1L224-L234

---

# AI Safety & Trust

CareerSetu's AI layer follows several explicit trust requirements:

- Never invent a qualification, job, deadline, salary, eligibility rule, or certification.
- Display source / last-verified metadata for opportunities where possible.
- Explicitly label inferred information and uncertainty.
- Keep resumes and academic records private by default.
- Do not use sensitive personal attributes for career ranking.
- Provide a "Why am I seeing this?" explanation for recommendations.
- Allow users to correct profile data and regenerate outputs.

fileciteturn12file0L173-L180

---

# Reliability & Fallbacks

The TRD explicitly designs for third-party failure and judging reliability.

| Risk | Fallback |
|---|---|
| LLM timeout | Retry once, then return cached / demo-safe response where applicable |
| Malformed JSON | Schema validation → repair call → deterministic fallback |
| Opportunity data unavailable | Seeded verified demo dataset with visible source metadata |
| Embedding service unavailable | Keyword / skill-taxonomy scoring |
| Resume parsing fails | Manual profile input + actionable error |
| Internet degradation | Core dashboard, sample profiles, and precomputed demo outputs |

fileciteturn12file1L161-L171

The architecture also keeps provider choice swappable behind the AI Gateway rather than tightly coupling the application to one model or one opportunity source. fileciteturn12file1L278-L290

---

# Non-Functional Requirements

The hackathon MVP targets:

| Requirement | Target |
|---|---|
| First meaningful page load | < 3 seconds on normal broadband for demo routes |
| API response excluding LLM | < 500 ms target for common CRUD/read operations |
| AI feature response | Prefer < 8 seconds, with visible progress state |
| Availability during judging | Demo mode should not depend on live third-party job feeds |
| Accessibility | Keyboard-navigable primary flows, readable contrast, clear form labels |
| Responsive support | Desktop-first for judging + usable mobile layout |

fileciteturn12file1L172-L181

---

# Frontend Information Architecture

| Route | Screen |
|---|---|
| `/` | Landing / value proposition / demo entry |
| `/onboarding` | Profile setup wizard |
| `/dashboard` | Career Readiness Score, top recommendation, roadmap progress |
| `/career/[id]` | Career detail, skill gaps, roadmap and courses |
| `/opportunities` | Jobs, internships, government opportunities |
| `/resume` | Resume upload + analysis + improvement |
| `/interview` | Mock interview workspace |
| `/progress` | Roadmap tasks, score trend, achievements |
| `/admin` | Demo-only aggregate dashboard |

fileciteturn12file1L182-L198

---

# Testing Strategy

The technical plan uses multiple layers of verification:

### Unit Testing

- score calculation
- hard filters
- skill normalization
- validation schemas

### Integration Testing

- profile → AI analysis → recommendation → roadmap

### AI Contract Testing

- JSON-schema compliance
- no fabricated fields

### Security Testing

- unauthorized access to another student's data must fail

### UI Smoke Testing

- onboarding
- dashboard
- career
- opportunities
- resume
- interview

### Demo Rehearsal

- full live path
- seeded profile
- controlled failure scenarios

fileciteturn12file1L224-L234

---

# Seed Dataset

The hackathon dataset is planned around:

- **20–40 career roles** spanning software, data, cybersecurity, electronics, commerce, public administration, and other student-relevant paths.
- **100–300 curated opportunities** with source URLs, eligibility fields, and verification dates.
- **50–100 courses / certifications** mapped to normalized skills.
- **10–20 scholarships / government schemes** as a future or P1 module.
- **3–5 prepared demo student personas** representing different branches and goals.

fileciteturn12file1L235-L241

---

# Deployment & Environments

| Environment | Configuration |
|---|---|
| Local | Node.js LTS, `.env.local`, Supabase project, seeded DB |
| Preview | Vercel preview deployment with masked test data |
| Demo | Dedicated Vercel production project, stable seed dataset, backup AI responses |
| Secrets | Vercel / Supabase secret storage; never commit keys |

fileciteturn12file1L242-L248

---

# Local Development

## Prerequisites

- Node.js LTS
- npm
- Supabase project
- AI provider credentials configured server-side

## Setup

```bash
git clone https://github.com/SKYALKERSID/Career-Setu.git
cd Career-Setu
npm install
```

Create `.env.local` using the environment variables required by the application. **Never commit secrets.**

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

> The exact environment variable names and local migration/seed commands should remain aligned with the repository's current implementation.

---

# Engineering Workflow

The TRD explicitly recommends a vertical-slice workflow using Codex + Antigravity:

- **Codex:** architecture, database schema, API routes, server-side logic, validation, tests, integration fixes, and refactoring.
- **Antigravity:** UI exploration, page composition, visual polish, interaction states, responsive layout, and front-end iteration.
- **Human review:** product decisions, data realism, API permissions, AI output quality, demo script, and final QA.

The guiding rule is to maintain one source of truth for requirements, build small vertical slices, test them, and only then move on. fileciteturn12file1L199-L208

---

# Suggested Build Order

The project plan specifies this implementation sequence:

1. Scaffold Next.js app, Supabase schema, auth, and seeded demo data.
2. Build student onboarding + dashboard with static readiness data.
3. Add real scoring engine and profile analysis.
4. Add career recommendation + skill-gap workflow.
5. Add roadmap generation + progress tracking.
6. Add opportunity matching using seeded data + vector / keyword fallback.
7. Add resume parsing / improvement.
8. Add mock interview.
9. Polish UI, loading/error/empty states, and demo persona.
10. Freeze features and rehearse the complete demo three times.

fileciteturn12file1L209-L219

---

# Project Priorities

The PRD organizes features into three priority levels.

### P0 — Core MVP

- Student Profile
- AI Profile Analysis
- Career Readiness Score
- Career Recommendations
- Skill Gap Engine
- 90-Day Roadmap
- Opportunity Matching
- Resume Copilot
- Mock Interview

### P1

- Course / Certification Discovery
- Progress Tracking
- Admin Dashboard

### P2

- Hindi Voice Interaction

fileciteturn12file0L66-L88 fileciteturn12file0L93-L139

---

# Success Metrics for the MVP

The PRD defines these demo-oriented targets:

| Metric | MVP Target |
|---|---|
| Onboarding completion | ≥ 80% of demo users reach profile analysis |
| Time to first useful recommendation | < 2 minutes after profile completion |
| Recommendation explanation coverage | 100% of career recommendations show rationale |
| Roadmap generation success | ≥ 95% of valid profiles generate a roadmap |
| Opportunity relevance | ≥ 70% of top-5 opportunities judged relevant in manual test |
| Demo reliability | No P0 failure in three consecutive full demo runs |

fileciteturn12file0L181-L188

---

# Technical Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Scope explosion | High | High | Freeze P0 scope; add P1 only after full P0 works |
| LLM hallucination | Medium | High | Retrieval-first design, schema validation, source metadata |
| Too much UI, too little backend | Medium | High | End-to-end vertical slices; every screen uses real or clearly marked seeded data |
| Live API failure | Medium | High | Seeded dataset, graceful fallbacks, precomputed critical demo responses |
| Poor recommendation quality | Medium | High | Curated role taxonomy, explicit scoring, human review |
| Agent-generated regressions | Medium | Medium | Small commits, automated tests, review after every vertical slice |

fileciteturn12file1L249-L277

---

# Definition of Done — Hackathon MVP

The MVP is considered complete when:

- A user can complete onboarding without developer intervention.
- A real profile produces a Career Readiness Score with explainable dimensions.
- Top career recommendations are connected to specific skill gaps.
- A 90-day roadmap is generated and progress can be updated.
- At least one opportunity list shows realistic match scores and reasons.
- Resume upload produces useful, non-fabricated improvement suggestions.
- Mock interview completes end-to-end and returns a score / feedback summary.
- Unauthorized data access is blocked.
- The application remains demoable using seeded data if an external service fails.
- The complete demo can be executed in under 6 minutes without changing code.

fileciteturn12file1L278-L288

---

# Hackathon Demo Flow

The PRD's recommended demo script is:

1. Start with a student persona and one concrete career goal.
2. Complete the profile and upload a sample resume.
3. Show AI profile diagnosis and the Career Readiness Score.
4. Open a recommended career and show skill gaps + evidence.
5. Generate the 90-day roadmap and mark one task complete.
6. Show matched opportunities and explain why one ranks highly.
7. Run a short mock interview and show its feedback report.
8. Finish with an impact dashboard showing readiness, interventions, and opportunities unlocked.

fileciteturn12file0L193-L201

---

# Future Scope

The PRD identifies the following future directions:

- verified government opportunity feeds and scholarship services
- institution / college dashboards and placement analytics
- regional-language voice assistant and low-bandwidth mode
- career assessments and skill verification
- employer-side matching and apprenticeship workflows
- longitudinal outcomes from skill completion through application, interview, and placement

fileciteturn12file0L202-L208

---

# Project Scope & Disclaimer

MP CareerSetu is specified as a **hackathon MVP**, not a production government deployment. Real-world data integrations and eligibility rules must be verified before operational use. fileciteturn12file0L209-L210

CareerSetu is an advisory career-development platform. Its readiness scores and AI-generated guidance are not hiring decisions, employment guarantees, or authoritative eligibility determinations. Official sources remain authoritative where applicable. fileciteturn12file0L38-L43 fileciteturn12file0L168-L168

---

# License

Add the repository's actual license here when one is intentionally selected. Do not claim an open-source license unless the repository has been licensed accordingly.

---

<div align="center">

### MP CareerSetu

**From career uncertainty to an actionable readiness plan.**

[Live Demo](https://career-setu-hslc.vercel.app)

</div>

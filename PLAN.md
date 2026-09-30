# MP CareerSetu Stabilization Plan

Updated: 2026-09-30

## Release Gate

The project is not ready to claim production readiness until the live authenticated flow proves:

`profile -> readiness -> recommendations -> target career -> skill gaps -> roadmap -> resume -> interview -> progress`

with persisted, student-owned data and no fabricated results.

## Order of Work

1. **Deployment identity**: confirm the live Vercel deployment corresponds to the current `main` commit.
2. **Provider configuration**: confirm Groq is active in production and classify any provider failure without exposing secrets.
3. **Recommendation trigger**: verify the authenticated profile can generate and persist catalog-constrained recommendations.
4. **Target-career handoff**: select one persisted recommendation and verify the canonical role ID reaches skill-gap, roadmap, and interview actions.
5. **Skill-gap and roadmap**: verify real skill-ID comparison, structured generation, idempotent persistence, and task completion.
6. **Resume pipeline**: verify the committed synthetic PDF through private upload, extraction, structured analysis, persistence, and refresh.
7. **Interview pipeline**: verify question generation, answer persistence, evaluation, completion, and report persistence.
8. **Courses/opportunities**: verify real relationship filters, date formatting, and deterministic matching against catalog rows.
9. **Progress/dashboard/settings**: verify aggregation only after upstream evidence exists.
10. **Regression**: run typecheck, lint, build, focused Playwright tests, and the production smoke suite.

## Guardrails

- Do not add mock AI output, hardcoded careers, fake scores, or QA-specific production branches.
- Do not modify schema, RLS, authentication, or private storage to make a test pass.
- Preserve the shared AI abstraction and Gemini alternate provider.
- Surface unavailable, pending, insufficient-evidence, and database-error states distinctly.
- Do not call the release gate complete from source inspection alone.

## Current Status

- Provider abstraction: local Groq smoke verified.
- Recommendation trigger: source-level repair present, live proof verified.
- Resume Copilot: role-switch document persistence, AI response reproducibility, and offline unit test suite verified.
- Downstream P0 pipeline: active verification complete across core flows.

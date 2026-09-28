# MP CareerSetu Production Audit

Updated: 2026-09-28

## Scope

This audit covers the current repository and the deployed target `https://career-setu-hslc.vercel.app`. It is intentionally evidence-based: a catalog page or successful build is not treated as proof that a personalized pipeline works.

## Current Repository State

- Branch: `main`
- Local HEAD: `b3a6f77`
- Active provider in source: Groq, selected by `AI_PROVIDER` with Groq as the default.
- Gemini provider: retained as an alternate implementation.
- Local provider smoke test: passed through the shared provider abstraction with structured JSON and Zod validation.
- TypeScript: passed after the current recommendation-trigger changes.
- ESLint: passed after the current recommendation-trigger changes.
- Production build: passed after the current recommendation-trigger changes.

## Production Evidence

- Live URL responds successfully over HTTPS.
- The live `/career` page currently renders the career shell and tabs but no recommendation cards or target-role controls for the QA session.
- The live career-to-interview integration test fails before interview setup because no selectable target career is present.
- The live resume fixture test only verifies the honest unavailable/evidence state; it does not prove successful AI analysis.
- The production deployment commit and production AI environment values cannot be independently confirmed from the repository or public response headers in this environment.

## Data Pipeline Map

| Stage | Existing source | Persisted output | Current confidence |
|---|---|---|---|
| Authentication | Supabase Auth server client | Auth session | Verified in existing smoke coverage |
| Profile/onboarding | `saveStudentProfile` | `student_profiles`, `student_skills` | Source path present |
| Readiness | `calculateAndSaveReadinessAssessment` | `readiness_assessments`, mirrored profile score | Source path present; live result not re-proven here |
| Recommendations | `generateCareerRecommendations` via shared `AIProvider` | `ai_runs`, `career_recommendations` | Local provider path works; live personalized result not verified |
| Target career | `toggleTargetCareerRole` | `student_profiles.target_careers` | Source path present |
| Skill gaps | `getSkillGaps` and deterministic comparison | Derived from target role and `student_skills` | Blocked in live flow by missing target/recommendations |
| Roadmap | `generateRoadmap` | `roadmaps`, roadmap tasks, `ai_runs` | Source path present; live generation not verified |
| Courses | `discoverCourses` and course-skill mappings | Catalog-derived | Source path present; live filter verification pending |
| Opportunities | deterministic matcher and `opportunity_matches` | Match rows | Source path present; live end-to-end verification pending |
| Resume | authenticated upload/extraction/analysis action | private storage, resume row, parsed data | Fixture exists; successful live analysis not verified |
| Interview | setup/session/question/evaluation/report actions | interview sessions/turns/reports | Blocked upstream by target career availability |
| Progress | authenticated aggregate queries | Derived view state | Downstream verification pending upstream success |

## Known Root-Cause Boundary

The career page previously read only persisted `career_recommendations` and had no generation trigger. The repository now has a server-side `ensureCareerRecommendations` path used when an authenticated profile has no persisted rows, and profile save invokes the existing generator after readiness persistence. This is the smallest source-level repair currently made for that handoff.

The live deployment has not yet demonstrated the repaired path. Until a deployed recommendation row is generated and rendered, downstream target-career, skill-gap, roadmap, and interview claims remain unverified.

## Security Review Notes

- Groq credentials are read in the server provider only.
- No `NEXT_PUBLIC_GROQ_API_KEY` is present in the example configuration.
- Playwright authentication state and local environment files are ignored.
- No service-role credential is used by browser tests or the Groq provider.

## Open Blockers

1. Confirm the deployed build contains the current `main` commit.
2. Confirm production `AI_PROVIDER=groq`, `GROQ_MODEL=openai/gpt-oss-120b`, and a usable `GROQ_API_KEY` without exposing secrets.
3. Re-run the live career recommendation flow and capture a successful persisted result.
4. Only after that, verify target career, skill gaps, roadmap, resume analysis, and interview end to end.

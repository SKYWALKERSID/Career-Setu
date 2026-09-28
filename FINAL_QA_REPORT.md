# MP CareerSetu — Productionization Verification Report

Date: 2026-09-28
Target: `https://career-setu-hslc.vercel.app`

## Overall Status

**PARTIAL / NOT READY**

The repository builds cleanly and the local Groq provider abstraction passes a real structured smoke request. The deployed application’s first failing point was proven through authenticated telemetry: Groq returned recommendation objects without the required `score` field, causing Zod rejection before persistence. A minimal contract repair is now prepared; live acceptance remains pending deployment and re-test.

## Repository Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | EXIT CODE 0 |
| `npm run lint` | EXIT CODE 0 |
| `npm run build` | EXIT CODE 0 |
| Focused recommendation schema test | EXIT CODE 0 |
| Local Groq structured smoke | PASS |

## Live Focused Verification

| Check | Result |
|---|---|
| Public QA authentication setup | PASS |
| Career target -> interview integration | FAIL |
| Resume fixture honest-state test | PASS |

### Blocking Live Failure

- Route: `/career`
- Reproduction: authenticate with the configured QA account, open `/career`, and look for the target-role control used to persist a catalog role before opening interview setup.
- Expected: at least one real persisted recommendation or catalog-backed selectable role with a target control.
- Actual: the live page showed no career roles and no `Set target role` / `Remove target role` control; the integration test could not reach `/interview/setup`.
- Root cause: authenticated `ai_runs` telemetry recorded `AI_SCHEMA_ERROR` for missing `recommendations.0.score` and `recommendations.1.score` while using Groq `openai/gpt-oss-120b`.
- Impact: target-career selection, skill gaps, roadmap generation, and interview question generation cannot be truthfully marked end to end.

## Implemented Source Change

The existing recommendation architecture was preserved. A server-side `ensureCareerRecommendations` path invokes the existing catalog-constrained generator for an authenticated student with no cached recommendation rows. Profile save also invokes that generator after readiness persistence. The recommendation schema now explicitly requests the canonical `recommendations` wrapper and `score` output, while safely normalizing equivalent provider aliases before validation. No mock data, catalog duplication, service-role access, or client-side AI credentials were added.

The recommendation contract now also requires decimal confidence and safely normalizes numeric provider percentages above `1` before validation; values that remain invalid are still rejected. No mock data, catalog duplication, service-role access, or client-side AI credentials were added.

The latest live run also proved the provider and schema succeeded before catalog validation rejected a cross-role skill ID. The validator was not weakened; the prompt now requires every skill evidence ID to come from the same role's requirements.

## Provider Evidence

- Active local provider: Groq.
- Local model: `openai/gpt-oss-120b`.
- Local smoke: real request, structured JSON response, Zod validation passed.
- Production provider configuration and deployed commit: not independently confirmed from public deployment metadata.

## Unverified Features

Personalized career recommendations, target-career persistence in the live environment, skill gaps, roadmap generation, resume AI analysis, interview question/evaluation/report generation, and progress aggregation remain unverified until the fifth contract repair is deployed and exercised live.

## Security Notes

No service-role key or AI key was used in Playwright. Local environment files and Playwright storage state remain gitignored. No credentials or tokens are included in this report.

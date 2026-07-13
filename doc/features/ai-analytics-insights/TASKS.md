# Feature: AI-Powered Analytics Insights

## Summary

Add a "Launch AI Analysis" button to the analytics view that, when clicked, sends the current filtered dataset to an Ollama model and returns a natural-language recommendation answering: *"Which profitable Android app should I recreate or improve?"*

Unlike the existing per-app AI analysis (which examines one app's reviews/pain points), this analyzes the **entire filtered dataset** — categories, MRR distributions, opportunity scores, monetization models — to give a strategic recommendation.

## User Story

**As a** user exploring the analytics dashboard  
**I want** to click a button to get an AI-generated opportunity recommendation based on my current filters  
**So that** I can get a data-backed answer to "which app should I build next?" without manually cross-referencing charts.

### Tasks

- [x] Create TASKS.md
- [x] Create `src/lib/ai-analytics.ts` — new module with:
  - `buildOpportunityPrompt(apps: AppSummary[]): string` — builds a prompt that includes top-N apps by opportunity score, category breakdown, monetization patterns, MRR ranges
  - `parseOpportunityAnalysis(raw: string): OpportunityRecommendation` — extracts structured fields from the LLM response
  - `analyzeOpportunity(apps: AppSummary[], model?: string): Promise<OpportunityRecommendation>` — orchestrates prompt → Ollama call → parse
- [x] Create `POST /api/analytics/ai-analyze` route that:
  - Accepts same filter params as `GET /api/analytics` (minMrr, maxMrr, minScore, maxScore, etc.) in the request body
  - Fetches matching apps from DB (with the same filters)
  - Feeds them into `analyzeOpportunity()`
  - Returns `{ recommendation: OpportunityRecommendation, analyzedCount: number }`
- [x] Add "Launch AI Analysis" button to `src/app/analytics/page.tsx`:
  - Positioned in the header area, next to the "Back" button
  - Disabled while analysis is running (show spinner)
  - Disabled if no data matches current filters
- [x] Add AI insights panel below the charts:
  - Shows recommended category, top app to study, key insights, and improvement themes
  - Handles loading state (spinner)
  - Handles error state (retry button)
  - Handles empty state (no data to analyze)
- [x] Add `AIAnalyticsReport` model to Prisma schema for persistence
- [x] Modify POST route to persist results in `AIAnalyticsReport` table
- [x] `GET /api/analytics/ai-analyze/history` — list all past reports (summary)
- [x] `GET /api/analytics/ai-analyze/[id]` — full detail of a historical report
- [x] `POST /api/analytics/ai-analyze/[id]/rerun` — re-run with same filters, fresh data
- [x] History accordion on analytics page: expand to view content, "Rerun" button
- [x] Validation: lint, typecheck, build

### Validation

- [ ] `curl -X POST /api/analytics/ai-analyze -H 'Content-Type: application/json' -d '{}'` returns valid JSON with `id`, `recommendation`, `analyzedCount`
- [ ] `GET /api/analytics/ai-analyze/history` returns the new report in the list
- [ ] `GET /api/analytics/ai-analyze/[id]` returns full detail
- [ ] `POST /api/analytics/ai-analyze/[id]/rerun` creates a new report with updated `analyzedCount`
- [ ] History accordion expands/collapses correctly
- [ ] Rerun button triggers new analysis and refreshes the list
- [x] No TypeScript / lint errors (only pre-existing errors in `crawl.ts`)
- [x] `npm run build` succeeds

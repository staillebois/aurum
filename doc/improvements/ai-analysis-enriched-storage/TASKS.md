# Improvement: AI Analysis — Enriched Storage Schema

## Summary

Extend the `AIAnalyticsReport` Prisma model with new fields to store all sections from the extended output (Pistes B/C), enabling history browsing, comparison, and re-analysis.

## Motivation

The current model stores only 5 data fields (recommendedCategory, topAppName, topAppReason, keyInsights, improvementThemes). The new sections from Pistes B/C have nowhere to go — they would be lost after display. Persistent storage enables comparison across time and filter configurations.

## User Story

**As a** user who runs multiple AI analyses
**I want** all analysis sections to be stored in the database so I can review, compare, and re-run past analyses
**So that** I can track how market opportunities evolve over time.

### Tasks

- [ ] Update `prisma/schema.prisma` — model `AIAnalyticsReport`:

```prisma
model AIAnalyticsReport {
  id                       String   @id @default(cuid())
  // existing filter fields unchanged
  filterMinMrr             Float?
  filterMaxMrr             Float?
  filterMinScore           Float?
  filterMaxScore           Float?
  filterMinDownloads       Int?
  filterMaxDownloads       Int?
  filterMaxApps            Int?
  analyzedCount            Int
  // existing fields
  recommendedCategory      String
  topAppName               String
  topAppReason             String
  keyInsights              String
  improvementThemes        String
  modelName                String
  // NEW fields (all optional, backward-compatible)
  marketOverview           String?
  categoryReason           String?
  topApps                  String?     // JSON array
  monetizationAdvice       String?
  differentiationOpps      String?     // JSON array
  riskFactors              String?     // JSON array
  featurePriorities        String?     // JSON array
  targetAudience           String?
  // metadata
  analysisDurationMs       Int?        // NEW: how long the analysis took
  analysisVersion          Int?        @default(1)  // NEW: schema version for migration
  createdAt                DateTime    @default(now())
}
```

- [ ] Run `npx prisma db push` to migrate SQLite
- [ ] Update `POST /api/analytics/ai-analyze` — write all new fields
- [ ] Update `GET /api/analytics/ai-analyze/[id]` — read and return all new fields
- [ ] Update `POST /api/analytics/ai-analyze/[id]` (rerun) — write all new fields
- [ ] Update `GET /api/analytics/ai-analyze/history` — optionally include new fields in summary
- [ ] Update `src/app/analytics/page.tsx` frontend interfaces to receive/display new fields
- [ ] Add data migration note for existing reports (fill null for new fields)

### Validation

- [ ] New analysis creates a report with all new fields populated
- [ ] Old reports (without new fields) display correctly with graceful fallback
- [ ] Re-running a report saves new fields correctly
- [ ] History API returns new fields when requested
- [ ] `npx prisma db push` succeeds without data loss
- [ ] `npm run build` succeeds

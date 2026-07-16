# Improvement: AI Analysis — Enriched Prompt Data

## Summary

Add 7 new data blocks to the LLM prompt sent to Ollama for analytics AI analysis, providing richer market context for better recommendations.

## Motivation

The current prompt sends only 4 summary blocks (dataset summary, top 20 apps, top 10 categories, monetization model). The LLM lacks critical signals like competitor density, price distribution, and review sentiment — leading to generic recommendations.

## User Story

**As a** user running AI analysis on the analytics page
**I want** the AI to have per-category rating, competitor, price, download, and publisher data
**So that** recommendations are more specific and data-driven.

### Tasks

- [ ] Create `buildCompetitorDensityBlock(apps, allCompetitors)` — avg competitors per category
- [ ] Create `buildPriceDistributionBlock(apps)` — % apps free, <$5, $5-20, $20+
- [ ] Create `buildDownloadDistributionBlock(apps)` — % apps per download tier (10K, 100K, 1M, 10M+)
- [ ] Create `buildRatingByCategoryBlock(apps)` — avg rating + negative ratio per category
- [ ] Create `buildPublisherConcentrationBlock(apps)` — top 10 publishers by total MRR
- [ ] Create `buildMrrPercentileBlock(apps)` — P25, P50, P75, P95 of MRR
- [ ] Create `buildReviewSentimentBlock(apps)` — per-category negative review ratio
- [ ] Integrate all new blocks into `buildOpportunityPrompt()` in `src/lib/ai-analytics.ts`
- [ ] Increase `num_predict` from 4096 to 8192 to accommodate longer output
- [ ] Update `OpportunityRecommendation` interface if any new output sections are added

### Validation

- [ ] Prompt visibly contains the 7 new blocks in the raw request
- [ ] Each block uses real data (verify a few values in logs)
- [ ] Model output quality improves (subjective — compare 3 runs before/after)
- [ ] No timeout errors despite larger prompt
- [ ] `npm run build` succeeds

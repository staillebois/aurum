# Improvement: AI Analysis — Multi-Step Pipeline

## Summary

Replace the single LLM call with a 3-step pipeline: market analyst → opportunity analyst → risk assessor. Each step gets focused context and produces deeper, more specialized output.

## Motivation

A single LLM call must split attention across market-level and app-level analysis, producing shallower results. Three focused calls, each with a specialized prompt and a smaller context window, yield better quality per section.

## User Story

**As a** user running AI analysis
**I want** the AI to produce deep, specialized analysis across market trends, app opportunities, and risks
**So that** I get insights comparable to a human analyst's multi-step methodology.

### Tasks

- [ ] Step 1 — Market Analyst (`analyzeMarket`):
      Prompt focuses on: category trends, MRR distribution, competitor density, monetization patterns
      Output: `{ recommendedCategory, categoryReason, marketOverview }`
- [ ] Step 2 — Opportunity Analyst (`analyzeOpportunities`, depends on step 1 output):
      Prompt focuses on: top apps in the recommended category, user pain points, differentiation
      Output: `{ topApps, differentiationOpportunities, featurePriorities, keyInsights }`
- [ ] Step 3 — Risk Assessor (`assessRisks`, depends on step 2 output):
      Prompt focuses on: market saturation, entry barriers, monetization risks, feasibility
      Output: `{ riskFactors, monetizationAdvice, targetAudience }`

- [ ] Create orchestrator function `runFullAnalysis(apps, filterDesc?, model?)`:
      Runs steps sequentially, passes context between calls, merges results
- [ ] Each step gets `num_predict: 2048` (focused, cheaper)
- [ ] Update `AIAnalyticsReport` model with step-specific fields
- [ ] Update `analyzeOpportunity()` to call orchestrator instead of single LLM
- [ ] Add step timing/metrics for performance monitoring

### Validation

- [ ] Pipeline runs 3 sequential LLM calls and merges results correctly
- [ ] Each step produces coherent, relevant output for its focus area
- [ ] Total analysis time is acceptable (< 60s for all 3 steps)
- [ ] Output quality is noticeably better than single-call approach
- [ ] Fallback: if a step fails, the pipeline continues with partial results
- [ ] `npm run build` succeeds

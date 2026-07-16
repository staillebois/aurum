# Improvement: AI Analysis — Extended Output Format

## Summary

Extend the parsed AI output from 4 sections to 10+ sections, giving much richer structured data displayed on the analytics page.

## Motivation

The current output has only 4 sections (category, top app, 3 insights, 3 themes). The LLM is capable of much more — market overview, risk analysis, differentiation opportunities, feature priorities, target audience. Parsing these unlocks far more value.

## User Story

**As a** user reviewing AI analysis results
**I want** to see market overview, risk factors, differentiation opportunities, feature priorities, and target audience
**So that** I can make a fully informed decision about which app to build.

### Tasks

- [ ] Extend `OpportunityRecommendation` interface in `src/lib/ai-analytics.ts`:

```typescript
export interface OpportunityRecommendation {
  marketOverview: string;
  recommendedCategory: string;
  categoryReason: string;
  topApps: Array<{ name: string; mrr: number; score: number; reason: string }>;
  monetizationAdvice: string;
  keyInsights: string[];
  differentiationOpportunities: string[];
  riskFactors: string[];
  featurePriorities: string[];
  targetAudience: string;
  improvementThemes: string[];
}
```

- [ ] Update the prompt format in `buildOpportunityPrompt()` to request the new sections
- [ ] Extend `parseOpportunityAnalysis()` to parse all new sections:

```
MARKET_OVERVIEW: <text>
RECOMMENDED_CATEGORY: <cat>
CATEGORY_REASON: <text>
TOP_APPS:
1. <name> | <mrr> | <score> | <reason>
MONETIZATION_ADVICE: <text>
KEY_INSIGHTS: ...
DIFFERENTIATION_OPPORTUNITIES: ...
RISK_FACTORS: ...
FEATURE_PRIORITIES: ...
TARGET_AUDIENCE: <text>
IMPROVEMENT_THEMES: ...
```

- [ ] Update `AIAnalyticsReport` Prisma model with new fields (see Piste E)
- [ ] Update all 3 API routes (POST, GET report, re-run) to serialize/deserialize new fields
- [ ] Increase `num_predict` to 8192

### Validation

- [ ] Running AI analysis returns all new sections with real content
- [ ] Parsing handles missing sections gracefully (fallback text)
- [ ] Re-running a report preserves the new structure
- [ ] History reports display all new sections when expanded
- [ ] `npm run build` succeeds

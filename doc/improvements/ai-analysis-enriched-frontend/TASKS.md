# Improvement: AI Analysis — Enriched Frontend

## Summary

Redesign the AI analysis result display on the analytics page with tabbed sections, better formatting, confidence indicators, and report comparison.

## Motivation

The current display is a flat list of 4 sections with minimal formatting. With 10+ new output sections from Pistes B/C, a tabbed, structured layout is required for readability.

## User Story

**As a** user viewing AI analysis results
**I want** a clean tabbed interface with sections like Overview, Top Apps, Strategy, and Risks
**So that** I can quickly find the information I need without scrolling through a wall of text.

### Tasks

- [ ] Create `src/components/ai-analysis/AIAnalysisResult.tsx` — main result display component:

```
Tabs:
├── Overview        — marketOverview, recommendedCategory, categoryReason
├── Top Apps        — topApps list with MRR/score badges, reason per app
├── Strategy        — monetizationAdvice, featurePriorities, targetAudience
└── Risks & Insights — riskFactors, differentiationOpportunities, keyInsights, improvementThemes
```

- [ ] Create `src/components/ai-analysis/TopAppsList.tsx` — ranked app list with badges
- [ ] Create `src/components/ai-analysis/SectionCard.tsx` — reusable card for each section
- [ ] Create `src/components/ai-analysis/ConfidenceBadge.tsx` — indicator based on analyzedCount:
      - < 50 apps → "Low confidence"
      - 50-200 → "Medium confidence"
      - > 200 → "High confidence"
- [ ] Integrate into `src/app/analytics/page.tsx` — replace flat display with `<AIAnalysisResult />`
- [ ] Add "Compare with previous" button: load two reports side-by-side in a split view
- [ ] Add copy-to-clipboard button for each section
- [ ] Add download report as JSON button

### Validation

- [ ] All tab sections render with correct data
- [ ] Tab switching is smooth (no loading)
- [ ] Confidence badge shows correct level based on app count
- [ ] Report comparison shows 2 reports side-by-side
- [ ] Copy/download buttons work correctly
- [ ] Responsive on mobile
- [ ] `npm run build` succeeds

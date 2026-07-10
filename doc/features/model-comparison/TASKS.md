# Feature: Model comparison UI

## Summary

Add a "Compare models" tab on the app detail page that shows analysis results from multiple models side-by-side. Users can see which model gives better insights (summary, pain points, improvements) and decide which to use.

## User Story — Side-by-side comparison

**As a** user viewing an app detail
**I want** to see AI analysis results from multiple models compared side-by-side
**So that** I can assess which model provides the most useful insights.

### Tasks

- [ ] Add `GET /api/apps/[id]/compare?models=model1,model2` endpoint that runs analysis with specified models (non-blocking with timeout)
- [ ] Create `src/components/ModelComparison.tsx` client component
- [ ] Design comparison layout: 2-3 columns per model, same sections (Summary / Pain Points / Improvements)
- [ ] Add "Compare Models" button/section on detail page (`src/app/apps/[id]/page.tsx`)
- [ ] Show a spinner while analysis is running (each model call takes ~30-60s)
- [ ] Handle partial results (some models fail, some succeed)
- [ ] Highlight differences: pain points unique to each model, shared items
- [ ] Add tooltip explaining what each model is good for (e.g. "qwen3:8b — general text analysis", "mistral:7b — lightweight")
- [ ] Store comparison results locally in DB so re-visiting is instant

### Validation

- [ ] "Compare Models" section visible on detail page
- [ ] Clicking triggers analysis with selected models
- [ ] Results displayed in side-by-side columns
- [ ] Differences highlighted between models
- [ ] Hard-refresh still shows cached comparison results
- [ ] No TypeScript / build errors

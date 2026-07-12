# Feature: Analytics Dashboard

## Summary

Add a new `/analytics` page with 6 charts to help the user visually explore app data and uncover opportunities at a glance.

## User Story

**As a** user browsing the platform
**I want** an analytics dashboard with interactive charts
**So that** I can quickly identify the most profitable categories, spot high-opportunity apps, and understand market trends.

### Tasks

- [x] Create TASKS.md
- [x] Install Recharts
- [ ] Create `GET /api/analytics` endpoint that returns aggregated data
- [ ] Create 6 chart components in `src/components/charts/`
- [ ] Create `src/app/analytics/page.tsx`
- [ ] Add navigation link to `/analytics` in the home page header

### Validation

- [ ] `curl /api/analytics` returns valid JSON with all sections
- [ ] `/analytics` page renders all 6 charts without error
- [ ] Each chart is interactive (tooltip on hover)
- [ ] Charts are responsive (2 cols desktop, 1 col mobile)
- [ ] Loading state shows a spinner
- [ ] Error state shows a user-friendly message
- [ ] Navigation link is visible on the home page
- [ ] No TypeScript / lint errors
- [ ] `npm run build` succeeds

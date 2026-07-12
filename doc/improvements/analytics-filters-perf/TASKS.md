# Improvement: Analytics filters and performance

## Summary

Add filter controls (MRR, Score, Downloads, max scatter points) to the Analytics dashboard to reduce data volume and improve page load time.

## Motivation

The `/analytics` page loads all ~3200+ apps from the database and renders every one as a scatter point, causing slow initial load. By adding filters and limiting scatter points to a configurable maximum, the page becomes usable immediately.

## User Story

**As a** user
**I want** to filter analytics data by MRR/Score/Downloads range and control the max number of scatter points
**So that** the page loads quickly by default and I can narrow down to relevant apps.

### Tasks

- [x] Create TASKS.md
- [x] Add filter params to `/api/analytics` (`minMrr`, `maxMrr`, `minScore`, `maxScore`, `minDownloads`, `maxDownloads`, `maxApps`)
- [x] Add filter inputs to the analytics page
- [x] Limit scatter apps to `maxApps` (default: 500)

### Validation

- [ ] Page loads faster with default 500-point limit
- [ ] Filters correctly reduce data (MRR, Score, Downloads ranges)
- [ ] `maxApps` input controls scatter point count
- [ ] Increasing `maxApps` shows more points (slower)
- [ ] Stat cards reflect filtered data counts
- [ ] No TypeScript / lint errors
- [ ] `npm run build` succeeds

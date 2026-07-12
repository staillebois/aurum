# AI Analysis Column on Main Page

## Summary

Add a column to the main page table indicating whether each app has been analyzed by AI.

## Motivation

Users currently have to click into each app's detail page to see if an AI analysis exists. Having this information directly in the table enables quicker scanning and prioritization of apps that have been analyzed.

## User Story

### As a user, I want to see at a glance which apps have AI analysis

**Tasks:**
- [x] Add `aiAnalyzedAt` field to the frontend `App` interface in `page.tsx`
- [x] Include `aiAnalyzedAt` in the API `/api/apps` Prisma select
- [x] Add "AI Analysis" column header to the table
- [x] Render a green "Yes" badge when `aiAnalyzedAt` is non-null, grey "No" otherwise
- [x] Update `colSpan` on the empty-state row

**Validation steps:**
- [ ] The main page table shows an "AI Analysis" column
- [ ] Apps with `aiAnalyzedAt` set display a green "Yes" badge
- [ ] Apps without AI analysis display a grey "No" badge
- [ ] The empty state row spans all columns correctly
- [ ] No regressions in table sorting, filtering, or pagination

### As a user, I want to filter the table to show only analyzed apps

**Tasks:**
- [x] Add `analyzed` query param support to `/api/apps` route
- [x] Add "AI Analysis" filter dropdown to the filter bar
- [x] Wire the filter into the URL query string and `useEffect` dependencies

**Validation steps:**
- [ ] Selecting "With Analysis Only" shows only apps that have `aiAnalyzedAt` set
- [ ] Selecting "All Apps" shows all apps (default)
- [ ] The filter is reflected in the URL and survives page refresh
- [ ] Pagination works correctly with the filter active

# Improvement: Filter apps by name in the main dashboard

## Summary

Add a text search input to the main dashboard filter bar that allows the user to filter the app list by name using case-insensitive substring matching. The search triggers after 1 second of inactivity (debounce) to avoid excessive API calls.

## Motivation

The dashboard already supports filtering by category, price, downloads, MRR, and analysis status, but there is no way to search for a specific app by name. When the user knows the name of an app (e.g., "Calm", "WhatsApp"), they have to scroll through potentially hundreds of rows to find it. This change makes the tool significantly more usable by enabling quick lookup.

## User Story — Search apps by name

**As a** user browsing the dashboard
**I want** to type part of an app name and see matching results after a short pause
**So that** I can quickly find a specific app without manually scanning the entire list.

### Tasks

- [ ] Create `doc/improvements/app-name-search/TASKS.md` (this file)
- [ ] In `src/app/api/apps/route.ts`:
  - Read the `search` query parameter
  - If non-empty, add `where.name = { contains: search }` to the Prisma filter
- [ ] In `src/app/page.tsx`:
  - Add a local state `searchInput` for the controlled input value
  - Add a `useEffect` with a 1000ms `setTimeout` that pushes `searchInput` to the URL param `search` (debounced)
  - Add an `<input type="text">` in the filter bar with placeholder "Search by name…"
  - Show a "Searching…" indicator while debouncing
  - Include the `search` param in the existing `useEffect` fetch dependencies
  - Clean up the timeout on unmount / new keystroke

### Validation

- [ ] Typing "calm" → after 1s, the table filters to apps containing "calm" in the name
- [ ] Case-insensitive: "CALM", "Calm", "calm" return the same results
- [ ] Substring: "mana" finds "Manager" or "Mana"
- [ ] Debounce: typing 5 letters rapidly → only one fetch is emitted (not 5)
- [ ] Visual indicator: a "Searching…" text appears during the debounce window
- [ ] Combined filters: search + category + min MRR return the correct intersection
- [ ] Pagination: with a restrictive search, total count and page numbers are correct
- [ ] Clearing the field → after 1s, all results reappear
- [ ] URL persistence: refresh with `?search=calm` → input is pre-filled and results are filtered
- [ ] No TypeScript errors: `npx tsc --noEmit` passes
- [ ] No search param → behavior identical to before

# Improvement: Preserve filter state when navigating back from App Detail

## Summary

When the user applies filters on the Dashboard (category, price, min downloads, min MRR, sort order), clicks an app to view its detail page, and then clicks "Back to Dashboard", the filter state is lost and the Dashboard resets to defaults. This change preserves the filter state across this navigation.

## Motivation

Filters are the primary way to narrow down the app list. Losing them on every detail page visit makes the tool significantly less usable — the user has to reapply the same filters every time they go back, which breaks the exploration flow.

The Dashboard already uses URL search params as the single source of truth for filter state. We extend this approach by passing the current search params as a `from` query parameter when navigating to the app detail page, and using that parameter in the "Back to Dashboard" link. This is stateless, works with browser history, and gracefully degrades when no `from` param is present (e.g., direct URL access).

---

## User Story — Filter state preserved across navigation

**As a** user browsing filtered apps
**I want** the filter state to persist when I go to an app detail and back
**So that** I can explore multiple apps without reapplying filters each time.

### Tasks

- [ ] In `src/app/page.tsx`, modify the row click handler to append the current search params as a `from` query param on the app detail URL
- [ ] In `src/app/apps/[id]/page.tsx`, import `useSearchParams` from `next/navigation`
- [ ] In `src/app/apps/[id]/page.tsx`, read the `from` search param and use it as the href for the "Back to Dashboard" link (both error state and normal state), falling back to `/` when absent

### Validation

- [ ] Apply filters on Dashboard → click an app → "Back to Dashboard" restores exact same filter state (URL params unchanged)
- [ ] Access an app detail page directly (e.g., `/apps/1`) → "Back to Dashboard" goes to plain `/`
- [ ] No TypeScript / build errors

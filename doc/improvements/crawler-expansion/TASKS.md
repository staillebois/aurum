# Improvement: Crawler expansion

## Summary

Expand the Google Play crawler to cover all non-game categories instead of just 7, increase the number of apps fetched per category, and remove the outdated AI search phase.

## Motivation

The dashboard now supports all 34 non-game Google Play categories in its filter, but the crawler only fetches apps from 7 of them. This mismatch means most categories have no data. Additionally, the AI search phase was a one-off experiment that is no longer relevant.

## User Story — Full category coverage

**As a** user browsing the dashboard
**I want** the crawler to fetch profitable apps from all non-game Google Play categories
**So that** every category in the filter has actual data to explore.

### Tasks

- [x] Remove `AI_SEARCH_TERMS` array and the AI search loop (lines 17–24 and 211–240)
- [x] Change `num: 60` → `num: 100` for top-grossing requests
- [x] Replace the 7-entry `TARGET_CATEGORIES` with all 34 non-game categories (excluding APPLICATION, ANDROID_WEAR, and all GAME_*)

### Validation

- [ ] `npm run crawl` runs without error and fetches apps from all 34 categories
- [ ] No references to `AI_SEARCH_TERMS` remain in the codebase
- [ ] `num: 100` is used in the `gplay.list()` call
- [ ] The category filter dropdown is now fully populated with data
- [ ] Lint passes (no new errors)

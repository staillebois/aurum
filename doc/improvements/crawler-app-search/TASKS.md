# Improvement: Crawler — Retrieve a specific app by name or ID

## Summary

Add two CLI flags to the crawler script (`--search <name>` and `--app-id <id>`) that allow fetching a single known app from the Google Play Store and importing it through the existing pipeline (save → reviews → competitors → scoring). This bypasses the full category crawl when the user already knows which app they want.

## Motivation

The current crawler only discovers apps via the top-grossing category lists (`gplay.list()`). If a user wants data on a specific app (e.g. "Calm" or "com.calm.android"), they must either wait for a full crawl across all 34 categories, or manually insert the app into the database. Adding `--search` and `--app-id` flags makes ad-hoc app retrieval a one-command operation, dramatically improving day-to-day usability.

## User Story — Search for an app by name

**As a** user of Aurum
**I want** to run `npm run crawl -- --search "Calm"` and have that single app fetched, saved, scored, and enriched with reviews and competitors
**So that** I can quickly analyze any app without crawling all categories.

## User Story — Fetch an app by exact ID

**As a** user of Aurum who knows the Google Play package name
**I want** to run `npm run crawl -- --app-id "com.calm.android"` to fetch that app directly by its appId
**So that** I can avoid ambiguity from name-based search when I already know the exact identifier.

### Tasks

- [ ] Create `doc/improvements/crawler-app-search/TASKS.md` (this file)
- [ ] In `scripts/crawl.ts`:
  - Parse `--search <term>` and `--app-id <appId>` from CLI args
  - Validate that they are not used together (mutually exclusive)
  - Validate that the argument is non-empty
  - When either flag is present, **skip** the category loop entirely
  - `--search` → call `gplay.search({ term, num: 1, fullDetail: true })` and take the first result
  - `--app-id` → call `gplay.app({ appId, lang: "en", country: "us" })`
  - If no app is found → print a clear error message and exit
  - Pass the result through `saveApp()` (without filtering by paid/IAP — import everything)
  - Then call `saveReviews()`, `saveCompetitors()`, `scoreApp()`
  - Always re-crawl even if the app already exists (upsert behaviour)
  - Support `--refresh` alongside `--search` / `--app-id`
  - Print a summary: app name, MRR, score, review count

### Validation

- [ ] `npm run crawl -- --search "Calm"` saves Calm with reviews, competitors, and a score
- [ ] `npm run crawl -- --app-id "com.calm.android"` saves the same app via direct ID
- [ ] `npm run crawl -- --search ""` prints an error about empty search term
- [ ] `npm run crawl -- --search "zkzkskdnfzzd"` prints "No app found"
- [ ] `npm run crawl -- --search "Calm" --app-id "x"` prints an error about conflicting flags
- [ ] Running `--search` on an already-imported app updates it (replaces reviews, re-scores)
- [ ] Running `--search` on a free app without IAP still imports it (no monetization filter)
- [ ] `--refresh` combined with `--search` or `--app-id` works correctly
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes with zero errors

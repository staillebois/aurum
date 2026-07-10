# Bug: All reviews have the same date

## Summary

When the crawler saves reviews via `createMany`, it never passes the actual review date from Google Play. Prisma's `@default(now())` kicks in, but `createMany` evaluates it **once per batch** — so every review of a given app gets the exact same timestamp.

**Root cause**: `scripts/crawl.ts:103-108` — the `map()` that builds review data omits the `date` field available from `google-play-scraper` (`r.date`).

---

## User Story — Fix review dates

**As a** user  
**I want** each review to display its actual posting date  
**So that** I can assess how recent the feedback is.

### Tasks

- [ ] In `scripts/crawl.ts:103-108`, add `createdAt: r.date ?? new Date()` to the review data mapped object
- [ ] Delete all existing reviews from the database so they get re-created with correct dates (via `await prisma.review.deleteMany()`)
- [ ] Re-run the crawler to re-fetch all reviews (`npm run crawl`)

### Validation

- [ ] Reviews within the same app have **different** `createdAt` values
- [ ] The dates look realistic (e.g. a review mentioning an old version has an old date)
- [ ] `GET /api/apps/<id>` returns reviews ordered by date (newest first)
- [ ] The app detail page shows distinct dates per review
- [ ] No TypeScript compilation errors

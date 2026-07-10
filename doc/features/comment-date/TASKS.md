# Comment Date Feature

> Expose review `createdAt` from the database through the API and display it in the app detail page.

---

## User Story 1 — API: Expose review dates

**As a** frontend developer  
**I want** the API to return the `createdAt` field for each review  
**So that** the UI can display when a review was posted.

### Tasks

- [ ] Add `createdAt` to the Prisma `select` in `GET /api/apps/[id]` (`src/app/api/apps/[id]/route.ts:14`)

### Validation

- [ ] `curl /api/apps/<id>` returns reviews with a `createdAt` field (ISO 8601 string)
- [ ] Existing fields (`id`, `text`, `rating`, `userName`) are still present
- [ ] TypeScript compilation passes with no errors

---

## User Story 2 — UI: Display review dates

**As a** user  
**I want** to see the date of each review on the app detail page  
**So that** I can assess how recent the feedback is.

### Tasks

- [ ] Add `createdAt: string` to the `Review` interface in `src/app/apps/[id]/page.tsx:7`
- [ ] Display the formatted date in the review card (e.g. "Jul 9, 2026" or relative "2 days ago")
- [ ] Style the date to be subtle but readable (e.g. `text-xs text-zinc-400`)

### Validation

- [ ] Each review card shows a date below the user name / rating line
- [ ] The date format is human-readable (not raw ISO)
- [ ] Reviews with no date (null `createdAt`) display "—" or nothing instead of crashing
- [ ] The page renders without errors for an app with 0 reviews
- [ ] TypeScript compilation passes with no errors

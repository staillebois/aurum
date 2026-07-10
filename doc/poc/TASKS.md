# POC Implementation Plan

## Target Stack

| Layer | Technology |
|--------|-------------|
| Full-stack | TypeScript, Next.js (App Router), TailwindCSS |
| Database | SQLite + Prisma ORM |
| Crawler | TypeScript (google-play-scraper) |
| AI | Ollama (local) / Programmatic analysis |

## Architecture

```
Google Play
    │
    ▼
Crawler (TypeScript / Next.js script)
    │
    ▼
SQLite (Prisma ORM)
    │
    ▼
AI Analysis (Ollama / Programmatic)
    │
    ▼
Next.js App Router
 ├── API Routes (REST)
 └── Server Components (UI)
    │
    ▼
Dashboard (TailwindCSS)
```

---

## Phases

### Phase 1 — Project Setup

**Tasks:**
- [x] Create Next.js project (TypeScript, App Router)
- [x] Configure TailwindCSS
- [x] Configure Prisma + SQLite
- [x] Define Prisma schema: `App`, `Review`, `Competitor`

**Validation:**
- [x] `npm run dev` starts without error
- [x] `npx prisma db push` creates the SQLite database
- [x] `npx prisma studio` shows empty tables
- [x] Next.js compiles without TypeScript errors

---

### Phase 2 — Crawler

**Tasks:**
- [x] Implement Google Play crawler (TypeScript script)
- [x] Fetch ~500 apps (7 categories + AI search terms)
- [x] Extract: name, icon, description, category, publisher, downloads, price, IAP, subscriptions, rating, reviews
- [x] Save to database via Prisma

**Validation:**
- [x] Crawler runs without error (`npm run crawl`)
- [x] Database contains 488 apps with all columns populated
- [x] Icons are valid URLs
- [x] Prices and downloads are coherent numbers

---

### Phase 3 — MRR & Opportunity Score

**Tasks:**
- [x] Implement MRR estimation algorithm
- [x] Formula: MAU × price × subscriptions × popularity
- [x] Implement Opportunity Score (0-100)
- [x] Weights: MRR (+40), negative reviews (+20), few competitors (+20), simplicity (+10), flat bonus (+5)

**Validation:**
- [x] Every app has MRR > 0 consistent with its downloads
- [x] Paid apps have higher MRR than free ones
- [x] Score is between 0 and 100
- [x] Sorting by MRR descending gives a plausible ranking

---

### Phase 4 — AI Analysis (via Ollama)

**Tasks:**
- [x] Integrate Ollama API (local, no API key required)
- [x] Analyze reviews → summary, pain points, improvements
- [x] Competitor detection (via `gplay.similar()`)
- [x] Save results to database

**Validation:**
- [x] Ollama call succeeds (tested with `qwen2.5-coder:7b`)
- [x] Every app has a summary, pain points, and improvements
- [x] Competitors are real apps from the dataset
- [x] Results are stored and retrievable from the database

---

### Phase 5 — API Routes

**Tasks:**
- [x] `GET /api/apps` — list with filters + sorting (MRR descending by default)
- [x] `GET /api/apps/[id]` — full detail with AI analysis + competitors

**Validation:**
- [x] `curl /api/apps` returns valid JSON with all apps
- [x] `curl /api/apps?category=Finance` filters correctly
- [x] `curl /api/apps?sortBy=estimatedMrr&order=desc` sorts correctly
- [x] `curl /api/apps/[id]` returns detail with AI analysis and competitors
- [x] Combined filters work (e.g. `category=Finance&minMrr=10000`)

---

### Phase 6 — Dashboard (UI)

**Tasks:**
- [x] Main page: sortable table (Icon, Name, Category, Downloads, Price, MRR, Score)
- [x] Filters: category (dropdown), price (free/paid/all), min downloads, min MRR
- [x] App detail page: info, monetization, stats, AI analysis, competitors, reviews

**Validation:**
- [x] Table renders with data from the API
- [x] MRR descending sort is active by default
- [x] Filters update the list without errors
- [x] Clicking a row opens the detail page
- [x] Detail page displays all sections: info, monetization, stats, AI analysis, competitors
- [x] Dashboard ↔ detail navigation works (no 404s)

---

### Phase 7 — Pagination, Analysis & UI Refinements

**Tasks:**
- [x] Paginate `GET /api/apps` with `page` and `perPage` params (default: 50)
- [x] Add pagination controls to dashboard (Prev / page numbers / Next)
- [x] Reset to page 1 when filters or sort change
- [x] Generate analysis programmatically (no Ollama) for all 488 apps
- [x] Add "Description" label on detail page for clarity

**Validation:**
- [x] `GET /api/apps?page=2&perPage=20` returns 20 apps on page 2
- [x] Response includes `{ data, total, page, perPage, totalPages }`
- [x] Pagination controls navigate correctly
- [x] All 488 apps have `aiSummary`, `painPoints`, `improvements` populated
- [x] Detail page shows "Description" label above description text

---

## POC Success Criteria

- [x] Google Play data retrieval (488 apps crawled)
- [x] MRR estimation (each app scored)
- [x] Automatic review analysis (Ollama + programmatic fallback)
- [x] Competitor display (shown on detail page)
- [x] Dashboard usable in < 10 min to find an app idea

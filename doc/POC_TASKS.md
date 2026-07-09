# POC Implementation Plan

## Target Stack

| Layer | Technology |
|--------|-------------|
| Full-stack | TypeScript, Next.js (App Router), TailwindCSS |
| Database | SQLite + Prisma ORM |
| Crawler | TypeScript (google-play-scraper) |
| AI | OpenAI API |

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
AI Analysis (OpenAI)
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
- [ ] Create Next.js project (TypeScript, App Router)
- [ ] Configure TailwindCSS
- [ ] Configure Prisma + SQLite
- [ ] Define Prisma schema: `App`, `Review`, `Competitor`

**Validation:**
- [ ] `npm run dev` starts without error
- [ ] `npx prisma db push` creates the SQLite database
- [ ] `npx prisma studio` shows empty tables
- [ ] Next.js compiles without TypeScript errors

---

### Phase 2 — Crawler

**Tasks:**
- [ ] Implement Google Play crawler (TypeScript script or dedicated lib)
- [ ] Fetch ~100 apps (categories: Productivity, Finance, Health, AI, Photo)
- [ ] Extract: name, icon, description, category, publisher, downloads, price, IAP, subscriptions, rating, reviews
- [ ] Save to database via Prisma

**Validation:**
- [ ] Crawler runs without error (script or endpoint)
- [ ] Database contains ~100 apps with all columns populated
- [ ] Icons are valid URLs
- [ ] Prices and downloads are coherent numbers

---

### Phase 3 — MRR & Opportunity Score

**Tasks:**
- [ ] Implement MRR estimation algorithm
- [ ] Formula: downloads × price × subscriptions × popularity
- [ ] Implement Opportunity Score
- [ ] Weights: MRR (+40), negative reviews (+20), few competitors (+20), simplicity (+10), few updates (+10)

**Validation:**
- [ ] Every app has MRR > 0 consistent with its downloads
- [ ] Paid apps have higher MRR than free ones
- [ ] Score is between 0 and 100
- [ ] Sorting by MRR descending gives a plausible ranking

---

### Phase 4 — AI Analysis (via Ollama)

**Tasks:**
- [x] Integrate Ollama API (local, no API key required)
- [x] Analyze reviews → summary, pain points, improvements
- [x] Competitor detection (via category similarity)
- [x] Save results to database

**Validation:**
- [x] Ollama call succeeds (tested with qwen2.5-coder:7b)
- [x] Every app has a summary, pain points, and improvements
- [x] Competitors are real apps from the dataset
- [x] Results are stored and retrievable from the database

---

### Phase 5 — API Routes

**Tasks:**
- [ ] `GET /api/apps` — list with filters (category, price, min downloads, min MRR) and sorting (MRR descending by default)
- [ ] `GET /api/apps/[id]` — full detail with AI analysis + competitors

**Validation:**
- [ ] `curl /api/apps` returns valid JSON with ~100 apps
- [ ] `curl /api/apps?category=Finance` filters correctly
- [ ] `curl /api/apps?sortBy=mrr&order=desc` sorts correctly
- [ ] `curl /api/apps/1` returns detail with AI analysis and competitors
- [ ] Combined filters work (e.g. `category=Finance&minMrr=10000`)

---

### Phase 6 — Dashboard

**Tasks:**
- [ ] Main page: sortable table with columns (Icon, Name, Category, Downloads, Price, MRR, Score)
- [ ] Filters: category, price, min downloads, min MRR
- [ ] App detail page: info, monetization, stats, AI analysis, competitors

**Validation:**
- [ ] Table renders with data from the API
- [ ] MRR descending sort is active by default
- [ ] Filters update the list without errors
- [ ] Clicking a row opens the detail page
- [ ] Detail page displays all sections: info, monetization, stats, AI analysis, competitors
- [ ] Dashboard ↔ detail navigation works (no 404s)

---

## POC Success Criteria

- [ ] Google Play data retrieval
- [ ] MRR estimation
- [ ] Automatic review analysis (OpenAI)
- [ ] Competitor display
- [ ] Dashboard usable in < 10 min to find an app idea

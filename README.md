# Aurum — App Opportunity Analyzer

Identify the most profitable Android apps on Google Play and uncover development opportunities.

> **Goal:** Answer the question *"Which profitable Android app should I recreate or improve?"*

---

## Prerequisites

- **Node.js** 20+
- **Ollama** running locally on `http://localhost:11434` (for AI analysis)
- At least one LLM model pulled in Ollama (default: `qwen3:8b`)

## Setup

```bash
npm install
cp .env .env.example  # or configure .env manually
npx prisma db push    # create SQLite database
```

### Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen3:8b` | Default LLM model for analysis |

---

## Available Actions

### Server

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server on `http://localhost:3000` |
| `npm run build` | Build the project for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the codebase |

### Data Pipeline

#### `npm run crawl`
Crawl Google Play for profitable apps. Fetches top-grossing apps from 7 categories (Productivity, Finance, Health & Fitness, Photography, Business, Education, Tools) plus AI-related search terms. For each app, saves metadata, up to 50 reviews, up to 5 similar competitors, and calculates MRR + Opportunity Score.

| Flag | Description |
|---|---|
| `--refresh` | Re-fetch reviews for all existing apps |

#### `npm run score`
Re-calculate MRR and Opportunity Score for all apps in the database. Useful after data changes.

#### `npm run analyze`
Run AI analysis via Ollama on unanalyzed apps. Processes apps sequentially with a progress bar.

| Flag | Description |
|---|---|
| `--limit <N>` | Process at most N apps |
| `--offset <N>` | Skip first N unanalyzed apps |
| `--clean` | Clear existing AI analysis before starting |
| `--re-analyze-fallback` | Re-analyze apps that have fallback texts ("No pain points identified.") |
| `--status` / `--stats` | Show analysis statistics (total / with analysis / by model) |
| `--model <name>` | Specify Ollama model (default: `qwen3:8b`) |

#### `npm run benchmark`
Compare multiple Ollama models side-by-side on the same apps. Prints a comparison table and recommends the best model.

| Flag | Description |
|---|---|
| `--apps <N>` | Number of apps to test (default: 10) |
| `--models <list>` | Comma-separated model names (default: `qwen2.5-coder:7b,qwen3:8b,mistral:7b`) |
| `--verbose` | Print full analysis content for every app × model |
| `--json` | Write structured JSON report to file |
| `--output <path>` | JSON output path (default: `benchmark-results.json`) |

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/apps` | Paginated list with filters (`category`, `price`, `minDownloads`, `minMrr`, `sortBy`, `order`, `page`, `perPage`) |
| `GET` | `/api/apps/[id]` | Full detail: metadata, reviews, competitors, AI analysis |

### Dashboard

Open `http://localhost:3000` in a browser. Sortable, filterable, paginated table of analyzed apps. Click any app for full detail including AI summary, pain points, improvement suggestions, reviews, and competitors.

---

## Scoring

**MRR Estimation** — estimates monthly recurring revenue:
- `MAU = downloads × 0.05`
- Subscriptions: `MAU × 0.10 × $9.99`
- IAP: `MAU × 0.05 × $4.99`
- Paid-only: `MAU × 0.05 × price`
- Adjusted by `rating / 5`

**Opportunity Score** (0–100):
- MRR score: up to 40 pts (logarithmic)
- Negative reviews: up to 20 pts
- Few competitors: up to 20 pts
- Simplicity (short description): up to 10 pts
- Base bonus: +5 pts

---

## Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM 7
- **Styling:** Tailwind CSS v4
- **Crawler:** google-play-scraper
- **AI:** Ollama (local LLM)

---

## Documentation

See [`doc/SPEC.md`](doc/SPEC.md) for the full project specification.

---

## Commit Convention

`type(scope): description` — types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`.

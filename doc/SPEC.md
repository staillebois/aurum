# SPEC.md

# App Opportunity Analyzer

> **Version:** MVP v0.1  
> **Author:** Sylvain  
> **Goal:** Build a personal tool to quickly identify the most profitable Android apps and uncover development opportunities.

---

# 1. Vision

The goal is **not** to create a SensorTower or AppMagic competitor.

The goal is to answer a single question:

> **Which profitable Android app should I recreate or improve?**

The software must be extremely simple.

The primary user is myself.

---

# 2. MVP Scope

The MVP only analyzes **Google Play** apps that meet one of the following criteria:

- Paid app
- App with In-App Purchases

Free apps without monetization are ignored.

---

# 3. Features

The MVP has only two screens.

## Dashboard

List of the most profitable apps.

### Columns

| Field | Description |
|---------|-------------|
| Icon | Play Store icon |
| Name | App name |
| Category | Google Play category |
| Downloads | Download count |
| Price | App price or main subscription |
| Estimated MRR | Estimated monthly revenue |
| Score | Internal score |

### Sorting

Default:

```
Estimated MRR descending
```

### Filters

- Category
- Country
- Price
- Minimum downloads
- Minimum MRR

---

## App Detail

A detailed view with the following information.

### General Info

- Name
- Icon
- Description
- Publisher
- Category
- Country
- Publication date
- Last update

---

### Monetization

- Paid app
- Price
- In-App Purchases
- Subscriptions
- Price range

---

### Statistics

- Downloads
- Review count
- Average rating
- Estimated MRR
- Estimated annual revenue

---

### AI Review Analysis

The system automatically analyzes user reviews.

Output:

#### What users like

- ...

#### Main pain points

- ...
- ...
- ...

#### Recurring issues

- ...
- ...

---

### Opportunities

The AI automatically answers:

> **How to create a better version of this app?**

Example:

- lower the price
- remove ads
- improve performance
- add offline mode
- simplify the UI
- speed up startup
- add widgets
- improve AI

---

### Competitors

List of similar apps.

For each competitor:

- Name
- Icon
- Downloads
- Price
- Estimated MRR

---

# 4. Data Sources

The crawler fetches:

- Name
- Icon
- Description
- Category
- Publisher
- Download count
- Price
- In-App Purchases
- Subscriptions
- Review count
- Rating
- Reviews
- Screenshots

---

# 5. MRR Calculation

MRR is not publicly available.

The system estimates a value from multiple signals.

Examples:

- downloads
- price
- subscriptions
- in-app purchases
- review count
- ranking
- age

The result is an estimate.

Example:

```
Estimated MRR

≈ €120,000/month
```

A future version may provide a confidence interval.

---

# 6. Pipeline

```
Google Play
      │
      ▼
Crawler (TypeScript)
      │
      ▼
Database (SQLite → PostgreSQL)
      │
      ▼
AI Analysis (OpenAI)
      │
      ├── Review summary
      ├── Pain points
      ├── Improvement ideas
      ├── Competitor detection
      └── MRR estimation
      │
      ▼
Dashboard (Next.js)
```

---

# 7. Technical Stack

## Full-stack

- **TypeScript** — single language (back & front)
- **Next.js** — App Router, API Routes, server components
- **TailwindCSS** — styles

## Database

- **SQLite** (POC) → **PostgreSQL** (MVP)
- **Prisma** — TypeScript ORM

## Search

- PostgreSQL Full Text Search (MVP)
- (Future possibility: OpenSearch)

## Crawler

- **TypeScript** — Next.js scripts or dedicated lib (google-play-scraper)

## AI

- OpenAI API

Used for:

- review summarization
- problem extraction
- improvement generation
- MRR estimation

---

# 8. Architecture

```
                  ┌─────────────────┐
                  │ Google Play     │
                  └────────┬────────┘
                           │
                    Crawler (TypeScript)
                           │
                  ┌────────▼────────┐
                  │ SQLite / PostgreSQL │
                  └────────┬────────┘
                           │
                   AI Analysis (OpenAI)
                           │
                  ┌────────▼────────┐
                  │ Next.js App Router │
                  │  (API Routes + │
                  │   Server Components) │
                  └────────┬────────┘
                           │
                      Web Dashboard
```

---

# 9. Success Criteria

The MVP is considered successful if I can:

- quickly find the most profitable apps
- view their estimated MRR
- understand why users are unhappy
- quickly identify improvement areas
- discover main competitors

The software should let me find a new app idea in minutes instead of hours of research.

---

# 10. Out of Scope (v1)

Do not develop:

- Authentication
- User accounts
- Sharing
- Favorites
- Alerts
- Notifications
- History
- Public API
- iOS apps
- Website analysis
- SaaS analysis
- Complex dashboard
- Conversational AI

---

# 11. Future Possibilities

Once the MVP is validated:

- USA → France comparison
- fast-growing app detection
- MRR history
- app tracking
- email alerts
- customer acquisition cost estimation
- ASO analysis
- screenshot analysis
- pricing strategy analysis
- CSV export
- REST API
- Chrome extension
- public SaaS launch

---

# Philosophy

The product does not aim to analyze **all** apps.

It only aims to quickly identify **the best development opportunities** by building on already profitable Android apps.

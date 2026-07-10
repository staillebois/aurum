# POC.md

# Proof of Concept — App Opportunity Analyzer

> **Goal:** Validate that the dashboard enables quick identification of profitable Android app development opportunities.

---

# 1. Objective

The POC is not meant to demonstrate technical feasibility.

It must answer a single question:

> **Does this tool help me find profitable app ideas to develop faster?**

The POC must be doable in a few days.

---

# 2. Scope

The POC is deliberately limited.

## Platform

- Google Play only

## Apps analyzed

Only apps that are:

- paid
- or contain In-App Purchases

## Number of apps

Limit the dataset to approximately **100 apps**.

Example categories:

- Productivity
- Finance
- Health
- AI
- Photo

---

# 3. Features

## Dashboard

A single page.

Displayed as a table.

| Name | Category | Downloads | Price | Estimated MRR | Opportunity Score |
|------|-----------|-----------------|------|------------|-------------------|

The table must be sortable.

Default sort:

```
Estimated MRR descending
```

---

## App Detail

On row click.

Display:

### Info

- Name
- Icon
- Description
- Publisher
- Category

---

### Monetization

- Price
- In-App Purchases
- Subscriptions

---

### Statistics

- Downloads
- Review count
- Rating
- Estimated MRR

---

### AI Analysis

#### Summary

A few lines summarizing the app.

#### Negative reviews

Top user complaints.

Example:

- subscription too expensive
- bugs
- slow
- intrusive ads

---

#### Proposed improvements

Automatic answer to:

> How to make a better version?

Example:

- offline mode
- lower price
- better UX
- remove ads
- better performance

---

### Competitors

Show 5 similar apps.

For each:

- Name
- Downloads
- Estimated MRR

---

# 4. Opportunity Score

The score measures the potential to recreate the app.

It does not measure its quality.

## First version

The score is calculated from multiple criteria.

| Criterion | Weight |
|----------|-------------|
| High MRR | +40 |
| Many negative reviews | +20 |
| Few competitors | +20 |
| Simple app | +10 |
| Few updates | +10 |

Maximum score:

```
100
```

The calculation may evolve later.

---

# 5. Data Collected

For each app.

- name
- icon
- description
- category
- publisher
- downloads
- price
- in-app purchases
- subscriptions
- rating
- review count
- reviews

---

# 6. AI Analysis

For each app.

The LLM produces:

- summary
- pain points
- improvements
- competitor estimation (if not determined otherwise)

---

# 7. MRR Estimation

MRR is estimated.

First approach.

Possible inputs:

- downloads
- price
- subscription presence
- review count
- popularity

Output:

```
≈ €150,000/month
```

An estimate is sufficient for the POC.

---

# 8. Architecture

```
Google Play
      │
      ▼
Crawler (TypeScript)
      │
      ▼
SQLite (Prisma)
      │
      ▼
AI Analysis (OpenAI)
      │
      ▼
Dashboard (Next.js)
```

100% TypeScript stack — one language, one project.

---

# 9. Stack

## Full-stack

- **TypeScript**
- **Next.js** (App Router, API Routes, Server Components)
- **TailwindCSS**

## Database

- **SQLite** via **Prisma ORM**

## Crawler

- **TypeScript** (google-play-scraper or Next.js script)

## AI

- **OpenAI API**

---

# 10. Success Criteria

The POC is validated if the following criteria are met.

## Functional

- Google Play data retrieval
- MRR estimation
- automatic review analysis
- competitor display

## Value

After a few days of use, the tool should quickly answer:

- What are the most profitable apps?
- Why are users dissatisfied?
- How to create a better version?
- What are the main competitors?

---

# 11. Failure Criteria

The POC is considered inconclusive if:

- MRR estimates are unusable
- AI analysis provides no value
- suggested competitors are not relevant
- I still do my research manually despite the tool

---

# 12. Expected Deliverable

At the end of the POC, I must have a dashboard I actually use to explore app ideas.

Success will not be measured by the number of features built, but by a simple question:

> **In under 10 minutes, can I identify a profitable app I want to recreate or improve?**

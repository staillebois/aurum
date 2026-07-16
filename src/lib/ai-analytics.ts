const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "mistral:7b";

export interface AppSummary {
  name: string;
  category: string;
  publisher: string;
  estimatedMrr: number;
  opportunityScore: number;
  downloads: number;
  price: number;
  hasIap: boolean;
  hasSubscriptions: boolean;
  rating: number;
  competitorCount: number;
}

export interface OpportunityRecommendation {
  marketOverview: string;
  recommendedCategory: string;
  categoryReason: string;
  topApps: Array<{ name: string; mrr: number; score: number; rating: number; downloads: number; reason: string }>;
  topApp: { name: string; reason: string };
  monetizationAdvice: string;
  keyInsights: string[];
  differentiationOpportunities: string[];
  riskFactors: string[];
  featurePriorities: string[];
  targetAudience: string;
  improvementThemes: string[];
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000_000) return `${+((n / 1_000_000_000).toFixed(1))}B`
  if (n >= 1_000_000) return `${+((n / 1_000_000).toFixed(1))}M`
  if (n >= 1_000) return `${+((n / 1_000).toFixed(1))}K`
  return n.toString()
}

function buildCategoryBreakdown(apps: AppSummary[]): string {
  const buckets: Record<string, { count: number; mrrSum: number }> = {}
  for (const app of apps) {
    if (!buckets[app.category]) buckets[app.category] = { count: 0, mrrSum: 0 }
    buckets[app.category].count++
    buckets[app.category].mrrSum += app.estimatedMrr
  }
  const sorted = Object.entries(buckets)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
  return sorted.map(([cat, d]) => `  - ${cat}: ${d.count} apps, avg MRR $${Math.round(d.mrrSum / d.count).toLocaleString()}`).join("\n")
}

function buildMonetizationBreakdown(apps: AppSummary[]): string {
  const buckets: Record<string, number> = { "Free + IAP": 0, Paid: 0, "Paid + IAP": 0 }
  for (const app of apps) {
    if (app.price > 0 && app.hasIap) buckets["Paid + IAP"]++
    else if (app.price > 0) buckets.Paid++
    else if (app.hasIap) buckets["Free + IAP"]++
  }
  const total = apps.length || 1
  const result: string[] = []
  for (const m of Object.keys(buckets)) {
    const c = buckets[m]
    if (c > 0) result.push(`  - ${m}: ${c} (${Math.round((c / total) * 100)}%)`)
  }
  return result.join("\n")
}

function buildPriceDistributionBlock(apps: AppSummary[]): string {
  const free = apps.filter((a) => a.price === 0).length
  const cheap = apps.filter((a) => a.price > 0 && a.price < 5).length
  const mid = apps.filter((a) => a.price >= 5 && a.price <= 20).length
  const premium = apps.filter((a) => a.price > 20).length
  const total = apps.length || 1
  return `  - Free: ${free} (${Math.round((free / total) * 100)}%)
  - Under $5: ${cheap} (${Math.round((cheap / total) * 100)}%)
  - $5-$20: ${mid} (${Math.round((mid / total) * 100)}%)
  - Over $20: ${premium} (${Math.round((premium / total) * 100)}%)`
}

function buildDownloadDistributionBlock(apps: AppSummary[]): string {
  const tiers: Record<string, number> = { "<10K": 0, "10K-100K": 0, "100K-1M": 0, "1M-10M": 0, "10M+": 0 }
  for (const app of apps) {
    if (app.downloads < 10_000) tiers["<10K"]++
    else if (app.downloads < 100_000) tiers["10K-100K"]++
    else if (app.downloads < 1_000_000) tiers["100K-1M"]++
    else if (app.downloads < 10_000_000) tiers["1M-10M"]++
    else tiers["10M+"]++
  }
  const total = apps.length || 1
  return Object.entries(tiers)
    .filter(([, c]) => c > 0)
    .map(([tier, c]) => `  - ${tier}: ${c} (${Math.round((c / total) * 100)}%)`)
    .join("\n")
}

function buildRatingByCategoryBlock(apps: AppSummary[]): string {
  const buckets: Record<string, { count: number; ratingSum: number; negativeSum: number }> = {}
  for (const app of apps) {
    if (!buckets[app.category]) buckets[app.category] = { count: 0, ratingSum: 0, negativeSum: 0 }
    buckets[app.category].count++
    buckets[app.category].ratingSum += app.rating
    if (app.rating <= 2) buckets[app.category].negativeSum++
  }
  const sorted = Object.entries(buckets).sort((a, b) => b[1].count - a[1].count).slice(0, 10)
  return sorted.map(([cat, d]) =>
    `  - ${cat}: avg rating ${(d.ratingSum / d.count).toFixed(2)}, ${Math.round((d.negativeSum / d.count) * 100)}% negative (≤2★)`
  ).join("\n")
}

function buildPublisherConcentrationBlock(apps: AppSummary[]): string {
  const buckets: Record<string, { count: number; mrrSum: number }> = {}
  for (const app of apps) {
    if (!buckets[app.publisher]) buckets[app.publisher] = { count: 0, mrrSum: 0 }
    buckets[app.publisher].count++
    buckets[app.publisher].mrrSum += app.estimatedMrr
  }
  const sorted = Object.entries(buckets)
    .sort((a, b) => b[1].mrrSum - a[1].mrrSum)
    .slice(0, 10)
  return sorted.map(([pub, d]) =>
    `  - ${pub}: ${d.count} apps, total MRR $${Math.round(d.mrrSum).toLocaleString()}`
  ).join("\n")
}

function buildMrrPercentileBlock(apps: AppSummary[]): string {
  const sorted = [...apps].sort((a, b) => a.estimatedMrr - b.estimatedMrr)
  const n = sorted.length
  if (n === 0) return "  - No data"
  const p25 = sorted[Math.floor(n * 0.25)].estimatedMrr
  const p50 = sorted[Math.floor(n * 0.5)].estimatedMrr
  const p75 = sorted[Math.floor(n * 0.75)].estimatedMrr
  const p95 = sorted[Math.floor(n * 0.95)].estimatedMrr
  return `  - P25: $${p25.toLocaleString()}
  - P50 (median): $${p50.toLocaleString()}
  - P75: $${p75.toLocaleString()}
  - P95: $${p95.toLocaleString()}`
}

function buildCompetitorDensityBlock(apps: AppSummary[]): string {
  const buckets: Record<string, { count: number; compSum: number }> = {}
  for (const app of apps) {
    if (!buckets[app.category]) buckets[app.category] = { count: 0, compSum: 0 }
    buckets[app.category].count++
    buckets[app.category].compSum += app.competitorCount
  }
  const sorted = Object.entries(buckets).sort((a, b) => b[1].count - a[1].count).slice(0, 10)
  return sorted.map(([cat, d]) =>
    `  - ${cat}: avg ${(d.compSum / d.count).toFixed(1)} competitors per app`
  ).join("\n")
}

function buildReviewSentimentBlock(apps: AppSummary[]): string {
  const buckets: Record<string, { count: number; negativeSum: number }> = {}
  for (const app of apps) {
    if (!buckets[app.category]) buckets[app.category] = { count: 0, negativeSum: 0 }
    buckets[app.category].count++
    if (app.rating <= 2) buckets[app.category].negativeSum++
  }
  const sorted = Object.entries(buckets).sort((a, b) => b[1].count - a[1].count).slice(0, 10)
  return sorted.map(([cat, d]) =>
    `  - ${cat}: ${Math.round((d.negativeSum / d.count) * 100)}% negative reviews (≤2★)`
  ).join("\n")
}

export function buildOpportunityPrompt(apps: AppSummary[], filterDesc?: string): string {
  const topApps = [...apps]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 20)

  const topAppsBlock = topApps
    .map((a, i) => `  ${i + 1}. ${a.name} | ${a.category} | MRR: $${a.estimatedMrr.toLocaleString()} | Score: ${a.opportunityScore} | Downloads: ${formatDownloads(a.downloads)} | Rating: ${a.rating}`)
    .join("\n")

  const categoryBlock = buildCategoryBreakdown(apps)
  const monetizationBlock = buildMonetizationBreakdown(apps)

  const topMrr = Math.max(...apps.map((a) => a.estimatedMrr))
  const avgMrr = Math.round(apps.reduce((s, a) => s + a.estimatedMrr, 0) / Math.max(apps.length, 1))
  const avgScore = Math.round(apps.reduce((s, a) => s + a.opportunityScore, 0) / Math.max(apps.length, 1))

  const priceBlock = buildPriceDistributionBlock(apps)
  const downloadBlock = buildDownloadDistributionBlock(apps)
  const ratingByCatBlock = buildRatingByCategoryBlock(apps)
  const publisherBlock = buildPublisherConcentrationBlock(apps)
  const mrrPercentileBlock = buildMrrPercentileBlock(apps)
  const competitorBlock = buildCompetitorDensityBlock(apps)
  const sentimentBlock = buildReviewSentimentBlock(apps)

  return `You are an expert mobile app market analyst. Given the following data about ${apps.length} Android apps${filterDesc ? ` (filtered by: ${filterDesc})` : ""}, answer this question:

"Which profitable Android app should I recreate or improve?"

Dataset summary:
  - Total apps: ${apps.length}
  - MRR range: $0 — $${topMrr.toLocaleString()}
  - Average MRR: $${avgMrr.toLocaleString()}
  - Average Opportunity Score: ${avgScore}/100

MRR percentiles:
${mrrPercentileBlock}

Top 20 apps by Opportunity Score:
${topAppsBlock}

Category breakdown (top 10):
${categoryBlock}

Rating by category (top 10):
${ratingByCatBlock}

Review sentiment (negative % by category):
${sentimentBlock}

Competitor density by category:
${competitorBlock}

Price distribution:
${priceBlock}

Download distribution:
${downloadBlock}

Monetization model distribution:
${monetizationBlock}

Top publishers by total MRR:
${publisherBlock}

Provide a detailed, data-driven recommendation as a raw JSON object (no markdown, no code fences, no extra text). Use this exact schema:

{
  "marketOverview": "2-3 sentences about the overall market state, trends, and what the data reveals",
  "recommendedCategory": "single category name that offers the best opportunity",
  "categoryReason": "2-3 sentence explanation of why this category is the best opportunity",
  "topApps": [
    {"name": "exact app name from the Top 20 list above", "reason": "2-3 sentence analysis of why this app is a great opportunity — text only"}
  ],
  "monetizationAdvice": "1-2 sentences on which monetization model to use and at what price point",
  "keyInsights": ["specific insight 1 backed by the data", "insight 2", "insight 3"],
  "differentiationOpportunities": ["specific gap or opportunity 1", "opportunity 2", "opportunity 3"],
  "riskFactors": ["specific risk 1", "risk 2", "risk 3"],
  "featurePriorities": ["feature 1", "feature 2", "feature 3"],
  "targetAudience": "1-2 sentences describing the ideal user persona",
  "improvementThemes": ["theme 1", "theme 2", "theme 3"]
}

You MUST recommend a specific category and list at least 3 specific apps from the Top 20 list above.
CRITICAL: Do NOT recommend any app outside the Top 20 list. Respond with ONLY the JSON object — no markdown, no backticks, no extra commentary.`
}

export function parseOpportunityAnalysis(raw: string): OpportunityRecommendation {
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim()
  const parsed = JSON.parse(cleaned)

  const topApps = (parsed.topApps ?? []).map((a: { name: string; reason?: string }) => ({
    name: a.name ?? "",
    mrr: 0,
    score: 0,
    rating: 0,
    downloads: 0,
    reason: a.reason ?? "",
  }))

  return {
    marketOverview: parsed.marketOverview ?? "",
    recommendedCategory: parsed.recommendedCategory ?? "Unable to determine",
    categoryReason: parsed.categoryReason ?? "",
    topApps,
    topApp: topApps.length > 0 ? { name: topApps[0].name, reason: topApps[0].reason } : { name: "", reason: "" },
    monetizationAdvice: parsed.monetizationAdvice ?? "",
    keyInsights: parsed.keyInsights ?? [],
    differentiationOpportunities: parsed.differentiationOpportunities ?? [],
    riskFactors: parsed.riskFactors ?? [],
    featurePriorities: parsed.featurePriorities ?? [],
    targetAudience: parsed.targetAudience ?? "",
    improvementThemes: parsed.improvementThemes ?? [],
  }
}

async function ollamaChat(prompt: string, model: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 16384 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return (data.response ?? "").trim()
}

export async function analyzeOpportunity(
  apps: AppSummary[],
  filterDesc?: string,
  model?: string,
): Promise<{ recommendation: OpportunityRecommendation; modelName: string }> {
  const modelName = model ?? DEFAULT_MODEL
  const prompt = buildOpportunityPrompt(apps, filterDesc)
  const raw = await ollamaChat(prompt, modelName)
  const recommendation = parseOpportunityAnalysis(raw)
  return { recommendation, modelName }
}

export function validateTopApps(
  topApps: Array<{ name: string; mrr: number; score: number; rating: number; downloads: number; reason: string }>,
  topApp: { name: string; reason: string },
  validNames: string[],
  allApps: AppSummary[],
) {
  const valid = new Set(validNames)
  const used = new Set<string>()
  const sorted = [...allApps].sort((a, b) => b.opportunityScore - a.opportunityScore)

  const correctedApps = topApps.map((app) => {
    if (valid.has(app.name) && !used.has(app.name)) {
      used.add(app.name)
      return app
    }
    const repl = sorted.find((a) => valid.has(a.name) && !used.has(a.name))
    if (repl) {
      used.add(repl.name)
      return { ...app, name: repl.name, mrr: repl.estimatedMrr, score: repl.opportunityScore, rating: repl.rating, downloads: repl.downloads }
    }
    return app
  })

  let correctedTopApp = topApp
  if (!valid.has(topApp.name)) {
    const repl = sorted.find((a) => valid.has(a.name))
    if (repl) {
      correctedTopApp = { name: repl.name, reason: topApp.reason }
    }
  }

  return { topApps: correctedApps, topApp: correctedTopApp }
}

export { DEFAULT_MODEL }

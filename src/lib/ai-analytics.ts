const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "mistral:7b";

export interface AppSummary {
  name: string;
  category: string;
  estimatedMrr: number;
  opportunityScore: number;
  downloads: number;
  price: number;
  hasIap: boolean;
  hasSubscriptions: boolean;
  rating: number;
}

export interface OpportunityRecommendation {
  recommendedCategory: string;
  topApp: { name: string; reason: string };
  keyInsights: string[];
  improvementThemes: string[];
}

function formatDownloads(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
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

  return `You are an expert mobile app market analyst. Given the following data about ${apps.length} Android apps${filterDesc ? ` (filtered by: ${filterDesc})` : ""}, answer this question:

"Which profitable Android app should I recreate or improve?"

Dataset summary:
  - Total apps: ${apps.length}
  - MRR range: $0 — $${topMrr.toLocaleString()}
  - Average MRR: $${avgMrr.toLocaleString()}
  - Average Opportunity Score: ${avgScore}/100

Top 20 apps by Opportunity Score:
${topAppsBlock}

Category breakdown (top 10):
${categoryBlock}

Monetization model distribution:
${monetizationBlock}

Provide a concise, data-driven recommendation in EXACTLY this format — no extra commentary, no markdown:

RECOMMENDED_CATEGORY: <single category name that offers the best opportunity>

TOP_APP: <exact app name from the list> | <2-3 sentence explanation of why this app is the best opportunity>

KEY_INSIGHTS:
- <specific insight 1 backed by the data>
- <specific insight 2 backed by the data>
- <specific insight 3 backed by the data>

IMPROVEMENT_THEMES:
- <specific theme 1 for what to improve>
- <specific theme 2 for what to improve>
- <specific theme 3 for what to improve>

You MUST recommend a specific category and a specific app from the list. Base your answer on the data above.`
}

export function parseOpportunityAnalysis(raw: string): OpportunityRecommendation {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean)

  let recommendedCategory = ""
  let topAppName = ""
  let topAppReason = ""
  const keyInsights: string[] = []
  const improvementThemes: string[] = []

  let mode: "keyInsights" | "improvementThemes" | null = null

  for (const line of lines) {
    if (line.startsWith("RECOMMENDED_CATEGORY:")) {
      recommendedCategory = line.slice("RECOMMENDED_CATEGORY:".length).trim()
      continue
    }

    if (line.startsWith("TOP_APP:")) {
      const rest = line.slice("TOP_APP:".length).trim()
      const sepIndex = rest.indexOf("|")
      if (sepIndex !== -1) {
        topAppName = rest.slice(0, sepIndex).trim()
        topAppReason = rest.slice(sepIndex + 1).trim()
      } else {
        topAppName = rest
        topAppReason = ""
      }
      continue
    }

    if (line.startsWith("KEY_INSIGHTS:")) {
      mode = "keyInsights"
      continue
    }

    if (line.startsWith("IMPROVEMENT_THEMES:")) {
      mode = "improvementThemes"
      continue
    }

    if (mode === "keyInsights" && line.startsWith("- ")) {
      keyInsights.push(line.slice(2).trim())
    } else if (mode === "improvementThemes" && line.startsWith("- ")) {
      improvementThemes.push(line.slice(2).trim())
    }
  }

  return {
    recommendedCategory: recommendedCategory || "Unable to determine",
    topApp: {
      name: topAppName || "Unable to determine",
      reason: topAppReason || "",
    },
    keyInsights: keyInsights.length > 0 ? keyInsights : ["No insights generated."],
    improvementThemes: improvementThemes.length > 0 ? improvementThemes : ["No improvement themes generated."],
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
      options: { temperature: 0.3, num_predict: 4096 },
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
  return { recommendation: parseOpportunityAnalysis(raw), modelName }
}

export { DEFAULT_MODEL }

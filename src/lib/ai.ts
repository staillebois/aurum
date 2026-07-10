const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b";

export interface AiAnalysis {
  summary: string;
  painPoints: string[];
  improvements: string[];
}

async function ollamaChat(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 4096 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data.response ?? "").trim();
}

function buildAnalysisPrompt(appName: string, description: string, reviews: string[]): string {
  const reviewBlock =
    reviews.length > 0
      ? `\nUser reviews:\n${reviews.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : " (no user reviews available)";

  return `Analyze this Android app for someone who wants to build a competing app.

App name: ${appName}
Description: ${description.slice(0, 3000)}${reviewBlock}

Provide your analysis in this exact format — do NOT use markdown formatting, do NOT add extra sections:

SUMMARY: <2-3 sentence summary of what the app does and its monetization>

PAIN POINTS:
- <pain point 1>
- <pain point 2>
- <pain point 3>

IMPROVEMENTS:
- <improvement suggestion 1>
- <improvement suggestion 2>
- <improvement suggestion 3>

You MUST include all three sections exactly as shown. Start your response with "SUMMARY:". Focus on actionable insights for a competitor.`;
}

function parseSection(raw: string, sectionName: string): string[] {
  const names = [sectionName];

  if (sectionName === "IMPROVEMENTS") {
    names.push("Improvement Ideas");
  }

  let nextPattern = "";
  if (sectionName === "PAIN POINTS") {
    const next = ["IMPROVEMENTS", "Improvement Ideas"];
    const escaped = next.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    nextPattern = `\\n#{0,6}\\s*\\*{0,2}\\s*(?:${escaped.join("|")})\\s*\\*{0,2}:?\\s*\\n?`;
  }

  const lookahead = nextPattern ? `(?=${nextPattern}|$)` : "(?=$)";

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|\\n)#{0,6}\\s*\\*{0,2}\\s*${escaped}\\s*\\*{0,2}:?\\s*\\n?` +
      `([\\s\\S]*?)` +
      lookahead,
      "im"
    );

    const match = raw.match(pattern);
    if (!match) continue;

    return match[1]
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter((l) => l.length > 0);
  }

  return [];
}

function parseAnalysis(raw: string): AiAnalysis {
  const summaryMatch = raw.match(
    /(?:^|\n)#{0,6}\s*\*{0,2}\s*SUMMARY\s*\*{0,2}:?\s*\n?\s*([\s\S]*?)(?=\n#{0,6}\s*\*{0,2}\s*(?:PAIN POINTS|Pain Points)\s*\*{0,2}:?\s*\n?|$)/im
  );
  const summary = summaryMatch ? summaryMatch[1].trim() : "No summary generated.";

  const painPoints = parseSection(raw, "PAIN POINTS");
  const improvements = parseSection(raw, "IMPROVEMENTS");

  return {
    summary: summary || "No summary generated.",
    painPoints: painPoints.length > 0 ? painPoints : ["No pain points identified."],
    improvements: improvements.length > 0 ? improvements : ["No improvements suggested."],
  };
}

export async function analyzeApp(
  appName: string,
  description: string,
  reviews: string[],
): Promise<AiAnalysis> {
  const prompt = buildAnalysisPrompt(appName, description, reviews);
  const raw = await ollamaChat(prompt);
  return parseAnalysis(raw);
}

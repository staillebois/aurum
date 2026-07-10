const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";

export interface AiAnalysis {
  summary: string;
  painPoints: string[];
  improvements: string[];
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

Provide exactly 3-5 specific pain points and 3-5 specific improvement ideas based on the app description and user reviews. Use plain text only — no markdown formatting like ###, **, or \`\`\`. Do NOT add extra sections or commentary.

Format:

SUMMARY: <2-3 sentence summary of what the app does and its monetization>

PAIN POINTS:
- <specific pain point 1 based on reviews>
- <specific pain point 2 based on reviews>
- <specific pain point 3 based on reviews>

IMPROVEMENTS:
- <specific improvement 1 addressing the pain points>
- <specific improvement 2 addressing the pain points>
- <specific improvement 3 addressing the pain points>

Example for Spotify:
SUMMARY: Spotify is a music and podcast streaming service operating on a freemium model with ads on the free tier and a premium subscription for offline listening and higher quality audio.
PAIN POINTS:
- Too many ads disrupting the listening experience
- Podcast player interface is clunky and hard to navigate
- Frequent logout issues requiring repeated login
IMPROVEMENTS:
- Reduce ad frequency or offer lower-priced ad-light tier
- Redesign podcast player with better navigation and playback controls
- Fix session management to prevent random logouts

You MUST include at least 3 items in PAIN POINTS and at least 3 items in IMPROVEMENTS. Start with SUMMARY:. Use bullet points (-) for PAIN POINTS and IMPROVEMENTS. Be specific to this app — do not use generic statements that could apply to any app.`;
}

const SECTION_ALIASES: Record<string, string[]> = {
  "PAIN POINTS": ["PAIN POINTS", "Pain Points", "pain points", "PAIN POINTS:", "Pain Points:"],
  "IMPROVEMENTS": ["IMPROVEMENTS", "Improvement Ideas", "Improvements", "improvements", "IMPROVEMENTS:", "Improvement Ideas:", "Improvements:"],
};

function parseSection(raw: string, sectionName: string): string[] {
  const names = SECTION_ALIASES[sectionName] ?? [sectionName];

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const pattern = new RegExp(
      `(?:^|\\n)#{0,6}\\s*\\*{0,2}\\s*${escaped}\\s*\\*{0,2}:?\\s*\\n?` +
      `([\\s\\S]*?)(?=\\n#{0,6}\\s*\\*{0,2}\\s*(?:${getNextPattern(sectionName)})\\s*\\*{0,2}:?\\s*\\n?|$)`,
      "im"
    );

    const match = raw.match(pattern);
    if (!match) continue;

    const items = match[1]
      .split("\n")
      .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter((l) => l.length > 0);

    if (items.length > 0) return items;
  }

  return [];
}

function getNextPattern(sectionName: string): string {
  const next = sectionName === "PAIN POINTS" ? Object.values(SECTION_ALIASES).flat().filter((n) => n !== "PAIN POINTS" && n !== "Pain Points" && n !== "pain points") : [];
  if (next.length === 0) return "";
  const escaped = next.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return escaped.join("|");
}

function parseAnalysis(raw: string): AiAnalysis {
  const summaryMatch = raw.match(
    /(?:^|\n)#{0,6}\s*\*{0,2}\s*SUMMARY\s*\*{0,2}:?\s*\n?\s*([\s\S]*?)(?=\n#{0,6}\s*\*{0,2}\s*(?:PAIN POINTS|Pain Points|pain points)\s*\*{0,2}:?\s*\n?|$)/im
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
  model?: string,
): Promise<AiAnalysis> {
  const prompt = buildAnalysisPrompt(appName, description, reviews);
  const raw = await ollamaChat(prompt, model ?? DEFAULT_MODEL);
  return parseAnalysis(raw);
}

export { DEFAULT_MODEL };

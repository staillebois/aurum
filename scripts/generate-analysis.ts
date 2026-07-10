import { prisma } from "../src/lib/prisma";

const NEGATIVE_KEYWORDS = [
  "bug", "crash", "slow", "lag", "freeze", "glitch", "error", "issue",
  "problem", "broken", "terrible", "awful", "horrible", "useless", "worst",
  "disappointed", "frustrating", "annoying", "expensive", "overpriced",
  "spam", "ads", "advertisement", "battery", "permission", "privacy",
  "confusing", "difficult", "complicated", "outdated", "obsolete",
  "unresponsive", "bloatware", "uninstall", "remove", "crashes",
  "laggy", "expensive", "not working", "doesn't work", "does not work",
  "bad", "poor", "awful", "hate", "waste", "scam", "fake",
];

const IMPROVEMENT_MAP: Record<string, string[]> = {
  performance: [
    "Optimize app performance and reduce loading times",
    "Improve app startup speed and responsiveness",
    "Reduce memory usage and prevent background crashes",
  ],
  bug: [
    "Fix recurring crashes and stability issues",
    "Implement better error handling and crash reporting",
    "Release more frequent bug fix updates",
  ],
  ui: [
    "Redesign the user interface for better usability",
    "Simplify navigation and reduce cognitive load",
    "Improve accessibility with larger touch targets and better contrast",
  ],
  ads: [
    "Reduce frequency of advertisements",
    "Offer a reasonably priced ad-free subscription tier",
    "Make ads less intrusive with better placement",
  ],
  price: [
    "Review pricing strategy to better match user expectations",
    "Offer more flexible payment options or trial periods",
    "Add a free tier with essential features",
  ],
  feature: [
    "Add offline mode for core functionality",
    "Implement dark mode support",
    "Add more customization options",
    "Integrate with popular third-party services",
    "Add batch processing capabilities",
  ],
  battery: [
    "Optimize background processes to reduce battery drain",
    "Provide battery usage statistics and controls",
    "Implement a low-power mode",
  ],
  privacy: [
    "Simplify privacy settings and make them more transparent",
    "Reduce required permissions to minimum necessary",
    "Add a privacy dashboard showing data collection practices",
  ],
};

function extractSummary(description: string, category: string): string {
  const cleaned = description.replace(/<[^>]*>/g, "").trim();
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length === 0) return `${category} application offering various features to users.`;

  const meaningful = sentences.filter(s => {
    const lower = s.toLowerCase();
    return !lower.startsWith("download") && !lower.startsWith("install") && !lower.startsWith("get it");
  });

  if (meaningful.length === 0) return sentences.slice(0, 2).join(". ").trim() + ".";
  return meaningful.slice(0, 3).join(". ").trim() + ".";
}

function extractPainPoints(reviews: { text: string; rating: number }[]): string[] {
  const negativeReviews = reviews.filter(r => r.rating <= 3 && r.text.length > 15);
  if (negativeReviews.length === 0) return [];

  const painMap = new Map<string, { count: number; examples: string[] }>();

  for (const review of negativeReviews) {
    const lower = review.text.toLowerCase();
    for (const keyword of NEGATIVE_KEYWORDS) {
      if (lower.includes(keyword)) {
        const existing = painMap.get(keyword);
        if (existing) {
          existing.count++;
          if (existing.examples.length < 2) {
            existing.examples.push(review.text.slice(0, 120));
          }
        } else {
          painMap.set(keyword, { count: 1, examples: [review.text.slice(0, 120)] });
        }
      }
    }
  }

  const sorted = [...painMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return sorted.map(([keyword, data]) => {
    const example = data.examples[0] || "";
    if (example.length > 80) {
      return `Users report "${keyword}" issues: "${example.slice(0, 80)}..."`;
    }
    return `Users report "${keyword}" issues: "${example}"`;
  });
}

function generateImprovements(
  painPoints: string[],
  description: string,
  hasIap: boolean,
  hasSubscriptions: boolean,
): string[] {
  const improvements: string[] = [];
  const lowerDesc = description.toLowerCase();

  const hasPerformanceIssue = painPoints.some(p =>
    NEGATIVE_KEYWORDS.some(k => ["bug", "crash", "slow", "lag", "freeze", "glitch"].includes(k) && p.includes(k))
  );
  const hasAdIssue = painPoints.some(p => p.includes("ads") || p.includes("advertisement") || p.includes("spam"));
  const hasPriceIssue = painPoints.some(p => p.includes("expensive") || p.includes("overpriced") || p.includes("price"));
  const hasPrivacyIssue = painPoints.some(p => p.includes("privacy") || p.includes("permission"));
  const hasUIssue = painPoints.some(p => p.includes("confusing") || p.includes("difficult") || p.includes("complicated"));
  const hasBatteryIssue = painPoints.some(p => p.includes("battery"));
  const hasBugIssue = painPoints.some(p =>
    ["bug", "crash", "error", "issue", "problem", "broken"].some(k => p.includes(k))
  );

  if (hasPerformanceIssue) improvements.push(IMPROVEMENT_MAP.performance[0]);
  if (hasBugIssue) improvements.push(IMPROVEMENT_MAP.bug[0]);
  if (hasUIssue) improvements.push(IMPROVEMENT_MAP.ui[0]);
  if (hasAdIssue) improvements.push(IMPROVEMENT_MAP.ads[Math.floor(Math.random() * IMPROVEMENT_MAP.ads.length)]);
  if (hasPriceIssue && !hasIap && !hasSubscriptions) {
    improvements.push("Introduce a premium tier with additional features to generate revenue");
  }
  if (hasPrivacyIssue) improvements.push(IMPROVEMENT_MAP.privacy[0]);
  if (hasBatteryIssue) improvements.push(IMPROVEMENT_MAP.battery[0]);

  if (!lowerDesc.includes("offline")) improvements.push(IMPROVEMENT_MAP.feature[0]);
  if (!lowerDesc.includes("dark")) improvements.push(IMPROVEMENT_MAP.feature[1]);

  if (improvements.length < 3) {
    improvements.push("Improve overall user experience based on user feedback analysis");
  }

  return [...new Set(improvements)].slice(0, 5);
}

async function main() {
  console.log("Generating programmatic analysis for all apps...\n");

  const apps = await prisma.app.findMany({
    include: { reviews: true },
    orderBy: { estimatedMrr: "desc" },
  });

  console.log(`Found ${apps.length} apps.\n`);

  let updated = 0;
  let errors = 0;

  for (const app of apps) {
    try {
      const reviewTexts = app.reviews
        .filter(r => r.text.length > 10)
        .map(r => ({ text: r.text, rating: r.rating }));

      const summary = extractSummary(app.description, app.category);
      const painPoints = extractPainPoints(reviewTexts);
      const improvements = generateImprovements(painPoints, app.description, app.hasIap, app.hasSubscriptions);

      await prisma.app.update({
        where: { id: app.id },
        data: {
          aiSummary: summary,
          painPoints: JSON.stringify(painPoints),
          improvements: JSON.stringify(improvements),
          aiAnalyzedAt: new Date(),
        },
      });

      updated++;
      if (updated % 50 === 0) {
        console.log(`  Progress: ${updated}/${apps.length}`);
      }
    } catch (err) {
      console.error(`  Error on ${app.name}: ${err}`);
      errors++;
    }
  }

  console.log(`\nDone! ${updated} apps analyzed, ${errors} errors.`);
  await prisma.$disconnect();
}

main();

import gplay from "google-play-scraper";
import { prisma } from "../src/lib/prisma";

const TARGET_CATEGORIES = [
  { label: "Productivity", id: gplay.category.PRODUCTIVITY },
  { label: "Finance", id: gplay.category.FINANCE },
  { label: "Health & Fitness", id: gplay.category.HEALTH_AND_FITNESS },
  { label: "Photography", id: gplay.category.PHOTOGRAPHY },
  { label: "Business", id: gplay.category.BUSINESS },
  { label: "Education", id: gplay.category.EDUCATION },
  { label: "Tools", id: gplay.category.TOOLS },
];

const AI_SEARCH_TERMS = [
  "AI assistant",
  "AI chatbot",
  "AI productivity",
  "artificial intelligence",
  "machine learning",
  "AI photo editor",
];

const REVIEWS_PER_APP = 50;
const SIMILAR_PER_APP = 5;

function parseDownloads(installs: string): number {
  const cleaned = installs.replace(/[+,]/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(M|B|K|million|billion|thousand)?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || "").toLowerCase();
  switch (suffix) {
    case "b":
    case "billion":
      return Math.round(num * 1_000_000_000);
    case "m":
    case "million":
      return Math.round(num * 1_000_000);
    case "k":
    case "thousand":
      return Math.round(num * 1_000);
    default:
      return Math.round(num);
  }
}

function detectSubscriptions(iapRange?: string): boolean {
  if (!iapRange) return false;
  const subPatterns = [
    /monthly/i, /yearly/i, /\/mo/i, /\/yr/i, /\/year/i,
    /per month/i, /per year/i, /subscription/i, /weekly/i,
  ];
  return subPatterns.some((p) => p.test(iapRange));
}

async function saveApp(app: any) {
  const downloads = app.minInstalls ?? parseDownloads(app.installs ?? "0");
  const hasIap = app.offersIAP ?? false;
  const hasSubscriptions = detectSubscriptions(app.IAPRange);
  const category = app.genre ?? app.genreId ?? "UNKNOWN";

  const data = {
    name: app.title ?? app.appId,
    icon: app.icon ?? "",
    description: (app.description ?? "").slice(0, 5000),
    publisher: app.developer ?? "",
    category,
    downloads,
    price: app.price ?? 0,
    hasIap,
    hasSubscriptions,
    rating: app.score ?? 0,
    reviewCount: app.reviews ?? 0,
  };

  const saved = await prisma.app.upsert({
    where: { id: app.appId },
    create: { id: app.appId, ...data },
    update: data,
  });

  return saved;
}

async function saveReviews(appId: string) {
  try {
    const result = await gplay.reviews({
      appId,
      num: REVIEWS_PER_APP,
      sort: gplay.sort.HELPFULNESS,
      lang: "en",
      country: "us",
    });

    if (!result.data?.length) return;

    await prisma.review.deleteMany({ where: { appId } });

    const reviews = result.data.map((r: any) => ({
      appId,
      text: (r.text ?? "").slice(0, 2000),
      rating: r.score ?? 0,
      userName: r.userName ?? null,
    }));

    await prisma.review.createMany({ data: reviews });
    console.log(`  Saved ${reviews.length} reviews`);
  } catch (err) {
    console.error(`  Error fetching reviews for ${appId}:`, (err as Error).message);
  }
}

async function saveCompetitors(appId: string) {
  try {
    const result = await gplay.similar({
      appId,
      lang: "en",
      country: "us",
      fullDetail: false,
    });

    if (!result?.length) return;

    await prisma.competitor.deleteMany({ where: { appId } });

    const competitors = result.slice(0, SIMILAR_PER_APP).map((c: any) => ({
      appId,
      name: c.title ?? c.appId,
      icon: c.icon ?? null,
      downloads: c.minInstalls ?? null,
      estimatedMrr: null,
    }));

    await prisma.competitor.createMany({ data: competitors });
    console.log(`  Saved ${competitors.length} competitors`);
  } catch (err) {
    console.error(`  Error fetching competitors for ${appId}:`, (err as Error).message);
  }
}

async function crawl() {
  console.log("Starting crawl...\n");

  const existing = await prisma.app.findMany({ select: { id: true } });
  const seenAppIds = new Set(existing.map((a) => a.id));
  console.log(`Already in DB: ${existing.length}\n`);

  let totalSaved = 0;

  for (const cat of TARGET_CATEGORIES) {
    console.log(`[Category] ${cat.label}`);
    try {
      const apps = await gplay.list({
        collection: gplay.collection.GROSSING,
        category: cat.id,
        num: 60,
        fullDetail: true,
        lang: "en",
        country: "us",
      });

      for (const app of apps) {
        if (seenAppIds.has(app.appId)) continue;
        seenAppIds.add(app.appId);

        const isTarget = !app.free || app.offersIAP;
        if (!isTarget) continue;

        console.log(`  Saving: ${app.title ?? app.appId} (${app.free ? "free+iap" : "paid"})`);
        await saveApp(app);
        await saveReviews(app.appId);
        await saveCompetitors(app.appId);
        totalSaved++;
      }
    } catch (err) {
      console.error(`  Error in category ${cat.label}:`, (err as Error).message);
    }
  }

  for (const term of AI_SEARCH_TERMS) {
    console.log(`[Search] ${term}`);
    try {
      const results = await gplay.search({
        term,
        num: 30,
        fullDetail: true,
        lang: "en",
        country: "us",
        price: "all",
      });

      for (const app of results) {
        if (seenAppIds.has(app.appId)) continue;
        seenAppIds.add(app.appId);

        const isTarget = !app.free || app.offersIAP;
        if (!isTarget) continue;

        console.log(`  Saving: ${app.title ?? app.appId} (${app.free ? "free+iap" : "paid"})`);
        await saveApp(app);
        await saveReviews(app.appId);
        await saveCompetitors(app.appId);
        totalSaved++;
      }
    } catch (err) {
      console.error(`  Error searching "${term}":`, (err as Error).message);
    }
  }

  console.log(`\nDone! Saved ${totalSaved} apps total.`);
}

crawl();

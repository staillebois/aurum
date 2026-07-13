import gplay from "google-play-scraper";
import { prisma } from "../src/lib/prisma";
import { estimateMrr, calculateOpportunityScore } from "../src/lib/scoring";

const SHOULD_REFRESH = process.argv.includes("--refresh");
const CONCURRENCY = parseInt(
  process.argv.find(a => a.startsWith("--concurrency="))?.split("=")[1] ?? "5", 10
);

const TARGET_CATEGORIES = [
  { label: "Art & Design", id: gplay.category.ART_AND_DESIGN },
  { label: "Auto & Vehicles", id: gplay.category.AUTO_AND_VEHICLES },
  { label: "Beauty", id: gplay.category.BEAUTY },
  { label: "Books & Reference", id: gplay.category.BOOKS_AND_REFERENCE },
  { label: "Business", id: gplay.category.BUSINESS },
  { label: "Comics", id: gplay.category.COMICS },
  { label: "Communication", id: gplay.category.COMMUNICATION },
  { label: "Dating", id: gplay.category.DATING },
  { label: "Education", id: gplay.category.EDUCATION },
  { label: "Entertainment", id: gplay.category.ENTERTAINMENT },
  { label: "Events", id: gplay.category.EVENTS },
  { label: "Family", id: gplay.category.FAMILY },
  { label: "Finance", id: gplay.category.FINANCE },
  { label: "Food & Drink", id: gplay.category.FOOD_AND_DRINK },
  { label: "Health & Fitness", id: gplay.category.HEALTH_AND_FITNESS },
  { label: "House & Home", id: gplay.category.HOUSE_AND_HOME },
  { label: "Libraries & Demo", id: gplay.category.LIBRARIES_AND_DEMO },
  { label: "Lifestyle", id: gplay.category.LIFESTYLE },
  { label: "Maps & Navigation", id: gplay.category.MAPS_AND_NAVIGATION },
  { label: "Medical", id: gplay.category.MEDICAL },
  { label: "Music & Audio", id: gplay.category.MUSIC_AND_AUDIO },
  { label: "News & Magazines", id: gplay.category.NEWS_AND_MAGAZINES },
  { label: "Parenting", id: gplay.category.PARENTING },
  { label: "Personalization", id: gplay.category.PERSONALIZATION },
  { label: "Photography", id: gplay.category.PHOTOGRAPHY },
  { label: "Productivity", id: gplay.category.PRODUCTIVITY },
  { label: "Shopping", id: gplay.category.SHOPPING },
  { label: "Social", id: gplay.category.SOCIAL },
  { label: "Sports", id: gplay.category.SPORTS },
  { label: "Tools", id: gplay.category.TOOLS },
  { label: "Travel & Local", id: gplay.category.TRAVEL_AND_LOCAL },
  { label: "Video Players", id: gplay.category.VIDEO_PLAYERS },
  { label: "Watch Face", id: gplay.category.WATCH_FACE },
  { label: "Weather", id: gplay.category.WEATHER },
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

async function saveReviews(appId: string, appLabel: string) {
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
      createdAt: r.date ?? new Date(),
    }));

    await prisma.review.createMany({ data: reviews });
    console.log(`  [${appLabel}] Saved ${reviews.length} reviews`);
  } catch (err) {
    console.error(`  [${appLabel}] Error fetching reviews:`, (err as Error).message);
  }
}

async function saveCompetitors(appId: string, appLabel: string) {
  try {
    const result = await gplay.similar({
      appId,
      lang: "en",
      country: "us",
      fullDetail: false,
    });

    if (!result?.length || !Array.isArray(result)) return;

    await prisma.competitor.deleteMany({ where: { appId } });

    const competitors = result.slice(0, SIMILAR_PER_APP).map((c: any) => ({
      appId,
      name: c.title ?? c.appId,
      icon: c.icon ?? null,
      downloads: c.minInstalls ?? null,
      estimatedMrr: null,
    }));

    await prisma.competitor.createMany({ data: competitors });
    console.log(`  [${appLabel}] Saved ${competitors.length} competitors`);
  } catch (err) {
    console.log(`  [${appLabel}] No competitors (${(err as Error).message})`);
  }
}

async function scoreApp(appId: string, appLabel: string) {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: { reviews: true, competitors: true },
  });
  if (!app) return;

  const mrr = estimateMrr(app);
  const negativeReviews = app.reviews.filter((r) => r.rating <= 2).length;
  const negativeReviewRatio = app.reviews.length > 0 ? negativeReviews / app.reviews.length : 0;

  const score = calculateOpportunityScore({
    estimatedMrr: mrr,
    negativeReviewRatio,
    competitorCount: app.competitors.length,
    descriptionLength: app.description.length,
  });

  await prisma.app.update({
    where: { id: appId },
    data: { estimatedMrr: mrr, opportunityScore: score },
  });

  console.log(`  [${appLabel}] MRR: $${mrr}  Score: ${score}`);
}

async function crawl() {
  console.log("Starting crawl...\n");

  const existing = await prisma.app.findMany({ select: { id: true } });
  const seenAppIds = new Set(existing.map((a) => a.id));
  console.log(`Already in DB: ${existing.length}\n`);

  let totalSaved = 0;

  for (let i = 0; i < TARGET_CATEGORIES.length; i += CONCURRENCY) {
    const batch = TARGET_CATEGORIES.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (cat) => {
      console.log(`[Category] ${cat.label}`);
      try {
        const apps = await gplay.list({
          collection: gplay.collection.GROSSING,
          category: cat.id,
          num: 100,
          fullDetail: true,
          lang: "en",
          country: "us",
        });

        let saved = 0;
        for (const app of apps) {
          if (seenAppIds.has(app.appId)) continue;
          seenAppIds.add(app.appId);

          const isTarget = !app.free || app.offersIAP;
          if (!isTarget) continue;

          const appLabel = app.title ?? app.appId;
          console.log(`  [${cat.label}] Saving: ${appLabel} (${app.free ? "free+iap" : "paid"})`);
          await saveApp(app);
          await saveReviews(app.appId, appLabel);
          await saveCompetitors(app.appId, appLabel);
          await scoreApp(app.appId, appLabel);
          saved++;
        }
        return saved;
      } catch (err) {
        console.error(`  Error in category ${cat.label}:`, (err as Error).message);
        return 0;
      }
    }));
    totalSaved += results.reduce((a, b) => a + b, 0);
  }

  if (SHOULD_REFRESH) {
    console.log(`\nRefreshing reviews for ${existing.length} existing apps...`);
    for (let i = 0; i < existing.length; i++) {
      const app = existing[i];
      await saveReviews(app.id, app.id.slice(0, 30));
      process.stdout.write(" done\n");
    }
    console.log("Review refresh complete.");
  }

  console.log(`\nDone! Saved ${totalSaved} apps total.`);
}

crawl();

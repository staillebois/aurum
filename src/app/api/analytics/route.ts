import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const minMrr = searchParams.get("minMrr");
  const maxMrr = searchParams.get("maxMrr");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const minDownloads = searchParams.get("minDownloads");
  const maxDownloads = searchParams.get("maxDownloads");
  const maxApps = Math.min(5000, Math.max(1, parseInt(searchParams.get("maxApps") ?? "500", 10) || 500));

  const where: Record<string, unknown> = {};

  if (minMrr || maxMrr) {
    const range: Record<string, number> = {};
    if (minMrr) range.gte = parseFloat(minMrr);
    if (maxMrr) range.lte = parseFloat(maxMrr);
    where.estimatedMrr = range;
  }

  if (minScore || maxScore) {
    const range: Record<string, number> = {};
    if (minScore) range.gte = parseFloat(minScore);
    if (maxScore) range.lte = parseFloat(maxScore);
    where.opportunityScore = range;
  }

  if (minDownloads || maxDownloads) {
    const range: Record<string, number> = {};
    if (minDownloads) range.gte = parseInt(minDownloads, 10);
    if (maxDownloads) range.lte = parseInt(maxDownloads, 10);
    where.downloads = range;
  }

  const [categoryStats, allApps] = await Promise.all([
    prisma.app.groupBy({
      by: ["category"],
      _count: { category: true },
      _avg: { estimatedMrr: true },
      _max: { estimatedMrr: true },
      orderBy: { _avg: { estimatedMrr: "desc" } },
      where,
    }),
    prisma.app.findMany({
      where,
      select: {
        name: true,
        category: true,
        estimatedMrr: true,
        opportunityScore: true,
        downloads: true,
        price: true,
        hasIap: true,
        hasSubscriptions: true,
        rating: true,
      },
    }),
  ]);

  const categoryStatsFormatted = categoryStats.map((c) => ({
    category: c.category,
    count: c._count.category,
    avgMrr: c._avg.estimatedMrr ?? 0,
    maxMrr: c._max.estimatedMrr ?? 0,
  }));

  const monetizationBuckets: Record<string, { count: number; mrrSum: number }> = {
    "Free + IAP": { count: 0, mrrSum: 0 },
    Paid: { count: 0, mrrSum: 0 },
    "Paid + IAP": { count: 0, mrrSum: 0 },
  };

  for (const app of allApps) {
    const mrr = app.estimatedMrr ?? 0;
    if (app.price > 0 && app.hasIap) {
      monetizationBuckets["Paid + IAP"].count++;
      monetizationBuckets["Paid + IAP"].mrrSum += mrr;
    } else if (app.price > 0) {
      monetizationBuckets.Paid.count++;
      monetizationBuckets.Paid.mrrSum += mrr;
    } else if (app.hasIap) {
      monetizationBuckets["Free + IAP"].count++;
      monetizationBuckets["Free + IAP"].mrrSum += mrr;
    }
  }

  const monetizationStats = Object.entries(monetizationBuckets).map(([model, data]) => ({
    model,
    count: data.count,
    avgMrr: data.count > 0 ? Math.round(data.mrrSum / data.count) : 0,
  }));

  const scoreBuckets: Record<string, number> = {};
  for (let i = 0; i <= 90; i += 10) {
    scoreBuckets[`${i}-${i + 10}`] = 0;
  }

  for (const app of allApps) {
    const score = app.opportunityScore;
    if (score === null || score === undefined) continue;
    const bucket = Math.min(Math.floor(score / 10) * 10, 90);
    const key = `${bucket}-${bucket + 10}`;
    if (scoreBuckets[key] !== undefined) {
      scoreBuckets[key]++;
    }
  }

  const scoreDistribution = Object.entries(scoreBuckets).map(([range, count]) => ({ range, count }));

  const filteredApps = allApps
    .filter((a) => a.estimatedMrr !== null && a.estimatedMrr > 0)
    .sort((a, b) => (b.estimatedMrr ?? 0) - (a.estimatedMrr ?? 0))
    .slice(0, maxApps)
    .map((a) => ({
      name: a.name,
      category: a.category,
      estimatedMrr: a.estimatedMrr ?? 0,
      opportunityScore: a.opportunityScore ?? 0,
      downloads: a.downloads,
      price: a.price,
      hasIap: a.hasIap,
      hasSubscriptions: a.hasSubscriptions,
      rating: a.rating,
    }));

  return Response.json({
    categoryStats: categoryStatsFormatted,
    monetizationStats,
    scoreDistribution,
    apps: filteredApps,
    totalApps: allApps.length,
    displayCount: filteredApps.length,
  });
}

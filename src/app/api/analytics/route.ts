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

  const allApps = await prisma.app.findMany({
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
  });

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

  const categoryMap: Record<string, { count: number; mrrSum: number; ratingSum: number; scoreSum: number; maxMrr: number }> = {};
  for (const app of filteredApps) {
    if (!categoryMap[app.category]) {
      categoryMap[app.category] = { count: 0, mrrSum: 0, ratingSum: 0, scoreSum: 0, maxMrr: 0 };
    }
    const c = categoryMap[app.category];
    c.count++;
    c.mrrSum += app.estimatedMrr;
    c.ratingSum += app.rating;
    c.scoreSum += app.opportunityScore;
    if (app.estimatedMrr > c.maxMrr) c.maxMrr = app.estimatedMrr;
  }

  const categoryStats = Object.entries(categoryMap)
    .map(([category, c]) => ({
      category,
      count: c.count,
      avgMrr: Math.round(c.mrrSum / c.count),
      avgRating: c.ratingSum / c.count,
      avgScore: c.scoreSum / c.count,
      maxMrr: c.maxMrr,
    }))
    .sort((a, b) => b.avgMrr - a.avgMrr);

  const monetizationBuckets: Record<string, { count: number; mrrSum: number }> = {
    "Free + IAP": { count: 0, mrrSum: 0 },
    Paid: { count: 0, mrrSum: 0 },
    "Paid + IAP": { count: 0, mrrSum: 0 },
  };

  for (const app of filteredApps) {
    const mrr = app.estimatedMrr;
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

  const ratingBuckets = Array.from({ length: 5 }, (_, i) => ({
    rating: `${i + 1}★`,
    count: 0,
  }));
  for (const app of filteredApps) {
    const r = Math.round(app.rating);
    if (r >= 1 && r <= 5) ratingBuckets[r - 1].count++;
  }

  return Response.json({
    categoryStats,
    monetizationStats,
    ratingDistribution: ratingBuckets,
    apps: filteredApps,
    totalApps: allApps.length,
    displayCount: filteredApps.length,
  });
}

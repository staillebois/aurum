import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeOpportunity, validateTopApps } from "@/lib/ai-analytics";

export const dynamic = "force-dynamic";

const ANALYSIS_VERSION = 3;

interface FilterBody {
  minMrr?: string;
  maxMrr?: string;
  minScore?: string;
  maxScore?: string;
  minDownloads?: string;
  maxDownloads?: string;
  maxApps?: string;
}

function buildWhere(body: FilterBody): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (body.minMrr || body.maxMrr) {
    const range: Record<string, number> = {};
    if (body.minMrr) range.gte = parseFloat(body.minMrr);
    if (body.maxMrr) range.lte = parseFloat(body.maxMrr);
    where.estimatedMrr = range;
  }

  if (body.minScore || body.maxScore) {
    const range: Record<string, number> = {};
    if (body.minScore) range.gte = parseFloat(body.minScore);
    if (body.maxScore) range.lte = parseFloat(body.maxScore);
    where.opportunityScore = range;
  }

  if (body.minDownloads || body.maxDownloads) {
    const range: Record<string, number> = {};
    if (body.minDownloads) range.gte = parseInt(body.minDownloads, 10);
    if (body.maxDownloads) range.lte = parseInt(body.maxDownloads, 10);
    where.downloads = range;
  }

  return where;
}

function fetchApps(where: Record<string, unknown>, maxApps: number) {
  return prisma.app.findMany({
    where,
    select: {
      name: true,
      category: true,
      publisher: true,
      estimatedMrr: true,
      opportunityScore: true,
      downloads: true,
      price: true,
      hasIap: true,
      hasSubscriptions: true,
      rating: true,
      _count: { select: { competitors: true } },
    },
    orderBy: { opportunityScore: "desc" },
    take: maxApps,
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function filterAndMapApps(apps: Array<any>) {
  return apps
    .filter((a) => a.estimatedMrr !== null && a.estimatedMrr > 0)
    .map((a) => ({
      name: a.name,
      category: a.category,
      publisher: a.publisher,
      estimatedMrr: a.estimatedMrr ?? 0,
      opportunityScore: a.opportunityScore ?? 0,
      downloads: a.downloads,
      price: a.price,
      hasIap: a.hasIap,
      hasSubscriptions: a.hasSubscriptions,
      rating: a.rating,
      competitorCount: a._count?.competitors ?? 0,
    }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function buildFilterDesc(body: FilterBody): string | undefined {
  const parts: string[] = [];
  if (body.minMrr) parts.push(`MRR >= $${body.minMrr}`);
  if (body.maxMrr) parts.push(`MRR <= $${body.maxMrr}`);
  if (body.minScore) parts.push(`Score >= ${body.minScore}`);
  if (body.maxScore) parts.push(`Score <= ${body.maxScore}`);
  if (body.minDownloads) parts.push(`Downloads >= ${body.minDownloads}`);
  if (body.maxDownloads) parts.push(`Downloads <= ${body.maxDownloads}`);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function parseFilterFloat(v: string | undefined): number | undefined {
  return v !== undefined ? parseFloat(v) : undefined;
}

function parseFilterInt(v: string | undefined): number | undefined {
  return v !== undefined ? parseInt(v, 10) : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractExtendedFields(obj: any) {
  return {
    marketOverview: (obj.marketOverview as string) ?? null,
    categoryReason: (obj.categoryReason as string) ?? null,
    topApps: obj.topApps ? JSON.stringify(obj.topApps) : null,
    monetizationAdvice: (obj.monetizationAdvice as string) ?? null,
    differentiationOpps: obj.differentiationOpportunities ? JSON.stringify(obj.differentiationOpportunities) : null,
    riskFactors: obj.riskFactors ? JSON.stringify(obj.riskFactors) : null,
    featurePriorities: obj.featurePriorities ? JSON.stringify(obj.featurePriorities) : null,
    targetAudience: (obj.targetAudience as string) ?? null,
  };
}

const CACHE_TTL_MS = 3600_000; // 1 hour

function buildCacheWhere(body: FilterBody, maxApps: number): Record<string, unknown> {
  return {
    filterMinMrr: body.minMrr ? parseFloat(body.minMrr) : null,
    filterMaxMrr: body.maxMrr ? parseFloat(body.maxMrr) : null,
    filterMinScore: body.minScore ? parseFloat(body.minScore) : null,
    filterMaxScore: body.maxScore ? parseFloat(body.maxScore) : null,
    filterMinDownloads: body.minDownloads ? parseInt(body.minDownloads, 10) : null,
    filterMaxDownloads: body.maxDownloads ? parseInt(body.maxDownloads, 10) : null,
    filterMaxApps: maxApps === 500 ? null : maxApps,
    createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
    analysisVersion: ANALYSIS_VERSION,
  };
}

export async function POST(request: NextRequest) {
  const body: FilterBody = await request.json();
  const maxApps = Math.min(5000, Math.max(1, parseInt(body.maxApps ?? "500", 10) || 500));

  const cached = await prisma.aIAnalyticsReport.findFirst({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: buildCacheWhere(body, maxApps) as any,
    orderBy: { createdAt: "desc" },
  });

  if (cached) {
    const recommendation = {
      marketOverview: cached.marketOverview ?? "",
      recommendedCategory: cached.recommendedCategory,
      categoryReason: cached.categoryReason ?? "",
      topApps: cached.topApps ? JSON.parse(cached.topApps) : [],
      topApp: { name: cached.topAppName, reason: cached.topAppReason },
      monetizationAdvice: cached.monetizationAdvice ?? "",
      keyInsights: JSON.parse(cached.keyInsights),
      differentiationOpportunities: cached.differentiationOpps ? JSON.parse(cached.differentiationOpps) : [],
      riskFactors: cached.riskFactors ? JSON.parse(cached.riskFactors) : [],
      featurePriorities: cached.featurePriorities ? JSON.parse(cached.featurePriorities) : [],
      targetAudience: cached.targetAudience ?? "",
      improvementThemes: JSON.parse(cached.improvementThemes),
    };

    return Response.json({
      id: cached.id,
      recommendation,
      analyzedCount: cached.analyzedCount,
      modelName: cached.modelName,
    });
  }

  const startTime = Date.now();
  const where = buildWhere(body);
  const apps = await fetchApps(where, maxApps);
  const filtered = filterAndMapApps(apps);

  if (filtered.length === 0) {
    return Response.json({
      id: null,
      recommendation: {
        recommendedCategory: "No data",
        topApp: { name: "N/A", reason: "No apps match the current filters." },
        keyInsights: ["No apps match the current filter criteria."],
        improvementThemes: [],
      },
      analyzedCount: 0,
    });
  }

  const filterDesc = buildFilterDesc(body);
  const { recommendation, modelName } = await analyzeOpportunity(filtered, filterDesc);

  const validNames = filtered.map((a) => a.name);
  const validated = validateTopApps(recommendation.topApps, recommendation.topApp, validNames, filtered);
  recommendation.topApps = validated.topApps;
  recommendation.topApp = validated.topApp;

  const appNames = recommendation.topApps.map((a) => a.name);
  if (appNames.length > 0) {
    const dbApps = await prisma.app.findMany({
      where: { name: { in: appNames } },
      select: { name: true, estimatedMrr: true, opportunityScore: true, rating: true, downloads: true },
    });
    const dbMap = new Map(dbApps.map((a) => [a.name, a]));
    recommendation.topApps = recommendation.topApps.map((a) => {
      const db = dbMap.get(a.name);
      return { ...a, mrr: db?.estimatedMrr ?? a.mrr, score: db?.opportunityScore ?? a.score, rating: db?.rating ?? 0, downloads: db?.downloads ?? 0 };
    });
  }

  const report = await prisma.aIAnalyticsReport.create({
    data: {
      filterMinMrr: parseFilterFloat(body.minMrr),
      filterMaxMrr: parseFilterFloat(body.maxMrr),
      filterMinScore: parseFilterFloat(body.minScore),
      filterMaxScore: parseFilterFloat(body.maxScore),
      filterMinDownloads: parseFilterInt(body.minDownloads),
      filterMaxDownloads: parseFilterInt(body.maxDownloads),
      filterMaxApps: maxApps === 500 ? null : maxApps,
      analyzedCount: filtered.length,
      recommendedCategory: recommendation.recommendedCategory,
      topAppName: recommendation.topApp.name,
      topAppReason: recommendation.topApp.reason,
      keyInsights: JSON.stringify(recommendation.keyInsights),
      improvementThemes: JSON.stringify(recommendation.improvementThemes),
      ...extractExtendedFields(recommendation),
      analysisDurationMs: Date.now() - startTime,
      analysisVersion: ANALYSIS_VERSION,
      modelName,
    },
  });

  return Response.json({
    id: report.id,
    recommendation,
    analyzedCount: filtered.length,
    modelName,
  });
}

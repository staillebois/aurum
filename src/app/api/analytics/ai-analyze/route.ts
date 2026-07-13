import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeOpportunity } from "@/lib/ai-analytics";

export const dynamic = "force-dynamic";

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
      estimatedMrr: true,
      opportunityScore: true,
      downloads: true,
      price: true,
      hasIap: true,
      hasSubscriptions: true,
      rating: true,
    },
    orderBy: { opportunityScore: "desc" },
    take: maxApps,
  });
}

function filterAndMapApps(apps: Array<{ name: string; category: string; estimatedMrr: number | null; opportunityScore: number | null; downloads: number; price: number; hasIap: boolean; hasSubscriptions: boolean; rating: number }>) {
  return apps
    .filter((a) => a.estimatedMrr !== null && a.estimatedMrr > 0)
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
}

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

export async function POST(request: NextRequest) {
  const body: FilterBody = await request.json();
  const maxApps = Math.min(5000, Math.max(1, parseInt(body.maxApps ?? "500", 10) || 500));

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

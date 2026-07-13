import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeOpportunity } from "@/lib/ai-analytics";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const report = await prisma.aIAnalyticsReport.findUnique({ where: { id } });

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json({
    id: report.id,
    createdAt: report.createdAt.toISOString(),
    filters: {
      minMrr: report.filterMinMrr,
      maxMrr: report.filterMaxMrr,
      minScore: report.filterMinScore,
      maxScore: report.filterMaxScore,
      minDownloads: report.filterMinDownloads,
      maxDownloads: report.filterMaxDownloads,
      maxApps: report.filterMaxApps,
    },
    analyzedCount: report.analyzedCount,
    recommendation: {
      recommendedCategory: report.recommendedCategory,
      topApp: { name: report.topAppName, reason: report.topAppReason },
      keyInsights: JSON.parse(report.keyInsights),
      improvementThemes: JSON.parse(report.improvementThemes),
    },
    modelName: report.modelName,
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const original = await prisma.aIAnalyticsReport.findUnique({ where: { id } });

  if (!original) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  const where: Record<string, unknown> = {};
  if (original.filterMinMrr !== null || original.filterMaxMrr !== null) {
    const range: Record<string, number> = {};
    if (original.filterMinMrr !== null) range.gte = original.filterMinMrr;
    if (original.filterMaxMrr !== null) range.lte = original.filterMaxMrr;
    where.estimatedMrr = range;
  }
  if (original.filterMinScore !== null || original.filterMaxScore !== null) {
    const range: Record<string, number> = {};
    if (original.filterMinScore !== null) range.gte = original.filterMinScore;
    if (original.filterMaxScore !== null) range.lte = original.filterMaxScore;
    where.opportunityScore = range;
  }
  if (original.filterMinDownloads !== null || original.filterMaxDownloads !== null) {
    const range: Record<string, number> = {};
    if (original.filterMinDownloads !== null) range.gte = original.filterMinDownloads;
    if (original.filterMaxDownloads !== null) range.lte = original.filterMaxDownloads;
    where.downloads = range;
  }

  const maxApps = original.filterMaxApps ?? 500;

  const apps = await prisma.app.findMany({
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

  const filtered = apps
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

  if (filtered.length === 0) {
    return Response.json({
      id: null,
      recommendation: {
        recommendedCategory: "No data",
        topApp: { name: "N/A", reason: "No apps match the filters." },
        keyInsights: ["No apps match the current filter criteria."],
        improvementThemes: [],
      },
      analyzedCount: 0,
    });
  }

  const filterParts: string[] = [];
  if (original.filterMinMrr !== null) filterParts.push(`MRR >= $${original.filterMinMrr}`);
  if (original.filterMaxMrr !== null) filterParts.push(`MRR <= $${original.filterMaxMrr}`);
  if (original.filterMinScore !== null) filterParts.push(`Score >= ${original.filterMinScore}`);
  if (original.filterMaxScore !== null) filterParts.push(`Score <= ${original.filterMaxScore}`);
  if (original.filterMinDownloads !== null) filterParts.push(`Downloads >= ${original.filterMinDownloads}`);
  if (original.filterMaxDownloads !== null) filterParts.push(`Downloads <= ${original.filterMaxDownloads}`);
  const filterDesc = filterParts.length > 0 ? filterParts.join(", ") : undefined;

  const { recommendation, modelName } = await analyzeOpportunity(filtered, filterDesc);

  const report = await prisma.aIAnalyticsReport.create({
    data: {
      filterMinMrr: original.filterMinMrr,
      filterMaxMrr: original.filterMaxMrr,
      filterMinScore: original.filterMinScore,
      filterMaxScore: original.filterMaxScore,
      filterMinDownloads: original.filterMinDownloads,
      filterMaxDownloads: original.filterMaxDownloads,
      filterMaxApps: original.filterMaxApps,
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

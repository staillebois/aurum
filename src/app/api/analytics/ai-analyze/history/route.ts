import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const reports = await prisma.aIAnalyticsReport.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      filterMinMrr: true,
      filterMaxMrr: true,
      filterMinScore: true,
      filterMaxScore: true,
      filterMinDownloads: true,
      filterMaxDownloads: true,
      filterMaxApps: true,
      analyzedCount: true,
      recommendedCategory: true,
      topAppName: true,
    },
  });

  return Response.json({ reports });
}

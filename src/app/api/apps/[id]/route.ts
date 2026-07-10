import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const app = await prisma.app.findUnique({
    where: { id },
    include: {
      reviews: {
        select: { id: true, text: true, rating: true, userName: true, createdAt: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      competitors: {
        select: { id: true, name: true, icon: true, downloads: true, estimatedMrr: true },
      },
    },
  });

  if (!app) {
    return Response.json({ error: "App not found" }, { status: 404 });
  }

  const aiAnalysis = app.aiSummary
    ? {
        summary: app.aiSummary,
        painPoints: safeJsonParse(app.painPoints),
        improvements: safeJsonParse(app.improvements),
        analyzedAt: app.aiAnalyzedAt,
      }
    : null;

  return Response.json({ ...app, aiAnalysis });
}

function safeJsonParse(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

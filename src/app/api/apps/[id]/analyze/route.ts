import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeApp } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: { model?: string } = await request.json().catch(() => ({}));

  const app = await prisma.app.findUnique({
    where: { id },
    include: {
      reviews: {
        select: { text: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!app) {
    return Response.json({ error: "App not found" }, { status: 404 });
  }

  const reviewTexts = app.reviews
    .map((r) => r.text)
    .filter((t) => t.length > 20);

  const analysis = await analyzeApp(app.name, app.description, reviewTexts, body.model);

  await prisma.app.update({
    where: { id: app.id },
    data: {
      aiSummary: analysis.summary,
      painPoints: JSON.stringify(analysis.painPoints),
      improvements: JSON.stringify(analysis.improvements),
      modelName: body.model ?? null,
      aiAnalyzedAt: new Date(),
    },
  });

  return Response.json({ analysis, modelName: body.model ?? null });
}

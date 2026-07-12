import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category = searchParams.get("category");
  const price = searchParams.get("price");
  const minDownloads = searchParams.get("minDownloads");
  const minMrr = searchParams.get("minMrr");
  const analyzed = searchParams.get("analyzed");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") ?? "estimatedMrr";
  const order = searchParams.get("order") ?? "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? "50", 10) || 50));

  const where: Record<string, unknown> = {};

  if (category) {
    where.category = category;
  }

  if (price === "free") {
    where.price = 0;
  } else if (price === "paid") {
    where.price = { gt: 0 };
  }

  if (minDownloads) {
    const min = parseInt(minDownloads, 10);
    if (!isNaN(min)) {
      where.downloads = { gte: min };
    }
  }

  if (minMrr) {
    const min = parseFloat(minMrr);
    if (!isNaN(min)) {
      where.estimatedMrr = { gte: min };
    }
  }

  if (analyzed === "true") {
    where.aiAnalyzedAt = { not: null };
  }

  if (search) {
    where.name = { contains: search };
  }

  const orderBy: Record<string, string> = {};
  const allowedSortFields = ["estimatedMrr", "downloads", "price", "rating", "name", "opportunityScore"];
  const field = allowedSortFields.includes(sortBy) ? sortBy : "estimatedMrr";
  orderBy[field] = order === "asc" ? "asc" : "desc";

  const skip = (page - 1) * perPage;

  const [data, total] = await Promise.all([
    prisma.app.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        icon: true,
        category: true,
        publisher: true,
        downloads: true,
        price: true,
        hasIap: true,
        hasSubscriptions: true,
        rating: true,
        reviewCount: true,
        estimatedMrr: true,
        opportunityScore: true,
        aiAnalyzedAt: true,
      },
    }),
    prisma.app.count({ where }),
  ]);

  return Response.json({
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

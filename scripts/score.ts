import { prisma } from "../src/lib/prisma";
import { estimateMrr, calculateOpportunityScore } from "../src/lib/scoring";

async function scoreApps() {
  console.log("Scoring all apps...\n");

  const apps = await prisma.app.findMany({
    include: {
      reviews: true,
      competitors: true,
    },
  });

  console.log(`Found ${apps.length} apps to score.\n`);

  let updated = 0;

  for (const app of apps) {
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
      where: { id: app.id },
      data: { estimatedMrr: mrr, opportunityScore: score },
    });

    console.log(`  ${app.name.padEnd(40)} MRR: $${String(mrr).padStart(10)}  Score: ${score}`);
    updated++;
  }

  console.log(`\nDone! Scored ${updated} apps.`);
}

scoreApps();

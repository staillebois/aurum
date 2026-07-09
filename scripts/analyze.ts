import { prisma } from "../src/lib/prisma";
import { analyzeApp } from "../src/lib/ai";

const BATCH_SIZE = 5;

async function analyzeAllApps() {
  console.log("Starting AI analysis of all apps...\n");

  const apps = await prisma.app.findMany({
    include: { reviews: true },
    orderBy: { estimatedMrr: "desc" },
  });

  console.log(`Found ${apps.length} apps to analyze.\n`);

  let analyzed = 0;
  let errors = 0;

  for (let i = 0; i < apps.length; i += BATCH_SIZE) {
    const batch = apps.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (app) => {
        const reviewTexts = app.reviews
          .filter((r) => r.text.length > 20)
          .slice(0, 20)
          .map((r) => r.text);

        console.log(`  Analyzing: ${app.name}...`);
        const analysis = await analyzeApp(app.name, app.description, reviewTexts);

        await prisma.app.update({
          where: { id: app.id },
          data: {
            aiSummary: analysis.summary,
            painPoints: JSON.stringify(analysis.painPoints),
            improvements: JSON.stringify(analysis.improvements),
            aiAnalyzedAt: new Date(),
          },
        });

        console.log(`    ✓ Summary: ${analysis.summary.slice(0, 80)}...`);
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        analyzed++;
      } else {
        console.error(`    ✗ Error: ${result.reason}`);
        errors++;
      }
    }

    console.log(`  Progress: ${analyzed}/${apps.length} analyzed\n`);
  }

  console.log(`\nDone! ${analyzed} apps analyzed, ${errors} errors.`);
}

analyzeAllApps();

import { prisma } from "../src/lib/prisma";
import { analyzeApp, DEFAULT_MODEL } from "../src/lib/ai";

const BATCH_SIZE = 1;

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let offset: number | null = null;
  let clean = false;
  let showStatus = false;
  let reAnalyzeFallback = false;
  let model: string | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--limit":
        limit = parseInt(args[++i], 10);
        break;
      case "--offset":
        offset = parseInt(args[++i], 10);
        break;
      case "--clean":
        clean = true;
        break;
      case "--re-analyze-fallback":
        reAnalyzeFallback = true;
        break;
      case "--status":
      case "--stats":
        showStatus = true;
        break;
      case "--model":
        model = args[++i];
        break;
    }
  }

  return { limit, offset, clean, showStatus, reAnalyzeFallback, model };
}

async function main() {
  const { limit, offset: explicitOffset, clean, showStatus, reAnalyzeFallback, model } = parseArgs();

  const activeModel = model ?? DEFAULT_MODEL;

  if (showStatus) {
    const total = await prisma.app.count();
    const analyzed = await prisma.app.count({ where: { aiSummary: { not: null } } });
    const remaining = total - analyzed;
    const statuses = await prisma.app.groupBy({
      by: ["modelName"],
      where: { aiSummary: { not: null } },
      _count: true,
    });
    console.log(`Apps total:      ${total}`);
    console.log(`With aiSummary:  ${analyzed}`);
    console.log(`Without:         ${remaining}`);
    if (statuses.length > 0) {
      console.log("\nBy model:");
      for (const s of statuses) {
        console.log(`  ${s.modelName ?? "unknown"}: ${s._count}`);
      }
    }
    await prisma.$disconnect();
    return;
  }

  console.log(`Starting AI analysis using model: ${activeModel}\n`);

  if (clean) {
    console.log("Cleaning existing analysis data...");
    await prisma.app.updateMany({
      data: {
        aiSummary: null,
        painPoints: null,
        improvements: null,
        modelName: null,
        aiAnalyzedAt: null,
      },
    });
    console.log("Done. All analysis fields cleared.\n");
  }

  if (reAnalyzeFallback) {
    const fallbackPain = '["No pain points identified."]';
    const fallbackImprove = '["No improvements suggested."]';
    const fallbackApps = await prisma.app.findMany({
      where: {
        OR: [
          { painPoints: fallbackPain },
          { improvements: fallbackImprove },
        ],
      },
      select: { id: true, name: true },
    });
    if (fallbackApps.length > 0) {
      console.log(`Found ${fallbackApps.length} apps with fallback values, clearing for re-analysis:`);
      for (const app of fallbackApps) {
        console.log(`  - ${app.name}`);
      }
      await prisma.app.updateMany({
        where: { id: { in: fallbackApps.map((a) => a.id) } },
        data: {
          aiSummary: null,
          painPoints: null,
          improvements: null,
          modelName: null,
          aiAnalyzedAt: null,
        },
      });
      console.log();
    } else {
      console.log("No apps with fallback values found.\n");
    }
  }

  const totalUnanalyzed = await prisma.app.count({
    where: { aiSummary: null },
  });

  if (totalUnanalyzed === 0) {
    console.log("All apps already analyzed. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  const apps = await prisma.app.findMany({
    where: { aiSummary: null },
    include: { reviews: true },
    orderBy: { estimatedMrr: "desc" },
    skip: explicitOffset ?? 0,
    take: limit ?? undefined,
  });

  const total = apps.length;
  if (total === 0) {
    console.log("No more apps to analyze at this offset.");
    await prisma.$disconnect();
    return;
  }

  const batchLabel = limit ? ` (batch of ${limit})` : "";
  console.log(`Found ${total} apps to analyze${batchLabel}.\n`);

  let analyzed = 0;
  let errors = 0;
  const startTime = Date.now();
  let running = true;

  process.on("SIGINT", () => {
    running = false;
    process.stdout.write("\n\nGracefully stopping... (apps already saved in DB)\n");
    process.exit(0);
  });

  function renderProgress(status: string) {
    const pct = total > 0 ? ((analyzed + errors) / total * 100).toFixed(1) : "0.0";
    const elapsed = Date.now() - startTime;
    const done = analyzed + errors;
    const eta = done > 0
      ? formatTime((elapsed / done) * (total - done))
      : "--:--";
    const line = `  [${done}/${total}] ${pct}% | elapsed ${formatTime(elapsed)} | ETA ${eta} | errors ${errors} | ${status}`;
    process.stdout.write(`\r${line.padEnd(100)}`);
  }

  renderProgress("starting...");

  for (let i = 0; i < total && running; i += BATCH_SIZE) {
    const batch = apps.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (app) => {
        renderProgress(`analyzing ${app.name}...`);

        const reviewTexts = app.reviews
          .filter((r) => r.text.length > 20)
          .slice(0, 20)
          .map((r) => r.text);

        const analysis = await analyzeApp(app.name, app.description, reviewTexts, activeModel);

        await prisma.app.update({
          where: { id: app.id },
          data: {
            aiSummary: analysis.summary,
            painPoints: JSON.stringify(analysis.painPoints),
            improvements: JSON.stringify(analysis.improvements),
            modelName: activeModel,
            aiAnalyzedAt: new Date(),
          },
        });
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        analyzed++;
      } else {
        errors++;
        console.error(`\nError: ${result.reason}`);
      }
    }

    renderProgress(`${analyzed} done, ${errors} errors`);
  }

  process.stdout.write("\n\n");
  const totalTime = formatTime(Date.now() - startTime);
  console.log(`Done! ${analyzed} apps analyzed, ${errors} errors. Total time: ${totalTime}`);
}

main();

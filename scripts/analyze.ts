import { prisma } from "../src/lib/prisma";
import { analyzeApp } from "../src/lib/ai";

const BATCH_SIZE = 1;
const STATE_FILE = ".analyze-progress.json";

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
  let reset = false;
  let showStatus = false;

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
      case "--status":
      case "--stats":
        showStatus = true;
        break;
      case "--reset":
        reset = true;
        break;
    }
  }

  return { limit, offset, clean, reset, showStatus };
}

function readState(): number | null {
  try {
    const data = JSON.parse(require("fs").readFileSync(STATE_FILE, "utf-8"));
    return typeof data.offset === "number" ? data.offset : null;
  } catch {
    return null;
  }
}

function writeState(offset: number) {
  try {
    require("fs").writeFileSync(STATE_FILE, JSON.stringify({ offset }) + "\n");
  } catch {
    // ignore write errors
  }
}

function clearState() {
  try {
    require("fs").unlinkSync(STATE_FILE);
  } catch {
    // ignore
  }
}

async function main() {
  const { limit, offset: explicitOffset, clean, reset, showStatus } = parseArgs();

  if (showStatus) {
    const total = await prisma.app.count();
    const analyzed = await prisma.app.count({ where: { aiSummary: { not: null } } });
    const remaining = total - analyzed;
    console.log(`Apps total:      ${total}`);
    console.log(`With aiSummary:  ${analyzed}`);
    console.log(`Without:         ${remaining}`);
    await prisma.$disconnect();
    return;
  }

  console.log("Starting AI analysis of all apps...\n");

  if (clean) {
    console.log("Cleaning existing analysis data...");
    await prisma.app.updateMany({
      data: {
        aiSummary: null,
        painPoints: null,
        improvements: null,
        aiAnalyzedAt: null,
      },
    });
    console.log("Done. All analysis fields cleared.\n");
    clearState();
  }

  if (reset) {
    clearState();
    console.log("Progress state cleared.\n");
  }

  let currentOffset = explicitOffset ?? readState() ?? 0;

  if (explicitOffset === null && currentOffset > 0) {
    console.log(`Resuming from offset ${currentOffset} (previous session).\n`);
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
    skip: currentOffset,
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
    writeState(currentOffset + analyzed + errors);
    process.stdout.write("\n\nSaving progress and exiting...\n");
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
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        analyzed++;
      } else {
        errors++;
      }
    }

    renderProgress(`${analyzed} done, ${errors} errors`);
  }

  writeState(currentOffset + analyzed + errors);

  process.stdout.write("\n\n");
  const totalTime = formatTime(Date.now() - startTime);
  console.log(`Done! ${analyzed} apps analyzed, ${errors} errors. Total time: ${totalTime}`);
}

main();

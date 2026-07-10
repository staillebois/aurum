import { writeFileSync } from "fs";
import { resolve } from "path";
import { prisma } from "../src/lib/prisma";
import { analyzeApp } from "../src/lib/ai";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface AnalysisDetail {
  ok: boolean;
  time: number;
  summary: string;
  painPoints: string[];
  improvements: string[];
}

interface AppResult {
  name: string;
  estimatedMrr: number | null;
  models: Record<string, AnalysisDetail>;
}

interface ModelStats {
  model: string;
  success: number;
  errors: number;
  totalTime: number;
  totalChars: number;
  completeAnalyses: number;
}

interface JsonReport {
  apps: AppResult[];
  summary: {
    models: Record<string, { success: number; errors: number; avgTime: number; avgLength: number; completePct: number }>;
    recommended: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function isComplete(a: AnalysisDetail): boolean {
  return (
    a.painPoints.length > 0 &&
    a.improvements.length > 0 &&
    a.painPoints[0] !== "No pain points identified." &&
    a.improvements[0] !== "No improvements suggested."
  );
}

/* ------------------------------------------------------------------ */
/*  Args                                                              */
/* ------------------------------------------------------------------ */

function parseArgs() {
  const args = process.argv.slice(2);
  let appCount = 10;
  let modelsList = ["qwen2.5-coder:7b", "qwen3:8b", "mistral:7b"];
  let verbose = false;
  let json = false;
  let outputPath = "benchmark-results.json";

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--apps":
        appCount = parseInt(args[++i], 10);
        break;
      case "--models":
        modelsList = args[++i].split(",").map((m) => m.trim());
        break;
      case "--verbose":
        verbose = true;
        break;
      case "--json":
        json = true;
        break;
      case "--output":
        outputPath = args[++i];
        break;
    }
  }

  return { appCount, modelsList, verbose, json, outputPath };
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

async function main() {
  const { appCount, modelsList, verbose, json, outputPath } = parseArgs();

  console.log("=".repeat(70));
  console.log("  Model Benchmark");
  console.log(`  Apps:            ${appCount}`);
  console.log(`  Models:          ${modelsList.join(", ")}`);
  if (verbose) console.log("  Mode:            verbose (full content)");
  if (json) console.log(`  JSON output:     ${outputPath}`);
  console.log("=".repeat(70));

  const apps = await prisma.app.findMany({
    include: { reviews: true },
    orderBy: { estimatedMrr: "desc" },
    take: appCount,
  });

  console.log(`\nSelected ${apps.length} apps.\n`);

  /* ---- analyse every app × model ---- */
  const appResults: AppResult[] = [];
  const modelStatsMap: Record<string, ModelStats> = {};

  for (const model of modelsList) {
    modelStatsMap[model] = {
      model,
      success: 0,
      errors: 0,
      totalTime: 0,
      totalChars: 0,
      completeAnalyses: 0,
    };
  }

  for (let ai = 0; ai < apps.length; ai++) {
    const app = apps[ai];
    const appRes: AppResult = {
      name: app.name,
      estimatedMrr: app.estimatedMrr,
      models: {},
    };

    if (verbose) {
      console.log("");
      console.log("=".repeat(70));
      console.log(`  App ${ai + 1}/${apps.length}: ${app.name}${app.estimatedMrr ? ` ($${app.estimatedMrr.toLocaleString()}/mo)` : ""}`);
      console.log("=".repeat(70));
    }

    const reviewTexts = app.reviews
      .filter((r) => r.text.length > 20)
      .slice(0, 20)
      .map((r) => r.text);

    for (const model of modelsList) {
      const stats = modelStatsMap[model];
      const detail: AnalysisDetail = { ok: false, time: 0, summary: "", painPoints: [], improvements: [] };

      try {
        const start = Date.now();
        const analysis = await analyzeApp(app.name, app.description, reviewTexts, model);
        const elapsed = Date.now() - start;

        detail.ok = true;
        detail.time = elapsed;
        detail.summary = analysis.summary;
        detail.painPoints = analysis.painPoints;
        detail.improvements = analysis.improvements;

        stats.success++;
        stats.totalTime += elapsed;
        stats.totalChars +=
          analysis.summary.length +
          analysis.painPoints.reduce((s, p) => s + p.length, 0) +
          analysis.improvements.reduce((s, p) => s + p.length, 0);

        if (isComplete(detail)) stats.completeAnalyses++;
      } catch {
        stats.errors++;
      }

      appRes.models[model] = detail;

      if (verbose) {
        const d = detail;
        const label = d.ok ? "OK" : "ERR";
        const time = d.ok ? fmt(d.time) : "-";
        const painCount = d.painPoints.length;
        const impCount = d.improvements.length;
        console.log(`\n  --- ${model} (${time}, ${painCount}p / ${impCount}i) [${label}] ---`);
        if (d.ok) {
          console.log(`  SUMMARY: ${d.summary}`);
          if (d.painPoints.length > 0) {
            console.log("  PAIN POINTS:");
            d.painPoints.forEach((p) => console.log(`    - ${p}`));
          }
          if (d.improvements.length > 0) {
            console.log("  IMPROVEMENTS:");
            d.improvements.forEach((p) => console.log(`    - ${p}`));
          }
        } else {
          console.log("  (error or no output)");
        }
      }
    }

    appResults.push(appRes);
  }

  /* ---- summary table ---- */
  const results = Object.values(modelStatsMap);

  console.log("\n\n" + "=".repeat(70));
  console.log("  BENCHMARK RESULTS");
  console.log("=".repeat(70));
  console.log();
  console.log(
    `${"Model".padEnd(28)} ${"OK".padEnd(6)} ${"ERR".padEnd(6)} ${"Avg Time".padEnd(10)} ${"Avg Len".padEnd(10)} ${"Complete%".padEnd(10)}`
  );
  console.log("-".repeat(70));

  for (const r of results) {
    const avgTime = r.success > 0 ? fmt(r.totalTime / r.success) : "-";
    const avgLen = r.success > 0 ? Math.round(r.totalChars / r.success) : 0;
    const completePct = r.success > 0 ? ((r.completeAnalyses / r.success) * 100).toFixed(1) : "0.0";
    console.log(
      `${r.model.padEnd(28)} ${String(r.success).padEnd(6)} ${String(r.errors).padEnd(6)} ${String(avgTime).padEnd(10)} ${String(avgLen).padEnd(10)} ${(completePct + "%").padEnd(10)}`
    );
  }

  console.log("\n" + "-".repeat(70));
  console.log("  Per-model detail (incomplete analyses):");
  console.log();

  for (const r of results) {
    const incomplete: string[] = [];
    for (const ar of appResults) {
      const d = ar.models[r.model];
      if (d.ok && !isComplete(d)) {
        incomplete.push(`${ar.name} (${d.painPoints.length}p / ${d.improvements.length}i)`);
      }
    }
    if (incomplete.length > 0) {
      console.log(`  ${r.model}:`);
      incomplete.forEach((s) => console.log(`    - ${s}`));
    } else {
      console.log(`  ${r.model}: all ${appResults.length} apps complete`);
    }
  }

  const best = results.reduce((best, cur) => {
    const bestScore = best.completeAnalyses / Math.max(best.success, 1);
    const curScore = cur.completeAnalyses / Math.max(cur.success, 1);
    if (curScore > bestScore) return cur;
    if (curScore === bestScore && cur.totalTime < best.totalTime) return cur;
    return best;
  }, results[0]);

  console.log();
  console.log("=".repeat(70));
  console.log(`  RECOMMENDED: ${best.model} (${((best.completeAnalyses / Math.max(best.success, 1)) * 100).toFixed(1)}% complete, fastest)`);
  console.log("=".repeat(70));

  /* ---- JSON output ---- */
  if (json) {
    const summary: JsonReport["summary"] = { models: {}, recommended: best.model };

    for (const r of results) {
      summary.models[r.model] = {
        success: r.success,
        errors: r.errors,
        avgTime: r.success > 0 ? r.totalTime / r.success : 0,
        avgLength: r.success > 0 ? Math.round(r.totalChars / r.success) : 0,
        completePct: r.success > 0 ? parseFloat(((r.completeAnalyses / r.success) * 100).toFixed(1)) : 0,
      };
    }

    const report: JsonReport = { apps: appResults, summary };
    const absPath = resolve(outputPath);
    writeFileSync(absPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`\nJSON report written to ${absPath}`);
  }

  await prisma.$disconnect();
}

main();

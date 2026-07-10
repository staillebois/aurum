# Improvement: Model benchmarking script

## Summary

Create a dedicated `scripts/benchmark.ts` that runs the same N apps through M different Ollama models and produces a comparison report. This lets the user objectively determine which model produces the best analysis for their use case by comparing both stats and actual output content.

## Motivation

With multi-model support in place, there is no easy way to compare model quality side-by-side. Manually running `analyze.ts` multiple times with different `--model` flags and checking the database is tedious. A benchmarking script automates this: it runs the same prompt through every specified model on the same set of apps, then reports completion rate, speed, token usage, and output quality metrics — plus the full text output for qualitative comparison.

Tests on Intel Core Ultra 7 155H show 7-8B models deliver ~8-12 tok/s. The benchmark will provide real-world throughput data.

---

## User Story — Model comparison benchmark

**As a** developer
**I want** a single command that runs N apps through M models and produces both stats and full content output
**So that** I can pick the best model for app review analysis by comparing numbers AND actual text quality.

### Tasks

- [x] Create `scripts/benchmark.ts` (basic stats version)
- [x] Accept `--apps <N>` (number of apps to test, default: 10)
- [x] Accept `--models <list>` (comma-separated model names, default: `qwen2.5-coder:7b,qwen3:8b,mistral:7b`)
- [x] For each model, analyze the same apps and collect:
  - Success / error count
  - Average time per app
  - Average response length (chars / items)
  - Whether all 3 sections (summary, pain points, improvements) were populated
- [x] Print a comparison table to stdout with columns: Model | Success | Avg Time | Avg Length | Complete %
- [x] Print per-model detail: list of apps where analysis was incomplete (fallback values)
- [x] Show recommended model at the end based on best "complete %" / "avg time" tradeoff
- [ ] Add `--verbose` flag: print full analysis content (summary, pain points, improvements) for every app × model combination
- [ ] Add `--json` flag: write a structured JSON file with all results (default: `benchmark-results.json`)
- [ ] Add `--output <path>` flag: specify JSON output path (default: `benchmark-results.json`)
- [ ] Store full analysis data in memory to support both verbose and JSON output
- [ ] In verbose mode, group by app (not by model) so each app shows all models side-by-side

### Validation

- [ ] `npm run benchmark -- --apps 3 --models qwen3:8b,mistral:7b` runs basic stats mode
- [ ] `npm run benchmark -- --apps 3 --models qwen3:8b,mistral:7b --verbose` prints full analysis content
- [ ] `npm run benchmark -- --apps 3 --models qwen3:8b,mistral:7b --json` generates `benchmark-results.json`
- [ ] `npm run benchmark -- --apps 3 --models qwen3:8b,mistral:7b --verbose --json` does both
- [ ] JSON file contains full text output for every app × model pair
- [ ] No TypeScript / build errors

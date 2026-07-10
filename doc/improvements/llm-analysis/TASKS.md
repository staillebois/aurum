# Improvement: LLM-powered analysis script

## Summary

Refactor `scripts/generate-analysis.ts` to use Ollama (`src/lib/ai.ts`) exclusively instead of the programmatic keyword-based approach. Remove the programmatic fallback entirely.

## Motivation

The project has a working Ollama integration in `src/lib/ai.ts` and a batch Ollama script in `scripts/analyze.ts`. The programmatic `generate-analysis.ts` produces generic, keyword-matched results. Using only Ollama gives better quality analysis and eliminates code duplication.

---

## User Story — Ollama-only analysis

**As a** developer running the analysis pipeline  
**I want** `generate-analysis.ts` to use Ollama for all analysis, removing the programmatic fallback  
**So that** every app gets high-quality LLM analysis.

### Tasks

- [ ] Delete `scripts/generate-analysis.ts` (programmatic fallback no longer needed)
- [ ] Keep `scripts/analyze.ts` as the sole analysis script (already uses Ollama via `src/lib/ai.ts`)
- [ ] In `analyze.ts`, add a `--clean` flag that clears `aiSummary`, `painPoints`, `improvements`, and `aiAnalyzedAt` for all apps before starting
- [ ] Add CLI flags to `analyze.ts`:
  - `--limit <n>` : process at most N apps (default: all)
  - `--offset <n>` : skip the first N un-analyzed apps
  - `--clean` : clear all existing analysis before starting
- [ ] `--resume` behavior is now the default: always skip apps that already have `aiSummary`
- [ ] Add a real-time progress bar with:
  - Percentage complete (`45/504 = 8.9%`)
  - Elapsed time + estimated remaining time (ETA)
  - Number of errors so far
  - Current app being analyzed
- [ ] Remove `scripts/generate-analysis.ts`

### Validation

- [ ] Running `npm run analyze -- --limit 10` analyzes 10 apps (in ~5min)
- [ ] Re-running `npm run analyze -- --limit 10` skips the 10 already done and analyzes the next 10
- [ ] Running `npm run analyze -- --offset 20 --limit 10` analyzes apps 21-30 among un-analyzed ones
- [ ] Running `npm run analyze -- --clean --limit 20` clears all and analyzes the first 20
- [ ] Progress bar shows percentage, elapsed time, ETA, and errors
- [ ] No leftover keyword-based code
- [ ] No TypeScript compilation errors

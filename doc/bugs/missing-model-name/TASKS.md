# Missing model name in AI Analysis section

## Summary

The AI Analysis section on the app detail page shows `Analyzed {date}` but never displays the model name (`Model: {name}`), even though the database schema, API, and UI all support it.

## Root cause

The bug was detected with `npm run analyze -- --clean --limit 1`.

The `--clean` flag in `scripts/analyze.ts` sets `modelName = NULL` for **all** apps, while `--limit 1` only re-analyzes a single app. This results in all other analyzed apps having `modelName = NULL` despite retaining their `aiSummary`, `painPoints`, and `improvements` data. The UI conditionally hides the model name badge when `modelName` is null (`src/app/apps/[id]/page.tsx:214`).

Previously, `scripts/crawl.ts` also had an `--analyze` flag whose `aiAnalyze()` function omitted `modelName` from the DB update entirely — this was the original source of NULL model names. This flag has been removed; AI analysis is now exclusively handled by `scripts/analyze.ts`.

The remaining issue: `analyze.ts` `--clean` is too aggressive — it wipes `modelName` on all rows regardless of the `--limit`/`--offset` scope, leaving most apps without a modelName after a partial re-analysis.

## User story

- [ ] Make `--clean` only affect the subset of apps that will be re-analyzed (respect `--limit`/`--offset`) instead of clearing all rows globally
- [ ] Backfill `modelName` for existing records where `aiSummary IS NOT NULL` and `modelName IS NULL` in SQLite

## Validation steps

1. Run `npm run analyze -- --clean --limit 1`
2. Verify via `npm run analyze -- --stats` that only the re-analyzed batch has `modelName = NULL`
3. Open the re-analyzed app detail page in the browser
4. Confirm that `Model: qwen3:8b` (or appropriate model name) appears alongside `Analyzed {date}` in the AI Analysis section footer
5. Confirm that other apps still retain their existing modelName after the command

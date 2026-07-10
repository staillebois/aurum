# Bug: AI analysis leaves Pain Points and Improvement Ideas empty

## Summary

The "AI Analysis" section renders on the detail page (`/apps/[id]`), but **Pain Points** and **Improvement Ideas** always display the fallback texts *"No pain points identified."* and *"No improvements suggested."* — as if the AI found nothing.

Example with **Microsoft OneDrive** :

```
AI Analysis
Summary
  OneDrive is a cloud storage and file synchronization service provided by Microsoft…
Pain Points
  No pain points identified.
Improvement Ideas
  No improvements suggested.
```

**Root cause** : `src/lib/ai.ts:58-71` — the `parseSection` function uses a regex that is too rigid and doesn't tolerate formatting variations produced by the Ollama model (`qwen2.5-coder:7b`). When the regex fails to match, `parseSection` returns `[]`, and `parseAnalysis` (`src/lib/ai.ts:82-83`) replaces the empty array with the fallback values `["No pain points identified."]` / `["No improvements suggested."]`.

Specific issues with the `parseSection` regex:
1. Content must start **on a new line** after the header (`\s*\n` after `:?`), but the model sometimes puts content on the same line (e.g. `PAIN POINTS: The app has...`)
2. The **next section header** must be in **ALL CAPS with ≥ 2 characters** (`[A-Z]+[A-Z\s]+`), but the model sometimes uses `### Pain Points`, `**Pain Points**`, `Pain Points :`, etc.
3. The only allowed formatting around headers is `**` (bold) — `###` (markdown heading) is not handled.

The `qwen2.5-coder:7b` model (temperature 0.3, max 2048 tokens) doesn't always follow the exact format requested in the prompt (`SUMMARY:`, `PAIN POINTS:`, `IMPROVEMENTS:`) and frequently produces markdown variants or omits sections entirely.

---

## User Story — Pain Points and Improvements always populated

**As a** user
**I want** the Pain Points and Improvement Ideas sections to contain real content from the AI analysis
**So that** I can identify improvement opportunities without reading all reviews manually.

### Tasks

- [x] Make `parseSection` more robust in `src/lib/ai.ts` :
  - [x] Handle markdown headers (`### Pain Points`, `#### Pain Points`) with optional `#{0,6}\s*`
  - [x] Handle content on the **same line** as the header (instead of requiring `\n`)
  - [x] Loosen the end-of-section lookahead: use the actual next section name (`IMPROVEMENTS` / `Improvement Ideas`) instead of requiring strict ALL-CAPS
  - [x] Add section alias: `"Improvement Ideas"` for the improvements section
- [x] Improve the prompt in `buildAnalysisPrompt`: stricter instructions, forbid markdown, require all 3 sections
- [x] Increase `num_predict` from 2048 to 4096 to avoid response truncation
- [x] Add `--re-analyze-fallback` flag to `scripts/analyze.ts` to detect and re-analyze apps with fallback values
- [ ] Run `npm run analyze -- --re-analyze-fallback` to re-analyze affected apps
- [ ] Verify Microsoft OneDrive and other affected apps display real content

### Validation

- [ ] Run `npm run analyze -- --status` to check the number of apps without analysis
- [ ] Run `npm run analyze -- --re-analyze-fallback` to launch the re-analysis
- [ ] The `/apps/<id>` page for Microsoft OneDrive shows real pain points and improvements
- [ ] No regression on apps that already had correct analysis
- [ ] No TypeScript / build errors

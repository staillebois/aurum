# Improvement: Multi-model analysis support

## Summary

Allow the analysis pipeline to use any installed Ollama model per run instead of being hardcoded to a single `OLLAMA_MODEL` env var. Store which model was used for each app in the database so the UI can display it.

## Motivation

The project currently hardcodes the model in `src/lib/ai.ts:1-2` via `OLLAMA_MODEL` env var. Users with multiple Ollama models — e.g. `qwen3:8b`, `mistral:7b`, `llama3.1:8b` — cannot choose which model to use per analysis run. Different models produce different quality results for app review analysis. Multi-model support enables A/B testing and gradual model upgrades without re-analyzing everything.

The already-installed `qwen3:8b` is better suited for text analysis than the default `qwen2.5-coder:7b` (which is optimized for code generation, not review sentiment).

---

## User Story — CLI model selection

**As a** developer running the analysis pipeline
**I want** to choose which Ollama model to use via `--model` flag
**So that** I can compare results across models without editing `.env`.

### Tasks

- [ ] Add `modelName` optional field to `App` Prisma schema
- [ ] Regenerate Prisma client and push schema
- [ ] Refactor `src/lib/ai.ts` to accept a `model` parameter (default: `OLLAMA_MODEL` env var)
- [ ] Add `--model <name>` flag to `scripts/analyze.ts`
- [ ] Pass the model name through the analysis pipeline and store it in DB
- [ ] Expose `modelName` in `GET /api/apps/[id]` response
- [ ] Show the model name in the detail page UI (e.g. "Analyzed by qwen3:8b")
- [ ] Update `.env` comment to list recommended models
- [ ] Run `npm run analyze -- --model qwen3:8b --limit 5` and verify model is stored

### Validation

- [ ] `npm run analyze -- --model mistral:7b --limit 2` analyzes 2 apps with mistral
- [ ] `npm run analyze` (no flag) uses the default model from `.env`
- [ ] DB stores `modelName` for each analyzed app
- [ ] API response includes `aiAnalysis.modelName`
- [ ] Detail page displays "Analyzed by <model>" text
- [ ] No TypeScript / build errors

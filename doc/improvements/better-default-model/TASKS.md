# Improvement: Better default model and prompt

## Summary

Change the default Ollama model from `qwen2.5-coder:7b` to `qwen3:8b` and improve the prompt + parser to handle more formatting variations from different models.

## Motivation

`qwen2.5-coder:7b` is optimized for code generation (Python, JavaScript, etc.), not for app review analysis. The user already has `qwen3:8b` installed, which is the next Qwen generation with better general text understanding, 256K context, and stronger instruction following — all of which matter more for extracting pain points and improvement ideas from reviews.

The prompt parser (`parseSection` in `src/lib/ai.ts:58-93`) is fragile and was already patched once (see `doc/bugs/ia-analysis-painpoints-improvements-empties/`). Different models produce different formatting and the parser needs to handle them all gracefully.

---

## User Story — Better analysis quality by default

**As a** user running `npm run analyze`
**I want** the default model to produce high-quality analysis
**So that** I don't have to manually switch models to get useful results.

### Tasks

- [ ] Change default `OLLAMA_MODEL` in `.env` from `qwen2.5-coder:7b` to `qwen3:8b`
- [ ] Update `src/lib/ai.ts` default constant from `qwen2.5-coder:7b` to `qwen3:8b`
- [ ] Improve `buildAnalysisPrompt`:
  - Add explicit instructions about format (bullet points with `- `, plain text, no markdown)
  - Require minimum 3 pain points and 3 improvements
  - Add a one-shot example in the prompt
- [ ] Improve `parseSection` to handle additional format variations:
  - Content on same line as header
  - Numbered lists (1., 2., 3.) in addition to bullet lists
  - Section headers with/without colon, with/without newline
- [ ] Test with `--limit 5` using `qwen3:8b` and verify all sections are populated
- [ ] Test with `--limit 5` using `mistral:7b` and verify parsing works

### Validation

- [ ] `npm run analyze -- --limit 3` uses `qwen3:8b` by default
- [ ] All 3 analyzed apps have non-fallback content in all sections
- [ ] `npm run analyze -- --model mistral:7b --limit 3` also produces valid output
- [ ] Running benchmark (`npm run benchmark -- --apps 3`) shows >80% completion rate for both models
- [ ] No TypeScript / build errors

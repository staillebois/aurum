# Bug: Chain-of-thought think block (`...`) breaks IMPROVEMENTS parsing

## Summary

When using models that emit a `...` reasoning block before structured output (observed on `qwen3:8b`, also applies to DeepSeek R1 and similar models), the `parseSection` function matches the word `Improvements:` inside the thinking text before the closing `</think>` tag, instead of matching the real `IMPROVEMENTS:` section. This causes the improvement list to display the model's internal reasoning instead of the structured improvement items.

## Root cause

The model output looks like:

```
... (reasoning text containing "Improvements: Fix app stability..." )
</think>
SUMMARY: ...
PAIN POINTS:
- ...
IMPROVEMENTS:
- ...
```

`parseSection` iterates through `SECTION_ALIASES["IMPROVEMENTS"]` case-insensitively. The alias `"IMPROVEMENTS"` (regex `IMPROVEMENTS\s*\*{0,2}:?`) matches `Improvements:` inside the think block.

Since `getNextSectionPattern("IMPROVEMENTS")` returns `\\n?$` (end of string), the non-greedy `[\s\S]*?` expands one character at a time until `$` matches — which only happens at the actual end of the string. This means **all remaining text** (end of reasoning, `</think>`, SUMMARY, PAIN POINTS, and the real IMPROVEMENTS section) is captured as a single match blob. After `split("\n")` + `.filter()`, the first line of reasoning becomes the displayed "improvement".

Sections before the thinking block are unaffected because:
- `SUMMARY` has a dedicated regex that works correctly
- `PAIN POINTS` does not appear verbatim in the reasoning text
- `IMPROVEMENTS` / `Improvements:` commonly appears in the model's self-correction reasoning

## Affected models

- `qwen3:8b` (confirmed — produces `...` blocks with reasoning)
- `deepseek-r1:8b`, `deepseek-r1:7b` (same format)
- Any model that outputs thinking/reasoning before structured output

## User story

**As a** user analyzing apps,
**I want** the Improvement Ideas section to show the actual structured improvement items,
**So that** I see useful analysis instead of the model's internal chain-of-thought.

### Tasks

- [ ] Add a `stripThinkBlocks()` helper that removes `...` / `</think>` blocks from the raw model response
- [ ] Call `stripThinkBlocks()` in `parseAnalysis()` before any section regex matching
- [ ] Verify with a real `qwen3:8b` response that all three sections (SUMMARY, PAIN POINTS, IMPROVEMENTS) parse correctly
- [ ] Verify existing models (`mistral:7b`) still parse correctly — the regex must be a no-op when no think blocks exist
- [ ] Run `npm run analyze -- --clean --limit 1` and confirm the UI shows correct improvements

### Validation steps

- [ ] Given a raw response containing `...` + reasoning + `</think>` + structured output, `parseAnalysis()` returns correct items
- [ ] Given a raw response WITHOUT any think blocks, output is unchanged
- [ ] The IMPROVEMENTS array contains exactly the bullet items from the structured section
- [ ] `tsc --noEmit` passes with no errors
- [ ] `npm run lint` passes (only pre-existing crawl.ts issues remain)

## Implementation

Add to `src/lib/ai.ts`:

```typescript
function stripThinkBlocks(raw: string): string {
  return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
```

Call it in `parseAnalysis()` before regex matching:

```typescript
function parseAnalysis(raw: string): AiAnalysis {
  raw = stripThinkBlocks(raw);
  // ... existing code unchanged
}
```

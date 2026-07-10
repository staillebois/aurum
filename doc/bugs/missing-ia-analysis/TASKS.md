# Bug: Some apps are missing the "AI Analysis" section

## Summary

On the app detail page (`/apps/[id]`), the "AI Analysis" section is completely hidden when `aiAnalysis` is `null`. 16 apps in the database (including **Options Alerts - Swing Signals**) have `aiSummary`, `painPoints`, and `improvements` set to `NULL` because they were never analyzed.

**Root cause** : `src/app/api/apps/[id]/route.ts:28` builds `aiAnalysis: null` when `app.aiSummary` is null. The component `src/app/apps/[id]/page.tsx:184` conditions the entire section on `{app.aiAnalysis && (...)}`. Apps without analysis never show the section.

---

## User Story — Show AI analysis for all apps

**As a** user
**I want** every app to have an "AI Analysis" section
**So that** I can see insights (summary, pain points, improvements) even for apps not yet analyzed by Ollama.

### Tasks

- [ ] Run `scripts/generate-analysis.ts` to generate programmatic (keyword-based) analysis for all apps that are missing it
- [ ] Verify no app has `aiSummary` = NULL anymore
- [ ] Verify the detail page for **Options Alerts - Swing Signals** displays the "AI Analysis" section

### Validation

- [ ] `npx tsx -e "..."` confirms 0 apps with `aiSummary IS NULL`
- [ ] The `/apps/<id>` page for Options Alerts - Swing Signals shows the "AI Analysis" section with summary, pain points, and improvements
- [ ] No TypeScript / build errors

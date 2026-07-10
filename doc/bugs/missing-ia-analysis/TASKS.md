# Bug: Certaines apps n'ont pas la section "AI Analysis"

## Summary

Sur la page de détail d'une app (`/apps/[id]`), la section "AI Analysis" est entièrement masquée quand `aiAnalysis` est `null`. Or 16 apps en base de données (dont **Options Alerts - Swing Signals**) ont des champs `aiSummary`, `painPoints`, `improvements` à `NULL` parce qu'elles n'ont jamais été analysées.

**Root cause** : `src/app/api/apps/[id]/route.ts:28` construit `aiAnalysis: null` si `app.aiSummary` est null. Le composant `src/app/apps/[id]/page.tsx:184` conditionne l'affichage de toute la section à `{app.aiAnalysis && (...)}`. Les apps sans analyse n'affichent donc jamais la section.

---

## User Story — Afficher l'analyse IA pour toutes les apps

**As a** user  
**I want** que toutes les apps aient une section "AI Analysis"  
**So that** je puisse voir les insights (summary, pain points, improvements) même pour les apps qui n'ont pas été analysées par Ollama.

### Tasks

- [ ] Exécuter `scripts/generate-analysis.ts` pour générer l'analyse programmatique (fallback keyword-based) pour toutes les apps qui en manquent
- [ ] Vérifier qu'aucune app n'a plus `aiSummary` à NULL
- [ ] Vérifier que la page détail d'**Options Alerts - Swing Signals** affiche bien la section "AI Analysis"

### Validation

- [ ] `npx tsx -e "..."` confirme 0 apps avec `aiSummary IS NULL`
- [ ] La page `/apps/<id>` d'Options Alerts - Swing Signals montre la section "AI Analysis" avec summary, pain points et improvements
- [ ] Aucune erreur TypeScript / build

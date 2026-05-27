# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Project: "Tu et Mous Bé" (app transport TMB Barcelona)

> **Visió de producte i roadmap:** veure [`HANDOVER.md`](./HANDOVER.md) (què construir després i per què).
> Aquesta secció és el context **tècnic** que cada sessió ha de conèixer.

### Què és
App web (React 18 + TS + Vite) que mostra línies/parades de metro i bus de TMB Barcelona sobre
mapa Leaflet, amb temps real i posicions de vehicles. Es deia "tmbnew"; ara és **"Tu et Mous Bé"**.
- Producció: https://tuetmousbe.pages.dev (Cloudflare Pages)
- Repo: `omarimonproductai/tmbnew` (⚠️ pendent renombrar a `tuetmousbe`)
- Dades: TMB Open Data via Cloudflare Pages Functions (proxy amb credencials).
- 3 modes al header: Línies | Aprop meu | ★ Favorits. Arrenca a Aprop meu.

### Stack i estructura
- Backend: Cloudflare Pages Functions a `functions/` (migrat des de Netlify).
  `functions/_tmb.ts` (helpers, reben creds per paràmetre), `functions/api/*`.
- Frontend `src/`: components, hooks, `stores/favorits.ts`, `utils/`.
- Leaflet + `leaflet-rotate` (cal `src/leafletGlobals.ts` → `window.L=L` ABANS del plugin).
- Tests Vitest (33). CSS únic `src/App.css`. Build `npm run build` → `dist/`.

### ⚠️ Restricció crítica Cloudflare free: 50 subrequests/invocació
`parades-all` fa 1 fetch per línia (~212). Solució: chunking — frontend demana 6 chunks paral·lels
(`?chunks=6&chunk=0..5`); backend ordena per prioritat metro→V/H/D/M→numèriques→N. Per garantir
TOTES les parades en el futur: pre-bake JSON en build, o pla paid.

### Persistència (localStorage)
`tmb-parades-all-v1` (cache fallback), `tmb-aprop-meu-radius`, `tmb-fav-linies`,
`tmb-fav-parades`, `tmb-fav-sort`. Fetch fallit → s'usa cache + Toast (no bloqueja).

### Features ja fetes
Migració a Cloudflare; Favorits complets (★ a línies/parades, mode propi, vista llista+mapa,
ordenació proximitat/recents persistida, clic badge→mapa de línia amb zoom a la parada, estrella
daurada a parades fav al mapa); Indicacions (action sheet Apple/Google Maps); rotació mapa (touch);
ordenació línies (proximitat/A·Z/Z·A); icones metro/bus; correspondències metro↔metro; UX mòbil
(lupa FAB + backdrop, bottom sheet arrossegable, zoom centrat en usuari, dot "Tu", auto-scroll a
parada propera).

### Convencions
Workflow PRD+tasklist a `tasks/` per features grans; mockups HTML a l'arrel abans d'UI gran;
verificar lint+test+build abans de push; comentaris escassos (només el WHY).

### Pendents tècnics
1. Renombrar repo GitHub a `tuetmousbe` + `git remote set-url`.
2. Esborrar projecte Cloudflare antic `tmbnew`.

### Dev local
`npm install` → `npm run dev:functions` (cal `.dev.vars` amb TMB_APP_ID/KEY). Credencials runtime
a Cloudflare: Settings → Variables and Secrets → Production; afegir-les requereix re-deploy.

---

## 0. Session Start — Read Project Commands

At the start of every session or new project, **scan `.claude/commands/` and read every `.md` file inside** before doing any other work. These files define project-specific rules and slash commands (e.g. `create-prd`, `generate-tasks`, or anything else added later by the team).

Why this matters:

- Knowing the commands lets you **suggest the right one** when the user describes a task that matches (e.g. proposing `/create-prd` when they describe a new feature).
- Knowing the internal rules of each command lets you **follow them automatically** when invoked, without having to re-read mid-flight.
- New commands added by the team get picked up the next session, no extra config needed.

Operationally: this is a one-time scan per session. You don't need to announce the list of commands unprompted — just have them in working memory so you can route the user correctly when they describe their need.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Branch per Parent Task

**One Git branch per top-level task. Never mix tasks on the same branch.**

For each parent task in `tasks/tasks-*.md` (e.g. 1.0, 2.0, 3.0…), open a new branch from the project's integration branch BEFORE starting work. Sub-tasks of the same parent share the branch.

### Naming
Examples:
- `task/myarmari-1.0-monorepo-setup`
- `task/myarmari-2.0-backend-service`
- `task/myarmari-3.0-app-shell`
- 
### Lifecycle
1. **Start of parent task**: pull integration branch, create new task branch from it, push to remote
2. **Sub-tasks**: commit and push to the same task branch
3. **End of parent task**: open a PR against the integration branch with a summary of what landed, request review (or self-merge if solo)
4. **After merge**: delete local + remote branch, pull integration branch, then start the next task on a new branch

### Why
- Each task gets its own diff / review surface
- Easy to revert a single task without affecting others
- The PR history is the implementation diary
- Multiple tasks can be paral·lelitzades si calen reviews simultanis

### Exception
PRD task **0.0 "Create feature branch"** is the *first* task branch and follows the same convention.


## 6. Visible question in the thread
 
**Whenever you use `AskUserQuestion`, first write the same question and options as text in the conversation thread before calling the tool.**
 
Why: the `AskUserQuestion` dropdown takes over the screen and covers the previous context. If the user wants to review what you did before answering, they can't. Repeating the question in the thread leaves a permanent copy that survives once they've answered.
 
Minimum format:
- Short title (`##` or **bold**)
- Numbered or bulleted list with each option + 1 line of description
- (Optional) your recommendation + why
Then call `AskUserQuestion`. No need to repeat it word-for-word — the idea is that the user can read it with the question dropdown closed.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

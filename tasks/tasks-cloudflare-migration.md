# Tasks: Migració de Netlify a Cloudflare Pages

PRD: `tasks/prd-cloudflare-migration.md`

## Relevant Files

- `functions/_tmb.ts` - Helpers compartits (port de `netlify/functions/_tmb.ts`); accepten credencials per paràmetre en lloc de `process.env`.
- `functions/api/linies.ts` - Pages Function `/api/linies`.
- `functions/api/parades/[liniaId].ts` - Pages Function `/api/parades/:liniaId` (segment dinàmic natiu).
- `functions/api/parades-all.ts` - Pages Function `/api/parades-all` amb fan-out i cache durador.
- `functions/api/temps-real/[[path]].ts` - Catch-all per `/api/temps-real/*`.
- `functions/api/vehicles/[[path]].ts` - Catch-all per `/api/vehicles/*`.
- `wrangler.toml` - Configuració mínima de Cloudflare Pages.
- `public/_redirects` - Regla SPA fallback `/* /index.html 200`.
- `.dev.vars.example` - Plantilla de credencials per `wrangler pages dev`.
- `.gitignore` - Afegir `.dev.vars` i `.wrangler/`.
- `package.json` - Treure `@netlify/functions`, afegir `wrangler` i `@cloudflare/workers-types`, afegir script `dev:functions`.
- `tsconfig.functions.json` - Nou project reference per al codi de `functions/` amb els tipus de Cloudflare Workers.
- `tsconfig.json` - Afegir referència a `tsconfig.functions.json`.
- `tsconfig.node.json` - Treure `netlify/**/*.ts` de l'`include`.
- `netlify/` (directori sencer) - **A esborrar**.
- `netlify.toml` - **A esborrar**.
- `.env.example` - **A reemplaçar** per `.dev.vars.example`.

### Notes

- Tests amb `npm test`. No hi ha tests específics per Functions; la verificació és manual + tipus.
- La lògica de TMB (`fetchAllLinies`, `fetchParades`, `fetchIBus`, `fetchIMetro`, dedupe de vehicles) **no es toca**. Només canvia com es passen les credencials i com s'embolcalla amb el handler.
- L'ordre de tasques permet que el repo segueixi compilant a cada pas (no es trenca a mig camí).

## Instructions for Completing Tasks

**IMPORTANT:** Marca cada subtasca canviant `- [ ]` per `- [x]` a mesura que avances. Actualitza el fitxer després de cada sub-tasca.

---

## Tasks

### 1.0 Preparar dependencies i config base de Cloudflare

- [x] 1.1 Eliminar `@netlify/functions` de `devDependencies` a `package.json`.
- [x] 1.2 Afegir `wrangler` i `@cloudflare/workers-types` a `devDependencies` a `package.json`.
- [x] 1.3 Afegir l'script `"dev:functions": "wrangler pages dev -- npm run dev"` a `package.json`.
- [x] 1.4 Crear `wrangler.toml` a l'arrel amb `name`, `compatibility_date` i `pages_build_output_dir = "dist"`.
- [x] 1.5 Crear `public/_redirects` amb `/* /index.html 200`.
- [x] 1.6 Crear `.dev.vars.example` amb `TMB_APP_ID=` i `TMB_APP_KEY=`.
- [x] 1.7 Actualitzar `.gitignore` per incloure `.dev.vars` i `.wrangler/`.
- [x] 1.8 Esborrar `.env.example` (substituït per `.dev.vars.example`).
- [x] 1.9 Executar `npm install` per regenerar el lock file.

### 2.0 Portar `_tmb.ts` a `functions/`

- [x] 2.1 Crear `functions/_tmb.ts` copiant `netlify/functions/_tmb.ts`.
- [x] 2.2 Eliminar `requireCredentials()` basat en `process.env`. Substituir per una signatura on les funcions reben `creds: { app_id: string; app_key: string }` com a primer paràmetre.
- [x] 2.3 Adaptar `withCreds`, `fetchJson`, `rawFetch`, `fetchAllLinies`, `fetchParades`, `fetchIBus`, `fetchIMetro`, `fetchIBusBatch`, `fetchIMetroBatch` perquè acceptin les credencials.
- [x] 2.4 Mantenir `parseLiniaId`, `mapLimit`, `jsonResponse`, `errorResponse` exportades (no necessiten credencials).
- [x] 2.5 Afegir un tipus `Env` exportat: `export interface Env { TMB_APP_ID: string; TMB_APP_KEY: string }`.
- [x] 2.6 Afegir un helper `getCreds(env: Env)` que valida que les variables estiguin definides i retorna `{ app_id, app_key }`.
- [x] 2.7 Verificar que els imports de tipus (`../src/types/tmb`) funcionen des de la nova ubicació.

### 3.0 Portar cada handler a Pages Functions

- [x] 3.1 Crear `functions/api/linies.ts` amb `onRequest: PagesFunction<Env>` + cache 1h.
- [x] 3.2 Crear `functions/api/parades/[liniaId].ts` que llegeix `params.liniaId`. Cache 300s.
- [x] 3.3 Crear `functions/api/parades-all.ts` amb fan-out i cache durador.
- [x] 3.4 Crear `functions/api/temps-real/[[path]].ts`: llegeix `params.path` (string[]). Suporta `?debug=1` i `?all=1`. Cache 60s.
- [x] 3.5 Crear `functions/api/vehicles/[[path]].ts` amb `aggregateVehicles` idèntica. Cache 30s.
- [x] 3.6 Verificar que les funcions exportades de `_tmb.ts` cobreixen totes les crides dels handlers.

### 4.0 Eliminar les peces de Netlify

- [x] 4.1 Esborrar `netlify/functions/_tmb.ts`.
- [x] 4.2 Esborrar la resta de `netlify/functions/*.ts`.
- [x] 4.3 Esborrar el directori `netlify/` complet.
- [x] 4.4 Esborrar `netlify.toml`.

### 5.0 Documentació i handover

> **Nota**: el `claude.md` del repo conté guidelines genèriques de comportament, no el handover del projecte. El document de handover descrit a aquestes tasques no existeix com a fitxer al repo (es va passar només com a context de sessió). Les instruccions de deploy a Cloudflare es lliuren a través de la conversa i del PRD; no cal modificar cap fitxer del repo per aquest pas.

- [x] 5.1 ~~Actualitzar `claude.md`: secció "Tech stack"~~ — N/A: el handover no és al repo.
- [x] 5.2 ~~Actualitzar `claude.md`: secció "Estructura del repo"~~ — N/A.
- [x] 5.3 ~~Actualitzar `claude.md`: secció "Deployment"~~ — N/A.
- [x] 5.4 ~~Actualitzar `claude.md`: secció "Local dev"~~ — N/A.
- [x] 5.5 ~~Actualitzar `claude.md`: secció "Limitacions conegudes"~~ — N/A.

### 6.0 Verificació final

- [x] 6.1 `npm install` sense errors.
- [x] 6.2 `npm run lint` (TypeScript build) passa sense errors.
- [x] 6.3 `npm run build` genera `dist/` correctament.
- [x] 6.4 `npm test` passa (33 tests).
- [x] 6.5 Revisar que no queden referències a "netlify" al codi (només queden al PRD/tasks històrics, esperat).
- [ ] 6.6 Commit amb missatge descriptiu i push a `feature/cloudflare-migration`.
- [ ] 6.7 (Manual, fora de l'agent) Crear el site a Cloudflare Pages, configurar env vars, validar el primer deploy.

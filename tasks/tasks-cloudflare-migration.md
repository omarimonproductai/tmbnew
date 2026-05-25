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
- `claude.md` - Actualitzar handover per reflectir Cloudflare Pages.
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

- [ ] 1.1 Eliminar `@netlify/functions` de `devDependencies` a `package.json`.
- [ ] 1.2 Afegir `wrangler` i `@cloudflare/workers-types` a `devDependencies` a `package.json`.
- [ ] 1.3 Afegir l'script `"dev:functions": "wrangler pages dev -- npm run dev"` a `package.json`.
- [ ] 1.4 Crear `wrangler.toml` a l'arrel amb `name`, `compatibility_date` i `pages_build_output_dir = "dist"`.
- [ ] 1.5 Crear `public/_redirects` amb `/* /index.html 200`.
- [ ] 1.6 Crear `.dev.vars.example` amb `TMB_APP_ID=` i `TMB_APP_KEY=`.
- [ ] 1.7 Actualitzar `.gitignore` per incloure `.dev.vars` i `.wrangler/`.
- [ ] 1.8 Esborrar `.env.example` (substituït per `.dev.vars.example`).
- [ ] 1.9 Executar `npm install` per regenerar el lock file.

### 2.0 Portar `_tmb.ts` a `functions/`

- [ ] 2.1 Crear `functions/_tmb.ts` copiant `netlify/functions/_tmb.ts`.
- [ ] 2.2 Eliminar `requireCredentials()` basat en `process.env`. Substituir per una signatura on les funcions reben `creds: { app_id: string; app_key: string }` (com a primer paràmetre o tancada via factory).
- [ ] 2.3 Adaptar `withCreds`, `fetchJson`, `rawFetch`, `fetchAllLinies`, `fetchParades`, `fetchIBus`, `fetchIMetro`, `fetchIBusBatch`, `fetchIMetroBatch` perquè acceptin les credencials.
- [ ] 2.4 Mantenir `parseLiniaId`, `mapLimit`, `jsonResponse`, `errorResponse` exportades (no necessiten credencials).
- [ ] 2.5 Afegir un tipus `Env` exportat: `export interface Env { TMB_APP_ID: string; TMB_APP_KEY: string }`.
- [ ] 2.6 Afegir un helper `getCreds(env: Env)` que valida que les variables estiguin definides i retorna `{ app_id, app_key }` (port del check de `requireCredentials`).
- [ ] 2.7 Verificar que els imports de tipus (`../../src/types/tmb`) continuen funcionant des de la nova ubicació (`../src/types/tmb`).

### 3.0 Portar cada handler a Pages Functions

- [ ] 3.1 Crear `functions/api/linies.ts` amb `onRequest: PagesFunction<Env>` que crida `fetchAllLinies(getCreds(env))` i retorna `jsonResponse(200, linies)` amb `Cache-Control: public, max-age=3600` i `CDN-Cache-Control: public, max-age=3600`.
- [ ] 3.2 Crear `functions/api/parades/[liniaId].ts` que llegeix `params.liniaId`, valida, i retorna `fetchParades(creds, liniaId)`. Cache 300s.
- [ ] 3.3 Crear `functions/api/parades-all.ts` que fa el fan-out i retorna l'agregat. Mantenir headers de cache durador (`Cache-Control: public, max-age=300` + `CDN-Cache-Control: public, max-age=300`).
- [ ] 3.4 Crear `functions/api/temps-real/[[path]].ts`: llegeix `params.path` (string[]), extreu `[tipus, liniaCodi, paradaCodi]`, suporta `?debug=1` i `?all=1` igual que abans. Cache 60s.
- [ ] 3.5 Crear `functions/api/vehicles/[[path]].ts`: llegeix `params.path` per obtenir `[liniaId, liniaCodi]`. Manté `aggregateVehicles` idèntica (port literal). Cache 30s + CDN cache 30s.
- [ ] 3.6 Verificar que les funcions exportades de `_tmb.ts` cobreixen totes les crides dels handlers (afegir el que falti).

### 4.0 Eliminar les peces de Netlify

- [ ] 4.1 Esborrar `netlify/functions/_tmb.ts`.
- [ ] 4.2 Esborrar la resta de `netlify/functions/*.ts`.
- [ ] 4.3 Esborrar el directori `netlify/` complet.
- [ ] 4.4 Esborrar `netlify.toml`.

### 5.0 Documentació i handover

- [ ] 5.1 Actualitzar `claude.md`: secció "Tech stack" → reemplaçar "Netlify Functions" per "Cloudflare Pages Functions".
- [ ] 5.2 Actualitzar `claude.md`: secció "Estructura del repo" → reflectir `functions/` en lloc de `netlify/`.
- [ ] 5.3 Actualitzar `claude.md`: secció "Deployment" → instruccions per Cloudflare Pages (Build command, Output dir, env vars al dashboard, branques).
- [ ] 5.4 Actualitzar `claude.md`: secció "Local dev" → mencionar `npm run dev:functions` amb `wrangler pages dev`, i `.dev.vars` en lloc de `.env.local`.
- [ ] 5.5 Actualitzar `claude.md`: secció "Limitacions conegudes" → treure referències a "Netlify credits" si n'hi ha i posar les equivalents de Cloudflare (100k req/dia).

### 6.0 Verificació final

- [ ] 6.1 `npm install` sense errors.
- [ ] 6.2 `npm run lint` (TypeScript build) passa sense errors.
- [ ] 6.3 `npm run build` genera `dist/` correctament.
- [ ] 6.4 `npm test` passa.
- [ ] 6.5 Revisar que no queden referències a "netlify" al codi (`grep -r netlify src/ functions/`).
- [ ] 6.6 Commit amb missatge descriptiu i push a `feature/cloudflare-migration`.
- [ ] 6.7 (Manual, fora de l'agent) Crear el site a Cloudflare Pages, configurar env vars, validar el primer deploy.

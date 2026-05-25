# PRD: Migració de Netlify a Cloudflare Pages

## 1. Introduction / Overview

Aquesta migració mou l'aplicació del seu hosting actual a **Netlify** (frontend estàtic + Netlify Functions) cap a **Cloudflare Pages** (frontend estàtic + Pages Functions sobre Workers).

El motiu principal és el **free tier més generós de Cloudflare** (bandwidth il·limitat i 100k requests/dia de Workers, vs els ~125k invocacions/mes de Netlify i el seu sistema opac de "credits") combinat amb un CDN ràpid. Com que l'aplicació depèn molt del cache CDN per estalviar crides a TMB (especialment `parades-all` i `vehicles`, que fan fan-out), Cloudflare és una bona casa.

**Goal**: tenir l'aplicació desplegada a Cloudflare Pages amb les mateixes 5 rutes d'API funcionant idènticament a les actuals, i el repo lliure de qualsevol referència a Netlify.

## 2. Goals

1. Substituir les 5 Netlify Functions per **Cloudflare Pages Functions** equivalents, mantenint exactament la mateixa API pública (`/api/linies`, `/api/parades/:liniaId`, `/api/parades-all`, `/api/temps-real/:tipus/:linia/:parada`, `/api/vehicles/:liniaId/:liniaCodi`).
2. Conservar **tota la lògica de negoci intacta** (fetch a TMB, dedupe, agregació, normalització). El refactor és d'**embolcall**, no de codi.
3. Mantenir el **cache CDN** amb els mateixos TTLs (60s temps real, 30s vehicles durador, 300s parades-all, 1h linies).
4. Eliminar del repo totes les peces específiques de Netlify: `netlify/`, `netlify.toml`, `@netlify/functions`.
5. Documentar el procés de deploy a Cloudflare al README o a un nou apartat del handover.
6. Mantenir el dev local funcionant (via `wrangler pages dev`) amb un `.env.local` (o `.dev.vars`) per a les credencials TMB.

## 3. Non-Goals

- **No** afegir funcionalitat nova a l'aplicació.
- **No** canviar la lògica d'extrapolació, dedupe ni agregació.
- **No** migrar a un altre framework (continua sent Vite + React).
- **No** afegir KV, D1 ni Durable Objects de Cloudflare. Mantenim stateless (només cache d'edge).
- **No** mantenir compatibilitat amb Netlify després de la migració (és full-switch, no side-by-side).

## 4. User Stories

- **Com a desenvolupador**, faig `git push` a `main` i Cloudflare Pages reconstrueix i desplega l'app automàticament, igual com feia Netlify.
- **Com a desenvolupador**, executo `npx wrangler pages dev` en local i veig tant el frontend com les Functions servint les rutes `/api/*` amb les meves credencials TMB.
- **Com a usuari final**, no noto cap diferència respecte abans: temps de càrrega similars o millors, les mateixes funcionalitats al mapa, "Aprop meu" i temps real.

## 5. Functional Requirements

### Estructura de fitxers

1. Crear el directori `functions/` a l'arrel del repo amb la següent estructura (la convenció de Cloudflare Pages):
   - `functions/api/linies.ts` → `GET /api/linies`
   - `functions/api/parades/[liniaId].ts` → `GET /api/parades/:liniaId`
   - `functions/api/parades-all.ts` → `GET /api/parades-all`
   - `functions/api/temps-real/[[path]].ts` → `GET /api/temps-real/*` (catch-all)
   - `functions/api/vehicles/[[path]].ts` → `GET /api/vehicles/*` (catch-all)
   - `functions/_tmb.ts` → helpers compartits (mateixos que els actuals)

2. Eliminar el directori `netlify/` complet.

### Codi de les Functions

3. Cada handler passa de `export default async (req: Request) => Response` a:
   ```ts
   export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => { ... }
   ```
   on `Env` és `{ TMB_APP_ID: string; TMB_APP_KEY: string }`.

4. `_tmb.ts` ja **no llegeix `process.env`**. Exporta totes les funcions de fetch acceptant un objecte `creds: { app_id, app_key }` com a primer paràmetre (o un wrapper d'estat). Cada handler li passa `env.TMB_APP_ID` i `env.TMB_APP_KEY`.

5. Les rutes catch-all (`temps-real`, `vehicles`) llegeixen els segments des de `params.path` (que ve com a `string[]`), no des de query params ni de regex sobre la URL.

6. La ruta `/api/parades/[liniaId]` rep el segment via `params.liniaId`.

### Cache i headers

7. Mantenir els TTLs actuals però adaptar els headers:
   - `Cache-Control: public, max-age=N` (Cloudflare el respecta per al cache de l'edge).
   - Substituir `netlify-cdn-cache-control` per `CDN-Cache-Control` quan calgui cache més llarg al CDN que al navegador. Per `parades-all` i `vehicles` (cache durador) seguir aquesta lògica.
   - Per cache "durable" entre invocacions de Worker, considerar `caches.default` explícitament, però només si és estrictament necessari (l'edge cache amb `CDN-Cache-Control` ja és suficient en la majoria de casos).

### Configuració de Cloudflare

8. Crear un `wrangler.toml` mínim a l'arrel amb:
   ```toml
   name = "rutas-comerciales"
   compatibility_date = "2026-01-01"
   pages_build_output_dir = "dist"
   ```

9. Crear `public/_redirects` amb la regla de SPA fallback:
   ```
   /* /index.html 200
   ```

10. Crear `.dev.vars.example` amb les variables (`TMB_APP_ID` i `TMB_APP_KEY`) per substituir l'antic `.env.example` orientat a Netlify CLI.

### Package.json

11. Eliminar `@netlify/functions` de `devDependencies`.

12. Afegir `@cloudflare/workers-types` i `wrangler` a `devDependencies`.

13. Afegir scripts:
    - `"dev:functions": "wrangler pages dev -- npm run dev"` (serveix Vite + Functions juntes).
    - Mantenir `"dev"`, `"build"`, `"test"`, `"lint"` igual.

### Eliminacions

14. Esborrar `netlify.toml`.
15. Esborrar el directori `netlify/` complet.
16. Actualitzar `.gitignore` per afegir `.dev.vars` i `.wrangler/` (i opcionalment treure entrades de Netlify si n'hi ha).
17. Actualitzar `claude.md` (el handover existent) per reflectir la nova plataforma. Si menciona Netlify específicament al setup, substituir per Cloudflare Pages.

### Verificació

18. `npm run build` ha de passar sense errors de TypeScript.
19. `npm run test` ha de passar (els tests no toquen Functions, però verifiquem que tot continua compilant).
20. (Opcional manual) `wrangler pages dev` ha de servir l'app a un port local amb les Functions funcionant.

## 6. Design Considerations

### Compatibilitat de l'API web standard

Les Functions actuals de Netlify ja usen els objectes `Request` i `Response` estàndard. Cloudflare Pages Functions també. **No cal reescriure cap fetch ni cap manipulació de body/headers.** L'únic embolcall que canvia és la signatura del handler.

### Passar credencials sense `process.env`

Cloudflare Workers no exposen `process.env`. Les credencials viuen al binding `env` que es passa al handler. El refactor de `_tmb.ts` ha de fer que totes les funcions acceptin les credencials explícitament. Una opció neta:

```ts
export interface TmbClient {
  fetchAllLinies(): Promise<Linia[]>;
  fetchParades(liniaId: string): Promise<Parada[]>;
  // ...
}
export function createTmbClient(creds: { app_id: string; app_key: string }): TmbClient { ... }
```

Però per minimitzar la diff, podem mantenir les funcions com a top-level i fer que totes acceptin `creds` com a primer paràmetre. Decidim per la versió més simple durant la implementació.

### Catch-all routes

A Netlify ho hem solucionat amb redirects que reescriuen el path a un query param (`?path=...`). A Cloudflare Pages, `functions/api/vehicles/[[path]].ts` és el catch-all natiu: `params.path` arriba ja parsejat com a `string[]`. Codi més net.

## 7. Migration & Deployment

1. Crear el compte/site a Cloudflare Pages, connectar el repo de GitHub, branca `main`.
2. Build command: `npm run build`. Output: `dist`.
3. Definir les variables d'entorn `TMB_APP_ID` i `TMB_APP_KEY` al dashboard de Cloudflare (Pages → Settings → Environment variables → Production).
4. Confirmar que el primer deploy aixeca correctament la SPA i les rutes `/api/*`.
5. Probar manualment les 3 vistes principals (Línies map+llista, Aprop meu, popups de parada amb temps real) i verificar que els temps de resposta i el cache es comporten bé.
6. Quan tot estigui validat, fer `merge` del PR a `main`.

## 8. Open Questions

1. **Mantenim cooldown de 2 min al refresc?** Sí (no toquem frontend). Però amb el free tier més generós potser es pot rebaixar a 30s. Decisió fora d'aquest PRD.
2. **Cal un script de health-check?** No imprescindible. Es pot afegir més tard si veiem flakiness.
3. **Logs i observabilitat?** Cloudflare ofereix logs en temps real via dashboard. No cal afegir cap eina extra.

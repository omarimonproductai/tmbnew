# Task List — Integració FGC

> Basat en `tasks/prd-fgc.md`. Workflow: branca per parent task; sub-tasques comparteixen
> branca; `npm run lint && npm test && npm run build` abans de cada push.
>
> **Ja fet abans d'aquest pla** (a `main`): `FgcLogo` (isotip monocrom `currentColor`),
> mode `fgc` al `ModeToggle` i placeholder "FGC · properament" a `App.tsx`; PRD amb
> endpoints FGC verificats.

## Relevant Files

### Nous
- `scripts/build-fgc-data.mjs` - Descarrega el GTFS d'FGC (`google_transit.zip`), filtra les
  línies amb connexió directa a Barcelona i pre-bake a JSON (evita el límit de 50
  subrequests de Cloudflare). S'executa al build.
- `src/data/fgc-static.json` - Sortida del pre-bake (línies + parades ordenades per sentit +
  shapes + colors), empaquetada amb les Functions/frontend.
- `functions/_fgc.ts` - Helpers backend FGC (llegir pre-bake, normalitzar, accés a RT).
- `functions/api/fgc/linies.ts` - Llistat de línies FGC.
- `functions/api/fgc/parades.ts` - Parades + shape d'una línia (per `?linia=`).
- `functions/api/fgc/parades-all.ts` - Totes les parades FGC (Aprop meu / favorits).
- `functions/api/fgc/temps-real.ts` - Arribades en temps real per parada.
- `functions/api/fgc/vehicles.ts` - Posicions de vehicles per línia.
- `src/types/fgc.ts` - Tipus `FgcLinia`, `FgcParada`, `FgcVehicle`, `FgcArribada`.
- `src/services/fgc.ts` - Client frontend dels endpoints FGC (+ cache/fallback).
- `src/hooks/useFgcLinies.ts` - Llista/filtre/ordre de línies FGC (anàleg a `useLinies`).
- `src/hooks/useFgcParades.ts` - Parades d'una línia FGC seleccionada.
- `src/hooks/useFgcStations.ts` - Totes les parades FGC (Aprop meu / favorits).
- `src/hooks/useFgcVehicles.ts` - Posicions de vehicles FGC (refresc periòdic).
- `src/components/FgcView.tsx` - Mode FGC complet (reaprofita components de Línies).
- `src/components/FgcLayer.tsx` - Marcadors de parada FGC al mapa (forma distingible).
- `src/components/FgcStationPopup.tsx` - Popup de parada FGC (arribades + accions).
- `src/utils/fgcMarkerIcon.ts` - Icona del marcador FGC.
- `mockup-fgc.html` - Mockup del mode + marcadors abans de la UI gran.

### Existents a modificar
- `src/components/ModeToggle.tsx` - (fet) mode `fgc`.
- `src/components/FgcLogo.tsx` - (fet) icona monocroma.
- `src/App.tsx` - Substituir el placeholder pel `FgcView`.
- `src/types/tmb.ts` - Camp `operator?: 'tmb' | 'fgc'` a `FavParada`/`FavLinia`.
- `src/stores/favorits.ts` - Suport parades/línies FGC (camp operator, default 'tmb').
- `src/hooks/useFavorits.ts` - API de toggles compatible amb FGC.
- `src/hooks/useLinies.ts` - `FilterType` amb FGC (filtre).
- `src/components/FilterBar.tsx` - Toggle FGC (Aprop meu / mode).
- `src/components/AproperMeuView.tsx` - Parades FGC a la llista unificada + comptadors.
- `src/components/AproperMeuMap.tsx` - Marcadors FGC al mapa d'Aprop meu (radi + guinyo).
- `src/components/FavoritsView.tsx` / `src/components/FavMap.tsx` - Favorits FGC barrejats.
- `src/App.css` - Estils del marcador i del popup FGC.
- `HANDOVER.md` - Documentar la integració FGC.

### Tests (Vitest)
- `scripts/build-fgc-data.test.mjs` o `src/utils/fgcFilter.test.ts` - Filtre "connexió Barcelona".
- `functions/_fgc.test.ts` o `src/services/fgc.test.ts` - Normalitzador FGC.
- `src/stores/favorits.test.ts` - Favorits FGC (mixt + migració).
- `src/hooks/useFgcStations.test.ts` - Cache/fallback.
- `src/components/FilterBar.test.tsx` - Toggle FGC.

### Notes
- El projecte usa **Vitest**, no Jest. Executa els tests amb `npm test` (o
  `npx vitest run [ruta]`). Mantén els 56 tests verds i afegeix-ne de nous.
- **Regla d'or:** valida el feed FGC real **en producció** (Pages Function); des de dev els
  hosts FGC estan fora de l'allowlist.
- Reaprofita components de Línies (LineList, MapView, SearchInput, SortControls,
  RefreshControl, VehicleVisibilityToggle, popups) per coherència i menys codi.

## Instructions for Completing Tasks

**IMPORTANT:** En completar cada sub-tasca, marca-la canviant `- [ ]` per `- [x]` en aquest
fitxer. Actualitza el fitxer després de cada sub-tasca, no només en acabar la tasca pare.

## Tasks

- [x] 0.0 Crear la branca de feature
  - [x] 0.1 `git checkout main && git pull`, després crear i fer checkout de `claude/fgc-integration`
  - [x] 0.2 Push inicial de la branca al remot

- [x] 1.0 Backend i dades estàtiques FGC
  - [x] 1.1 `scripts/build-fgc-data.mjs`: descarregar i descomprimir `google_transit.zip`; parsejar `routes`, `stops`, `trips`, `stop_times`, `shapes`, colors
  - [x] 1.2 Definir el criteri "connexió directa a Barcelona" (polígon/bbox del terme municipal); marcar línies amb ≥1 parada dins i conservar la línia sencera
  - [x] 1.3 Generar `src/data/fgc-static.json` (línies + parades ordenades per sentit + shape + `route_color`), mida controlada; enganxar el script al `npm run build`
  - [x] 1.4 `functions/_fgc.ts`: llegir el pre-bake i normalitzar a `FgcLinia`/`FgcParada` (defensiu)
  - [x] 1.5 Endpoints estàtics: `api/fgc/linies.ts`, `api/fgc/parades.ts?linia=`, `api/fgc/parades-all.ts`
  - [x] 1.6 `src/types/fgc.ts` + `src/services/fgc.ts` (client dels endpoints)
  - [x] 1.7 Cache + fallback a localStorage (`tmb-fgc-*-v1`) + Toast no bloquejant (patró TMB/Bicing)
  - [x] 1.8 Tests: filtre "connexió Barcelona" i normalitzador
  - [x] 1.9 `lint + test + build` i push

- [x] 2.0 Model multi-operador i favorits
  - [x] 2.1 Afegir `operator?: 'tmb' | 'fgc'` a `FavParada` i `FavLinia` (`src/types/tmb.ts`), default 'tmb' per compatibilitat
  - [x] 2.2 `src/stores/favorits.ts`: desar/llegir parades i línies FGC al mateix bucket amb el camp `operator` (migració silenciosa dels existents → 'tmb')
  - [x] 2.3 `useFavorits`: helpers `toggleParada`/`toggleLinia` que accepten l'operador; `isFav` per (operator,id)
  - [x] 2.4 Verificar que els ★ existents de TMB no es trenquen (referencial + persistència)
  - [x] 2.5 Tests del store (FGC + migració)
  - [x] 2.6 `lint + test + build` i push

- [x] 3.0 Mode FGC complet al header
  - [x] 3.1 `mockup-fgc.html` (mode + marcador FGC) i validar-ne l'estil abans de la UI
  - [x] 3.2 `src/utils/fgcMarkerIcon.ts` + `FgcLayer.tsx`: marcador FGC distingible (≠ cercles TMB, quadrats Bicing, mini Cooltra) amb estrella de favorit (reusar `favStarIcon`)
  - [x] 3.3 `useFgcLinies` (filtre/ordre/cerca) i `useFgcParades` (parades + shape de la línia seleccionada)
  - [x] 3.4 `FgcView.tsx`: reaprofitar `LineList`, `SearchInput`, `SortControls`, toggle mapa/llista i `MapView` (recorregut amb el color de línia via shape)
  - [x] 3.5 `FgcStationPopup.tsx`: dades de la parada + accions (Ruta fins aquí + caminant + Compartir)
  - [x] 3.6 ★ a línies i parades FGC (via `useFavorits` del 2.0)
  - [x] 3.7 Substituir el placeholder de `App.tsx` per `<FgcView />`
  - [x] 3.8 `lint + test + build` i push

- [x] 4.0 Integració d'FGC a "Aprop meu"
  - [x] 4.1 `useFgcStations` (totes les parades FGC) i barrejar-les a la llista unificada per proximitat (numerades)
  - [x] 4.2 Marcadors FGC al mapa d'Aprop meu (reusar `FgcLayer`) respectant radi + "guinyo" en tocar la fila
  - [x] 4.3 Filtre FGC: estendre `FilterType`/`FilterBar` amb un toggle FGC; persistència `tmb-aprop-fgc-filter-v1`
  - [x] 4.4 Capçalera de comptadors amb el recompte d'FGC (igual que parades/Bicing)
  - [x] 4.5 Tests del filtre (`FilterBar` / utilitat)
  - [x] 4.6 `lint + test + build` i push

- [x] 5.0 Temps real FGC
  - [x] 5.1 Decidir la via RT (records JSON d'Opendatasoft vs GTFS-RT protobuf) després de validar en una Pages Function de prova
  - [x] 5.2 `api/fgc/temps-real.ts` (arribades per parada) i `api/fgc/vehicles.ts` (posicions per línia); afegir decoder protobuf lleuger si cal
  - [x] 5.3 Arribades RT al `FgcStationPopup` i a la llista d'Aprop meu (format minuts com TMB)
  - [x] 5.4 `useFgcVehicles` + pintar posicions al mapa del mode FGC (refresc periòdic)
  - [x] 5.5 `RefreshControl` + `VehicleVisibilityToggle` al mode FGC (reusar)
  - [x] 5.6 Cache + Toast no bloquejant si el RT falla (no bloqueja la part estàtica)
  - [x] 5.7 `lint + test + build` i push

- [ ] 6.0 Mockups, tests, verificació del feed en producció i desplegament
  - [ ] 6.1 Validar el feed real en producció (URLs, API key si cal, `route_color`/`shapes`/noms) i ajustar `_fgc.ts`
  - [ ] 6.2 Afegir credencials a Cloudflare Pages (Variables and Secrets, Production) si calen + re-deploy
  - [ ] 6.3 Suite Vitest verda + tests nous; cobrir casos límit del normalitzador
  - [ ] 6.4 `lint + build` nets; comprovar no-regressió de TMB/Bicing/Cooltra/Ruta
  - [ ] 6.5 Merge a `main` + desplegament; actualitzar `HANDOVER.md` amb la integració FGC

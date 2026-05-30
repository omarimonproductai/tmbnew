# Tasks: Integració de Bicing (GBFS)

> Basat en `tasks/prd-bicing.md`. Convenció: una branca per parent task (veure CLAUDE.md §5);
> verificar `lint + build + test` abans de cada push; PR + squash-merge a `main`.

## Relevant Files

- `functions/_bicing.ts` - Helper backend: fetch dels feeds GBFS i normalització a `BicingStation`.
- `functions/api/bicing/stations.ts` - Endpoint Pages Function que retorna les estacions normalitzades.
- `src/types/bicing.ts` - Interfície `BicingStation` (i tipus auxiliars de filtre).
- `src/services/bicing.ts` - Client frontend del fetch a `/api/bicing/stations`.
- `src/hooks/useBicingStations.ts` - Hook amb refresc 60s + cache localStorage + fallback/Toast.
- `src/hooks/useBicingStations.test.ts` - Tests del hook (cache fallback, mapping).
- `src/utils/bicingFilter.ts` - Lògica de filtre per disponibilitat (elèctric/mecànic) compartida.
- `src/utils/bicingFilter.test.ts` - Tests de la lògica de filtre.
- `src/components/BicingLayer.tsx` - Capa de marcadors d'estació (CircleMarker + bringToBack) reutilitzable.
- `src/components/BicingStationPopup.tsx` - Popup/contingut amb detalls d'estació (nom, dist, elèc/mec, docks, estat) + estrella.
- `src/components/BicingStationRow.tsx` - Fila de llista d'estació (Aprop meu) amb detalls + estrella.
- `src/components/BicingFilters.tsx` - Els dos xips/filtres elèctric·mecànic (desmarcables, estil compacte).
- `src/components/BicingView.tsx` - Vista del nou mode "Bicing" (mapa complet + filtres).
- `src/components/AproperMeuView.tsx` - Integració de la capa + secció de llista + xips a Aprop meu.
- `src/components/AproperMeuMap.tsx` - Render de la capa Bicing al mapa d'Aprop meu.
- `src/components/ParadesAprop.tsx` - (o nou contenidor) secció pròpia "Estacions Bicing a prop".
- `src/components/ModeToggle.tsx` - Afegir el 5è mode "Bicing" amb icona "B".
- `src/components/ModeToggle.test.tsx` - Actualitzar tests del toggle.
- `src/App.tsx` - Routing del nou mode.
- `src/stores/favorits.ts` - Tercer bucket de favorits per estacions Bicing.
- `src/hooks/useFavorits.ts` - Exposar `isBicingFav` / `toggleBicing`.
- `src/components/FavoritsView.tsx` - Mostrar estacions Bicing barrejades amb parades.
- `src/components/FavMap.tsx` - Render d'estacions Bicing favorites + estrella daurada.
- `src/utils/favStarIcon.ts` - (existent) reaprofitar per l'estrella daurada al mapa.
- `src/types/tmb.ts` - Afegir `FavBicing` si cal.
- `src/App.css` - Estils dels xips compactes, marcador i popup Bicing.
- `mockup-bicing.html` - Mockup de mode Bicing + popup + xips (arrel del repo).

### Notes

- Tests amb Vitest: `npm test` (tot) o `npx vitest run <path>` (un fitxer).
- **Regla d'or**: verificar la forma REAL dels feeds GBFS amb una crida abans de parsejar (camps i `vehicle_type_id` poden diferir de l'spec). Cal afegir `barcelona.publicbikesystem.net` a l'allowlist de dev.
- Reaprofitar patrons de Cooltra (`_cooltra.ts`, `CooltraLayer.tsx`, `useCooltraVehicles.ts`) i el patró `CircleMarker` + `bringToBack()` (evitar custom panes/DivIcon).
- Patró `FilterType = 'tots' | 'cap' | ...` ja existent per als xips desmarcables.

## Tasks

> Desenvolupat tot de seguit sobre la branca de sessió `claude/claude-md-onboarding-2edbL`
> (no s'han obert branques/PR per parent task; el merge a `main` el farà l'usuari després de
> revisar). `lint + build + test` verificats al final (59 tests OK).
> **Pendents reals**: 1.1 (verificació en viu del feed — bloquejada per l'allowlist de xarxa
> d'aquest entorn) i 2.4 (confirmació del mockup amb l'usuari — variant escollida a `mockup-bicing.html`).

- [x] 0.0 Create feature branch
  - [x] 0.1 Treball sobre la branca de sessió assignada

- [ ] 1.0 Backend + capa de dades: proxy GBFS, normalització, tipus, servei i hook
  - [ ] 1.1 ⚠️ Verificar la forma real del feed en viu — **NO fet** (host fora de l'allowlist d'aquest entorn). Normalització feta de forma defensiva (v2/v3); cal validar abans de produir
  - [x] 1.2 `functions/_bicing.ts`: discovery → feeds; mapping `vehicle_types`; merge a `BicingStation`
  - [x] 1.3 `functions/api/bicing/stations.ts` amb capçaleres de cache curtes
  - [x] 1.4 `src/types/bicing.ts`
  - [x] 1.5 `src/services/bicing.ts`
  - [x] 1.6 `src/hooks/useBicingStations.ts` (refresc 60s + cache + fallback)
  - [x] 1.7 `src/utils/bicingFilter.ts` + tests
  - [x] 1.8 Test de `useBicingStations`; lint+build+test

- [ ] 2.0 Mockup HTML (abans de construir UI)
  - [x] 2.1 `mockup-bicing.html` (mode + popup + fila + xips)
  - [x] 2.2 Variants de xips compactes (icona + label curt escollida)
  - [x] 2.3 Marcador d'estació diferenciat (badge quadrat vermell amb "B"/recompte)
  - [ ] 2.4 ⚠️ Acordar el mockup amb l'usuari — **pendent de revisió** (vist que es demana fer-ho tot seguit)

- [x] 3.0 Component compartit de capa Bicing (marcadors + popup amb detalls)
  - [x] 3.1 `BicingStationPopup.tsx`
  - [x] 3.2 `FavStar` al popup (cablejat amb el store)
  - [x] 3.3 `BicingLayer.tsx` (Marker DivIcon + popup interactiu)
  - [x] 3.4 Estils a `App.css`
  - [x] 3.5 lint+build+test

- [x] 4.0 Integració a "Aprop meu"
  - [x] 4.1 `BicingFilters.tsx` + `useBicingFilter` (persistència `tmb-aprop-bicing-filter-v1`)
  - [x] 4.2 `AproperMeuView`: estacions per radi + `bicingFilter`
  - [x] 4.3 `AproperMeuMap`: capa `BicingLayer` filtrada
  - [x] 4.4 Secció "Estacions Bicing a prop · N" fora del recompte de parades
  - [x] 4.5 `BicingStationRow.tsx`
  - [x] 4.6 Xips Bicing al costat de Metro/Bus
  - [x] 4.7 lint+build+test

- [x] 5.0 Mode "Bicing" nou
  - [x] 5.1 `ModeToggle.tsx` 5è mode "Bicing" + test
  - [x] 5.2 `App.tsx` routing
  - [x] 5.3 `BicingView.tsx` (totes les estacions)
  - [x] 5.4 Filtres + persistència `tmb-bicing-filter-v1`
  - [x] 5.5 Controls (recentrar, dot d'usuari, fit)
  - [x] 5.6 lint+build+test

- [x] 6.0 Favorits d'estacions
  - [x] 6.1 `stores/favorits.ts` tercer bucket (`tmb-fav-bicing`)
  - [x] 6.2 `useFavorits.ts` exposa `favBicing`/`isBicingFav`/`toggleBicing`
  - [x] 6.3 `FavStar` cablejat a popup i fila
  - [x] 6.4 Estrella daurada al marcador favorit
  - [x] 6.5 `FavoritsView.tsx` estacions barrejades amb parades
  - [x] 6.6 `FavMap.tsx` estacions favorites
  - [x] 6.7 lint+build+test

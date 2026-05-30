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

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Pull `main`, crear i checkout `task/bicing-1.0-backend` des de `main`, push a remot (la primera parent task; les següents obriran la seva pròpia branca)

- [ ] 1.0 Backend + capa de dades: proxy GBFS, normalització, tipus, servei i hook
  - [ ] 1.1 Afegir `barcelona.publicbikesystem.net` a l'allowlist de l'entorn de dev i fer una crida real a `gbfs.json`, `station_information`, `station_status` i `vehicle_types` per **verificar la forma real** (camps, ids de tipus)
  - [ ] 1.2 Crear `functions/_bicing.ts`: llegir discovery → feeds; mapejar `vehicle_types` (human → mecànic, electric_assist/electric → elèctric); merge `station_information` + `station_status` a `BicingStation` (id, name, lat, lng, capacity, bikesElectric, bikesMechanical, docksAvailable, status, lastReported)
  - [ ] 1.3 Crear `functions/api/bicing/stations.ts`: retornar l'array normalitzat amb capçaleres de cache curtes (browser sí, CDN no-store)
  - [ ] 1.4 Crear `src/types/bicing.ts` (`BicingStation`, tipus de filtre)
  - [ ] 1.5 Crear `src/services/bicing.ts` (fetch + parse de `/api/bicing/stations`)
  - [ ] 1.6 Crear `src/hooks/useBicingStations.ts`: refresc cada 60s, cache a `localStorage` (`tmb-bicing-stations-v1`), fallback + Toast si falla el fetch
  - [ ] 1.7 Crear `src/utils/bicingFilter.ts` + tests: donada una estació i l'estat dels xips (elèctric/mecànic, amb `'cap'`), decidir si es mostra (per disponibilitat real)
  - [ ] 1.8 Test de `useBicingStations` (cache fallback i normalització bàsica); `lint + build + test`; PR + merge

- [ ] 2.0 Mockup HTML (abans de construir UI)
  - [ ] 2.1 Crear `mockup-bicing.html` amb: el mode Bicing (mapa + 2 filtres), el popup de detalls i la fila de llista
  - [ ] 2.2 Provar 2–3 variants de **xips compactes** (icona-sols ⚡/bici vs icona+xifra) i triar-ne una
  - [ ] 2.3 Dissenyar el **marcador d'estació** diferenciat del vermell TMB/Cooltra (forma/glif "B") i validar contrast
  - [ ] 2.4 Acordar amb l'usuari la variant escollida abans d'implementar

- [ ] 3.0 Component compartit de capa Bicing (marcadors + popup amb detalls)
  - [ ] 3.1 Crear `src/components/BicingStationPopup.tsx`: nom, distància (opcional), bicis elèctriques/mecàniques, ancoratges lliures + capacitat, estat
  - [ ] 3.2 Integrar `FavStar` al popup (placeholder fins a 6.0; cablejar a 6.0)
  - [ ] 3.3 Crear `src/components/BicingLayer.tsx`: render d'estacions amb `CircleMarker` (+ `bringToBack()` si cal), marcador segons mockup, popup en clicar
  - [ ] 3.4 Estils a `App.css` per marcador i popup Bicing
  - [ ] 3.5 `lint + build + test`; PR + merge

- [ ] 4.0 Integració a "Aprop meu"
  - [ ] 4.1 Crear `src/components/BicingFilters.tsx` (xips elèctric/mecànic, compactes, desmarcables → estat tipus `'tots' | 'cap' | 'electric' | 'mecanic'`), persistència `tmb-aprop-bicing-filter-v1`
  - [ ] 4.2 A `AproperMeuView`: carregar estacions amb `useBicingStations`, limitar per radi (reutilitzar utils de distància) i aplicar `bicingFilter`
  - [ ] 4.3 A `AproperMeuMap`: pintar la capa `BicingLayer` filtrada (per defecte visible)
  - [ ] 4.4 Afegir secció pròpia a la llista ("Estacions Bicing a prop · N") amb `BicingStationRow`, **separada** de les parades i **fora** del recompte "X parades a prop"
  - [ ] 4.5 Crear `src/components/BicingStationRow.tsx` (detalls + estrella + distància)
  - [ ] 4.6 Col·locar els xips Bicing a la UI d'Aprop meu (al costat dels Metro/Bus, compactes)
  - [ ] 4.7 `lint + build + test`; PR + merge

- [ ] 5.0 Mode "Bicing" nou
  - [ ] 5.1 `ModeToggle.tsx`: afegir 5è mode "Bicing" amb icona "B" (només icona a mòbil), al costat de Línies; actualitzar `ModeToggle.test.tsx`
  - [ ] 5.2 `App.tsx`: afegir el routing del nou mode (`useState` existent)
  - [ ] 5.3 Crear `src/components/BicingView.tsx`: mapa amb TOTES les estacions (sense radi) via `BicingLayer`
  - [ ] 5.4 Afegir els filtres elèctriques/mecàniques (reusar `BicingFilters`), persistència `tmb-bicing-filter-v1`
  - [ ] 5.5 Controls de mapa coherents (recentrar, dot d'usuari si hi ha posició) reaprofitant patrons existents
  - [ ] 5.6 `lint + build + test`; PR + merge

- [ ] 6.0 Favorits d'estacions
  - [ ] 6.1 `stores/favorits.ts`: tercer bucket per estacions Bicing (`tmb-fav-bicing`), amb subscribe/snapshot/toggle
  - [ ] 6.2 `useFavorits.ts`: exposar `favBicing`, `isBicingFav`, `toggleBicing`
  - [ ] 6.3 Cablejar `FavStar` al popup (3.2) i a la fila (4.5) d'estació
  - [ ] 6.4 Estrella daurada sobre el marcador d'estació favorita a `BicingLayer` (reaprofitar `favStarIcon`)
  - [ ] 6.5 `FavoritsView.tsx`: mostrar estacions Bicing **barrejades amb les parades** (sense secció pròpia), ordenades amb la resta; render amb detalls Bicing
  - [ ] 6.6 `FavMap.tsx`: pintar estacions Bicing favorites (amb estrella daurada)
  - [ ] 6.7 `lint + build + test`; PR + merge

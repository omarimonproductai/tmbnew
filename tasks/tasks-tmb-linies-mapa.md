# Tasks: TMB Línies i Mapa de Parades

## Relevant Files

- `src/main.tsx` - Punt d'entrada de l'aplicació React
- `src/App.tsx` - Component arrel amb el layout split-view principal
- `src/App.test.tsx` - Tests del component arrel
- `src/components/FilterBar.tsx` - Botons de filtre per tipus de transport
- `src/components/FilterBar.test.tsx` - Tests dels filtres
- `src/components/LineList.tsx` - Llistat de línies amb badge de color
- `src/components/LineList.test.tsx` - Tests del llistat
- `src/components/SearchInput.tsx` - Camp de cerca de línies
- `src/components/MapView.tsx` - Component del mapa Leaflet
- `src/components/StopMarker.tsx` - Marcador de parada al mapa
- `src/components/StopPopup.tsx` - Popup d'informació i temps real
- `src/hooks/useLinies.ts` - Hook per obtenir i filtrar línies de l'API
- `src/hooks/useParades.ts` - Hook per obtenir parades d'una línia
- `src/hooks/useTempsReal.ts` - Hook per obtenir temps real d'arribada
- `src/services/tmb.ts` - Funcions de crida a l'API de TMB
- `src/types/tmb.ts` - Tipus TypeScript (Linia, Parada, TempsReal)
- `.env.example` - Plantilla de variables d'entorn (commitejat)
- `.env.local` - Credencials reals de TMB (NO commitejat, afegir a .gitignore)
- `vite.config.ts` - Configuració de Vite (base URL per a GitHub Pages)
- `.github/workflows/deploy.yml` - Workflow de desplegament automàtic a GitHub Pages

### Notes

- Tests unitaris col·locats al costat dels arxius que proven (`Component.tsx` → `Component.test.tsx`).
- Usar `npm test` per executar els tests.
- Les credencials de l'API de TMB mai s'han de commitejar. Usar `.env.local` localment i GitHub Secrets per al desplegament.
- Verificar CORS de l'API TMB abans de la tasca 2: si no permet crides des del navegador, caldrà un proxy lleuger via Netlify Functions (pla gratuït).

## Instructions for Completing Tasks

**IMPORTANT:** A mesura que completis cada tasca, marca-la canviant `- [ ]` per `- [x]`.

Exemple:
- `- [ ] 1.1 Inicialitzar projecte` → `- [x] 1.1 Inicialitzar projecte` (després de completar)

Actualitza l'arxiu després de cada sub-tasca, no només al final de la tasca pare.

---

## Tasks

- [ ] 0.0 Crear la branca de la feature
  - [ ] 0.1 Crear i fer checkout de la branca `feature/tmb-linies-mapa` des de `main`
  - [ ] 0.2 Fer push de la branca buida al remot per establir el tracking

- [ ] 1.0 Configuració inicial del projecte (React + Vite)
  - [ ] 1.1 Inicialitzar el projecte amb `npm create vite@latest` seleccionant React + TypeScript
  - [ ] 1.2 Instal·lar dependències: `leaflet`, `react-leaflet`, `@types/leaflet`
  - [ ] 1.3 Crear l'arxiu `.env.example` amb les variables `VITE_TMB_APP_ID` i `VITE_TMB_APP_KEY` buides
  - [ ] 1.4 Afegir `.env.local` al `.gitignore`
  - [ ] 1.5 Crear l'estructura de carpetes: `src/components/`, `src/hooks/`, `src/services/`, `src/types/`
  - [ ] 1.6 Verificar que `npm run dev` arrenca correctament

- [ ] 2.0 Integració amb l'API de TMB
  - [ ] 2.1 Registrar-se a developer.tmb.cat i obtenir `app_id` i `app_key` gratuïts
  - [ ] 2.2 Definir els tipus TypeScript a `src/types/tmb.ts` (Linia, Parada, TempsReal)
  - [ ] 2.3 Crear `src/services/tmb.ts` amb la funció `getLinies()` que crida `GET /v1/transit/linies`
  - [ ] 2.4 Afegir la funció `getParades(liniaId)` que crida `GET /v1/transit/linies/{id}/parades`
  - [ ] 2.5 Verificar si l'API permet crides directes des del navegador (CORS); si no, documentar la necessitat d'un proxy
  - [ ] 2.6 Crear el hook `src/hooks/useLinies.ts` que crida `getLinies()` i gestiona loading/error
  - [ ] 2.7 Crear el hook `src/hooks/useParades.ts` que crida `getParades()` quan canvia la línia seleccionada

- [ ] 3.0 Llistat de línies amb filtres i cerca
  - [ ] 3.1 Crear el component `FilterBar.tsx` amb botons per a cada tipus de transport (Tots, Metro, Bus, Tramvia, FGC, Rodalies)
  - [ ] 3.2 Crear el component `SearchInput.tsx` amb un input de text per cercar per nom o identificador de línia
  - [ ] 3.3 Crear el component `LineList.tsx` que renderitza cada línia amb badge de color, nom, tipus i nombre de parades
  - [ ] 3.4 Implementar la lògica de filtratge per tipus i cerca per text al hook `useLinies.ts`
  - [ ] 3.5 Afegir l'estat de selecció de línia i ressaltat visual de la línia activa
  - [ ] 3.6 Mostrar un estat de càrrega (skeleton o spinner) mentre s'obtenen les línies de l'API
  - [ ] 3.7 Mostrar un missatge d'error si la crida a l'API falla

- [ ] 4.0 Mapa interactiu amb Leaflet i parades
  - [ ] 4.1 Crear el component `MapView.tsx` amb el mapa de Leaflet centrat a Barcelona (lat: 41.3874, lng: 2.1686, zoom: 13)
  - [ ] 4.2 Configurar els tiles d'OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) amb l'atribució correcta
  - [ ] 4.3 Crear el component `StopMarker.tsx` que renderitza un marcador circular amb el color de la línia
  - [ ] 4.4 Crear el component `StopPopup.tsx` que mostra nom de la parada i badge de la línia (el temps real s'afegirà a la tasca 5)
  - [ ] 4.5 Dibuixar la polilínia del recorregut entre parades amb el color de la línia seleccionada
  - [ ] 4.6 Fer zoom automàtic (`fitBounds`) al recorregut complet de la línia quan es selecciona
  - [ ] 4.7 Marcar les parades terminals (primera i última) amb un marcador més gran

- [ ] 5.0 Dades en temps real d'arribada de vehicles
  - [ ] 5.1 Verificar la disponibilitat gratuïta de l'endpoint iBus (`GET /v1/ibus/lines/{line}/stops/{stop}`)
  - [ ] 5.2 Si és accessible: crear `src/hooks/useTempsReal.ts` que crida l'endpoint en obrir el popup d'una parada
  - [ ] 5.3 Afegir el temps d'arribada (en minuts) al `StopPopup.tsx`
  - [ ] 5.4 Implementar refresc automàtic de les dades cada 30 segons mentre el popup és obert
  - [ ] 5.5 Si l'endpoint NO és gratuït: mostrar al popup un missatge "Temps real no disponible" i documentar-ho al README

- [ ] 6.0 Responsive: layout mòbil
  - [ ] 6.1 Implementar el layout split-view per a escriptori: panell lateral (320px) + mapa (resta d'amplada)
  - [ ] 6.2 Implementar el layout mòbil (<640px): mapa a la part superior (55vh) + panell inferior amb scroll (45vh)
  - [ ] 6.3 Verificar que el mapa crida `invalidateSize()` quan el layout canvia per evitar renderitzats incorrectes
  - [ ] 6.4 Testar en Chrome i Firefox a escriptori i mòbil (mínim 390px d'amplada)

- [ ] 7.0 Desplegament a GitHub Pages
  - [ ] 7.1 Configurar `vite.config.ts` amb `base: '/rutas-comerciales/'` (o el nom del repositori)
  - [ ] 7.2 Afegir `VITE_TMB_APP_ID` i `VITE_TMB_APP_KEY` com a secrets del repositori a GitHub Settings
  - [ ] 7.3 Crear `.github/workflows/deploy.yml` amb el workflow que fa build i publica a la branca `gh-pages`
  - [ ] 7.4 Activar GitHub Pages al repositori apuntant a la branca `gh-pages`
  - [ ] 7.5 Verificar que l'app funciona correctament a l'URL de GitHub Pages

# HANDOVER — "Tu et Mous Bé"

> Aquest document té dues parts. La **part A** és el *prompt* que ha de llegir un agent
> que comenci una sessió de zero per arrancar productiu. La **part B** és la visió de
> producte i el roadmap (per què existeix l'app i cap on va). El context **tècnic**
> detallat (stack, restriccions, dev local, convenis de codi) viu a
> [`CLAUDE.md`](./CLAUDE.md).

---

## Part A · Prompt per a una sessió nova

Copia-ho al primer missatge de la sessió nova per posar-la al dia ràpid.

> **Qui ets.** Treballes a l'app **Tu et Mous Bé** (`omarimonproductai/tmbnew`), una PWA
> per a metro/bus de TMB Barcelona feta amb React 18 + TypeScript + Vite, desplegada
> a Cloudflare Pages (`tuetmousbe.pages.dev`). Tota la lògica de backend viu a
> `functions/` com a Cloudflare Pages Functions. Cada merge a `main` desplega
> automàticament a producció en 2–3 minuts (no hi ha staging).
>
> **Abans de tocar res:**
> 1. Llegeix `CLAUDE.md` (convencions tècniques i de comportament — pensar abans de
>    codi, simplicitat, canvis quirúrgics, branca per parent task, etc.).
> 2. Llegeix aquest `HANDOVER.md` sencer (la part B té la visió de producte).
> 3. Si hi ha PRD/tasks actius pertinents, mira també `tasks/`.
>
> **Treball:** sempre a la branca que la sessió t'hagi assignat; commits petits i
> descriptius; `npm run lint && npm run build && npm test` abans de cada push;
> PR + squash-merge a `main` quan el canvi sigui llest. **⚠️ Workflow git real
> (última sessió):** el servidor OAuth del **MCP de GitHub estava caigut**, així
> que els merges es van fer **directament amb `git`** (`main` NO té protecció de
> branca): la branca de feature era exactament `main` + commits nous → `git
> checkout main && git merge --ff-only <branca> && git push origin main`. Si el
> MCP de GitHub torna a funcionar, pots tornar als PRs; si no, el push directe a
> `main` és vàlid i desplega igual.
>
> **Sis modes al header** (esquerra→dreta): Línies (icona "TMB" monocroma) ·
> Bicing · **FGC** · Ruta · Aprop meu · ★ Favorits.
>
> **Tres regles d'or:**
> 1. **No confiïs en docs que prometen un format.** L'API de TMB i la de Cooltra van
>    diferir del que deia el manual (camps amb forma diferent, unitats diferents).
>    Verifica sempre amb una crida real abans de processar.
> 2. **Sigues curós amb les classes CSS compartides entre vistes.** Per exemple
>    `.panel` té regles pensades per al bottom-sheet d'Aprop meu (`height: 55vh`,
>    `display: none` per defecte a mòbil) que poden contaminar altres vistes si
>    reutilitzes la classe.
> 3. **Branca neta per cada feature.** En fer squash-merge, la branca origen queda
>    divergent — si la reutilitzes per una segona ronda hi haurà conflictes. Obre
>    una branca nova des de `main` cada vegada.
>
> Quan tinguis preguntes ambigües, **pregunta primer** (regla 1 de `CLAUDE.md`).
> Si la solució més òbvia trenca un patró establert, dilo i proposa alternatives.
>
> Mira el bloc "**Estat de producció actual**" més avall. L'última sessió va aterrar
> la integració completa d'**FGC** com a segon operador (mode propi idèntic a TMB,
> Aprop meu, favorits i **temps real GTFS‑RT** descodificant protobuf), va unificar
> **tots els refrescos a 30 s** i va fer netes diverses incoherències d'UI. **Llegeix
> la secció "FGC (Ferrocarrils)" sencera** abans de tocar res d'FGC. No reinventis
> components que ja existeixen.
>
> **Workflow d'aquesta sessió:** s'ha treballat i fet **push directe a `main`** (sense
> PR; `main` no té protecció i Cloudflare desplega sol). El `prebuild` regenera les
> dades reals d'FGC a cada deploy. `npm run lint && npm test && npm run build` verds
> abans de cada push.

---

## Part B · Visió, estat i roadmap

### Tesi central
L'app és avui un **visor + planificador** de mobilitat a Barcelona. Filosofia de
recursos: **cost zero (Cloudflare free)** fins que una mètrica clara justifiqui
pagar. Volem convertir-la en eina de rutina diària, no només consulta puntual.

### Estat de producció actual

#### Sis modes al header
Icones SVG monocromes (`currentColor`, s'adapten a blanc sobre la barra / vermell
sobre la píndola activa). A mòbil només icones, a tablet+ icona + label.
- 🧭 **Ruta** — planificador A→B (TMB Planner + geocoder Photon)
- **TMB Línies** — explorador de línies amb mapa o llista. Icona = wordmark
  "TMB" monocrom dins d'un quadrat arrodonit (`ModeToggle.tsx`, inline SVG; NO
  el PNG `public/logo-tmb.png`, que es fonia amb la barra vermella).
- **FGC** — explorador de línies FGC (mode nou; veure secció pròpia). Icona =
  `FgcLogo` (isotip de les baules entrellaçades inline, `currentColor`).
- 🅱️ **Bicing** — estacions Bicing (veure secció pròpia). Icona =
  `BicingLogo` (`public/bicing-logo.svg` inline, `currentColor`).
- 🎯 **Aprop meu** — parades TMB + FGC + estacions Bicing a la rodona amb GPS i radi.
- ⭐ **Favorits** — parades/línies/estacions (TMB + FGC + Bicing) amb llista o mapa.

Component: `src/components/ModeToggle.tsx`. Routing simple via `useState` a `App.tsx`.

#### Filtres Metro / Bus (Aprop meu i Línies)
Dos toggles independents — ja no existeix "Tots". Per defecte tots dos ON. **Ara
SÍ es poden desmarcar tots dos** (estat `'cap'` → no mostra res); això es va
demanar explícitament. Quan un xip està desmarcat el marge queda gris (el
`:hover` vermell es protegeix amb `@media (hover: hover)` per evitar el sticky
hover a mòbil). Persistència separada:
- `tmb-aprop-meu-filter-v1`
- `tmb-linies-filter-v1`

Internament `FilterType = 'tots' | 'cap' | 'metro' | 'bus'` (el FilterBar tradueix
els dos toggles a aquest valor unificat).

#### Capa Cooltra (motos + bicis)
Botó rodó al cantó superior dret de cada mapa amb el logo Cooltra
(`public/cooltra-logo.jpg`, blau `#3080e0` extret del logo real). Quan està actiu:
- ~1700–1800 punts mini Ø10 amb doble anell:
  - 🛵 motos: anell `#1e5fa8` + farciment `#3080e0`
  - 🚲 bicis: anell `#04fc04` + farciment `#00c853`
- Apareixen 2 filtres extra (motos / bicis) per amagar/mostrar cada tipus,
  amb les siluetes blanques aplicades via CSS `mask-image` a partir de
  `public/cooltra-{moto,bike}.png` (PNGs amb canal alfa real, no RGB).
- Pop-up amb plate, autonomia (km) i CTA blau "Reserva gratis" →
  `link.cooltra.com/reserve?vehicle_id={id}`
- `useCooltraVehicles` refresca cada 60 s
- localStorage: `tmb-cooltra-visible-v1`, `tmb-cooltra-kinds-v1`
- L'estat es comparteix entre les 3 vistes amb mapa (Aprop meu, Línies, Favorits)

Backend: `functions/_cooltra.ts`, `functions/api/cooltra/{vehicles,systems}.ts`.

**Credencials a Cloudflare Pages**: `ZEUS_KEY_PROD` / `ZEUS_KEY_STAGE` (atenció:
NO `ZEUS_API_*` — el manual de Cooltra mentia).

**Forma REAL de l'API de Cooltra** (≠ del que diu el manual MaaS):
- `position`: `[lng, lat]` (array GeoJSON) — NO `{lat, lon}` object
- `range`: en **metres** — NO km
- `model_id`: número (6 = moto, 13 = bici) — NO string
- Alguns vehicles arriben amb `position` undefined → cal filtrar abans de fer
  `L.marker([lat, lng])` o petarà tota l'app

#### Bicing (estacions GBFS) — mode nou + capa a Aprop meu + favorits
PRD/tasks a `tasks/prd-bicing.md` i `tasks/tasks-bicing.md`. Mockups:
`mockup-bicing.html` i `mockup-bicing-markers.svg`.

**Backend** (`functions/`): `_bicing.ts` (normalitzador defensiu del feed GBFS
v3.0) + `api/bicing/stations.ts` (proxy públic, SENSE credencials). Feed:
`https://barcelona.publicbikesystem.net/customer/gbfs/v3.0/gbfs.json`.
- ⚠️ **NO s'ha pogut verificar el feed en viu** (l'entorn d'aquesta sessió tenia
  el host fora de l'allowlist de xarxa; en producció les Pages Functions hi
  accedeixen sense problema). El normalitzador gestiona variants v2/v3 (noms
  localitzats `[{text,language}]` vs string, `last_reported` epoch vs RFC3339,
  `vehicle_types_available`) però **cal validar-lo contra el feed real** abans de
  refiar-se'n (regla d'or). `BicingStation` exposa: id, name, lat, lng, capacity,
  bikesElectric, bikesMechanical, docksAvailable, status, lastReported.

**Frontend**: `types/bicing.ts`, `services/bicing.ts`, `hooks/useBicingStations.ts`
(refresc 60 s + cache `tmb-bicing-stations-v1` + fallback/Toast), `hooks/useBicingFilter.ts`,
`utils/bicingFilter.ts` (+tests), `components/Bicing{Layer,StationPopup,StationRow,Filters}.tsx`,
`components/BicingView.tsx` (mode), `components/BicingLogo.tsx`.

**Model de filtre (intenció, NO tipus):** `BicingFilterState = { action:
'agafar' | 'retornar' | 'cap' }`. Decisió de producte clau:
- **Agafar** → mostra TOTES les estacions (les buides es pinten en GRIS, no
  s'amaguen, perquè no semblin error de dades). Marcador = quadrat partit verd
  (elèctriques) | groc (mecàniques); col·lapsa a un sol color si un tipus és 0;
  gris amb "0" si està buida.
- **Retornar** → estacions amb ancoratges lliures (`docksAvailable > 0`).
  Marcador = quadrat VERMELL amb contorn NEGRE i número blanc. **No hi ha
  distinció elèctric/mecànic al retorn** (qualsevol ancoratge accepta qualsevol
  bici — es va eliminar el selector de tipus per al retorn).
- **Mode Bicing**: agafar/retornar són **radio** (sempre un, mai `'cap'` →
  mai mapa en blanc). A **Aprop meu** sí es poden desmarcar tots dos.
- Persistència: `tmb-aprop-bicing-filter-v1` (Aprop meu) i `tmb-bicing-filter-v1`
  (mode Bicing).
- Els xips a Aprop meu són pills amb logo "b" + fletxa (agafar=fletxa surt,
  retornar=fletxa entra, estil log-out/log-in). Al **mode Bicing** són rodons
  i només la fletxa (sense logo, ja ets en context Bicing).

**Marcador**: quadrat (DivIcon, NO custom pane) — forma diferent dels punts
rodons de TMB/Cooltra per identificar Bicing ràpid. Estrella daurada de favorit a
sobre (reusa `utils/favStarIcon.ts`); al **mapa de Favorits** s'amaga l'estrella
(`showFavStar={false}`, ja ets en context favorits). Clic a la fila → "guinyo"
del quadrat (pulse CSS + tooltip).

**Favorits d'estacions**: 3r bucket al store (`tmb-fav-bicing`); `useFavorits`
exposa `favBicing`/`isBicingFav`/`toggleBicing`. Al mode ★ les estacions surten
**barrejades amb les parades** (sense secció pròpia) i al `FavMap`.

**Popup d'estació** (`BicingStationPopup`, compartit Aprop meu/mode/Favorits):
nom, estat, distància, elèctriques/mecàniques, ancoratges, capacitat + accions
**"Ruta fins aquí" + caminant (Apple/Google Maps a peu) + Compartir** (comparteix
un enllaç de mapa, no `?parada=`).

#### FGC (Ferrocarrils) — segon operador complet (mode + Aprop meu + favorits + temps real)
PRD/tasks a `tasks/prd-fgc.md` i `tasks/tasks-fgc.md`. **Estat: a producció i funcional**
(mode, mapa, llista, favorits i temps real). FGC és el **segon operador** real de l'app.

**Inclusió:** línies amb **connexió directa a Barcelona** (≥1 parada dins una bbox del terme
de Barcelona): Barcelona‑Vallès (L6/L7/L12/S1/S2/…) i Llobregat‑Anoia (L8/S3/S4/R5/R6/R50/
R60/…) + el Funicular de Vallvidrera. Es mostra la **línia sencera** (parades fora de BCN incloses).

##### Dades estàtiques (línies/parades/colors) — `npm run build:fgc`
- `scripts/build-fgc-data.mjs` baixa el **GTFS oficial** (`https://www.fgc.cat/google/google_transit.zip`,
  amb `fflate` per descomprimir), filtra rutes amb connexió a Barcelona, **deduplica per codi**
  (es queda la variant amb més parades), **descarta parades amb coords invàlides** i emet
  **dos fitxers**: `src/data/fgcStatic.ts` (`FGC_LINES`, `FGC_STOPS`, `FGC_LINE_STOPS`,
  `FGC_ROUTE_IDS`) i `src/data/fgcTrips.ts` (`FGC_TRIPS`: `trip_id → {c: línia, h: headsign}`).
- ⚠️ **Important:** ara el script SÍ s'executa com a **`prebuild`** (a `package.json`), o sigui
  que **cada `npm run build` (i per tant cada deploy a Cloudflare) regenera les dades reals**.
  És **no‑fatal**: si FGC és inabastable (p. ex. l'allowlist de dev), avisa i **manté el
  fitxer existent** sense trencar el build. Els fitxers committats són un **seed curat**
  (línies BCN amb coords reals) que serveix de fallback; en prod es reemplacen pel GTFS complet.
- Derivacions pures (línies, detall+geometria stop‑to‑stop, parades‑all, `fgcLineColor`,
  filtre "connexió Barcelona") a **`src/utils/fgc.ts`** (testat a `fgc.test.ts`).

##### Temps real — **GTFS‑Realtime protobuf** (no JSON!)
- Els datasets d'Opendatasoft (`dadesobertes.fgc.cat`) **NO** retornen camps JSON: el record
  conté un **fitxer `.pb`** (GTFS‑RT protobuf: `vehicleposition.pb` / `tripupdates.pb`).
- `functions/_fgc.ts` → `fetchPbFeed(slug)`: 1) `…/records?limit=1` per treure la URL del
  `.pb`, 2) baixa el `.pb`, 3) el descodifica amb **`src/utils/gtfsRt.ts`** — un
  **descodificador GTFS‑RT minimal i sense dependències** (camina el wire‑format protobuf;
  testat a `gtfsRt.test.ts` encodant un FeedMessage). 2 subrequests per crida.
- ⚠️ **El feed RT NO porta `route_id` ni `headsign`** per entitat — només un `trip_id` opac
  (amb sufix `|…` que cal escapçar). La **línia i el destí** es resolen amb `FGC_TRIPS`
  (`trip_id → {línia, headsign}`). Els **`stop_id` del RT SÍ casen** amb els del GTFS estàtic,
  així que les arribades es filtren per `stop_id`. Vehicles i trip‑updates s'etiqueten via
  `trip_id`.
- Degradació elegant: si el feed falla, `disponible:false` i es mostra l'estàtic sense error.

**Backend** (`functions/`): `_fgc.ts` + `api/fgc/{linies,parades,parades-all,temps-real,vehicles}.ts`.
Endpoints estàtics amb `cache-control` llarg (86400 s); `temps-real`/`vehicles` a 30 s.

##### Frontend — UI **idèntica a TMB Línies**
- `FgcView` reutilitza l'estructura `.panel`/`.map-area` de Línies: a mòbil **bottom‑sheet**
  (mapa a dalt, llista a baix) amb `panel-backdrop` que enfosqueix; en seleccionar una línia
  el panell es tanca → **mapa a pantalla completa**. Pila de FABs com TMB: recentrar (dins el
  mapa), **mapa/llista**, **⇄ canvi de sentit** (només en llista), **lupa** (reobrir la llista),
  i **Cooltra** (+ filtres moto/bici, només en vista mapa); refresc + visibilitat de vehicles
  a dalt‑dreta. La capçalera reusa **`LineHeaderBanner`** de TMB (badge pastilla arrodonida +
  `origen → destí`); la línia FGC s'hi passa com a `Linia` amb `tipus:'metro'`.
- **Llista de parades** = `FgcLineListView` que **replica `LineListView`/`StopRow`** (mateixes
  classes): cercle numerat de seqüència, nom, **badges de connexió acolorits** per línia,
  chevron i **acordió amb arribades RT** agrupades per destí. Té **dos sentits** (la llista i
  la seva inversa, com el metro de TMB) commutables amb el ⇄.
- Marcador de parada: `FgcLayer` + `utils/fgcMarkerIcon` (**tren en quadrat blanc**, vora del
  color de la línia; distingible de TMB/Bicing/Cooltra). Vehicles = `CircleMarker` del color
  de la línia, tooltip `Lx → destí`. **Per defecte el mapa d'FGC surt net**; els trens només
  es pinten en seleccionar una línia.
- Hooks: `useFgc{Linies,LiniaDetall,Stations,Vehicles,Arribades}`. `useFgcVehicles(codi,enabled)`
  amb `codi=null` pot tornar tots els trens (no s'usa ara per tenir el mapa net per defecte).
- Tipus a `types/fgc.ts`; client `services/fgc.ts`; icona del mode `FgcLogo` (isotip de les
  baules entrellaçades, vectoritzat del PNG oficial, monocrom `currentColor`).

**Favorits:** bucket propi `tmb-fav-fgc` (patró Bicing), **barrejat** a la llista i al `FavMap`
amb parades TMB + Bicing. ★ de parada FGC des del **popup del mapa** (com TMB; les files de
llista no porten ★). Línies FGC **no** es poden marcar favorites (v1).

**Aprop meu:** parades FGC a la llista unificada + mapa, amb **toggle FGC** propi i comptador
"FGC: n". (La capçalera diu "Metro/Bus: n - Bicing: n - FGC: n".)

**Persistència:** `tmb-fgc-parades-all-v1` (cache), `tmb-aprop-fgc-filter-v1`, `tmb-fav-fgc`.

#### Refrescos en temps real, caches i la "regla d'or del mapa"
- **Tots els feeds en temps real es refresquen cada 30 s** (polling frontend): TMB arribades
  (`useTempsReal`), TMB posicions de vehicles (`useVehicles` — ara **auto‑refresca**; abans
  només manual), Bicing (`useBicingStations`), Cooltra (`useCooltraVehicles`) i FGC vehicles
  (`useFgcVehicles`). Les arribades FGC es carreguen **en obrir** el popup/acordió. GPS: 10 s.
- **Botó ↻ `RefreshControl`** (Línies i Aprop meu): refresc manual amb **cooldown de 30 s**
  (`COOLDOWN_MS`); el compte enrere del botó ho indica.
- **Cache CDN** (`cache-control`): feeds RT a `max-age=30` (TMB temps‑real i vehicles via
  `_tmb.jsonResponse`, Cooltra, FGC temps‑real/vehicles via `_fgc.jsonResponse`), Bicing 15 s;
  estàtics llargs (línies 3600 s, parades 300 s, **FGC estàtic 86400 s**). Mantingues el cache
  ≤ l'interval de poll perquè el refresc sigui efectiu.
- ⚠️ **REGLA D'OR DEL MAPA:** un refresc de dades **mai** ha de moure el centre ni el zoom —
  només actualitzar pois/temps/posicions. Tots els enquadraments són **d'un sol cop o amb
  guarda**: `AutoFit` (MapView) fita un cop per línia (`lastFitId`); `FitToFavs` (FavMap) i
  `CenterOnUser` (Bicing/MapView) un sol cop (ref); `FitToLine` (FgcView) i `FitToRoute`
  (RoutePlanMap) per **signatura de la geometria**; a Aprop meu el fit depèn només del radi.
  Si afegeixes una capa amb `fitBounds`/`setView`, **posa‑hi una guarda equivalent**.

#### Route Planner (`mode === 'route'`)
PRD i task list a `tasks/prd-route-planner.md` i `tasks/tasks-route-planner.md`.
Mockup HTML inicial: `mockup-route-planner.html`.

**Backend** (`functions/api/`):
- `planner/plan.ts` → proxy a `api.tmb.cat/v1/planner/plan` (OpenTripPlanner).
  Data/hora calculades al servidor (`now`), no al client.
- `geocode/search.ts` → proxy a `photon.komoot.io/api/`. **NO** passar `lang=ca`:
  Photon només suporta `default/de/en/fr` (`ca` retorna 400).

**Frontend**:
- `RoutePlannerView` orquestra formulari A→B + resultats
- `RouteSearchForm` amb autocomplete Photon (debounce 300 ms, biaix Barcelona,
  mínim 3 caràcters)
- Origen pre-emplenat amb GPS però totalment editable
- History dels últims 5 destins (`tmb-planner-history-v1`)
- Toggles Metro/Bus persistits (`tmb-planner-modes-v1`)
- Quan arriba un resultat: el formulari es col·lapsa a una fila compacta
  origen/destí + llapis d'editar
- Toggle Mapa ↔ Llista al cantó inferior dret (un sol botó rodó, no segmented)
- 3 tabs (Més ràpida / Menys transbords / Menys camí), amb dedupe quan caueun
  sobre el mateix itinerari i amagat de "Menys camí" si delta a peu <100 m
- Mapa: polyline per tram (transit acolorit per `linia.color`, walk en gris
  discontinu) decodificada amb `src/utils/polyline.ts`
- Marcadors clau (sortida / puja / transbord / baixa / arribada)
- Chip de resum col·lapsable al cantó superior esquerre. Mostra `now + durada`
  com a hora d'arribada (els epochs absoluts de OTP no eren fiables i sortia
  "00:17" l'usuari)
- **Cooltra last-mile**: vehicles dins de 300 m del destí es pinten automàticament
  al mapa del planner. No té toggle propi (és part de l'experiència del planner).
- **Accions dels popups (parada TMB i estació Bicing), unificades:** una fila amb
  **"Ruta fins aquí"** (blau, compacte, mida de contingut — `RouteHereButton`,
  obre el planner intern via seed a `sessionStorage` + event `tmb:open-planner`) +
  **icona de persona caminant** (`DirectionsButton`, obre Apple/Google Maps a peu)
  + **Compartir**. ⚠️ Això **reverteix** la decisió antiga d'eliminar Apple/Google
  Maps: ara conviuen (ruta en transport públic vs a peu — a una bici hi vas a peu).
- **Planner map**: recentrar SEMPRE a la cantonada inferior dreta; el toggle
  Mapa↔Llista just a sobre (icona de llista sempre grisa).

#### Sistema de controls al mapa (reorganitzat aquesta sessió)
**Regla:** TOTA icona rodona de mapa fa **44 px** (referència: el botó recentrar)
i les distàncies verticals entre icones són **12 px** (offsets des de baix: 16,
72, 128, 184…). `box-sizing: border-box` global, així que vora de 2px no canvia
la mida. Les piles van a **baix-dreta** (no a dalt). El cooltra-map-btn fa 40 px a
posta (és un disc ple; a 44 es veia més gros que els altres). Tots centrats a
`right: 16px`.

- **Aprop meu** (`.cooltra-map-control--aprop`, baix-dreta de baix a dalt):
  recentrar (dins del mapa) · RefreshControl (↻ amb cooldown, com Línies) ·
  Cooltra (+ moto/bici que surten **cap amunt**, `column-reverse`).
- **Favorits (mapa)**: barra superior amagada en mode mapa; baix-dreta:
  recentrar · mapa/llista · Cooltra (filtres amunt). En mode **llista**: filtres
  d'ordenació a la dreta + FAB rodó de "mapa" a baix-dreta (icona de llista
  sempre grisa).
- **Línies** (`.linies-fab-stack`, baix-dreta, `column-reverse`):
  - Mapa: recentrar (dins MapView) · llista · lupa · Cooltra (filtres amunt).
    Refresc + visibilitat de vehicles es queden a **dalt-dreta** (`.map-controls-stack`).
  - Llista: mapa · **⇄ (canvi de sentit, icona nova)** · lupa. El sentit s'ha
    aixecat de `LineListView` a `LiniesView` (controlat: `activeSentit` +
    `onColumnsChange`); el ⇄ recorre els sentits.
  - Quan s'obre la llista de cerca (línia ja triada): s'amaga tota la pila i
    només surt una **X** (a dalt-dreta) per tancar.
  - La lupa = obrir/tancar el cercador de línies (abans era un FAB vermell gran;
    ara icona rodona estàndard de 44 px).
- Cantó superior esquerre: brúixola de rotació + +/- de zoom (Leaflet).

#### Sistema de mides de marcadors
- **Mini Ø10** → vehicles Cooltra (`CircleMarker radius 5`).
- Parades TMB a Aprop meu: no-top radius 5, top-N (5 més propers) radius 10.
- **Quadrats Bicing** (DivIcon): agafar = partit verd|groc o solo, gris si buida;
  retornar = vermell/contorn negre/número blanc.
- **Guinyo en tap des de la llista (Aprop meu):** ara és MOLT més pronunciat
  (pulsa gran +9 radi unes quantes voltes, anell blau, `bringToFront`, i obre el
  tooltip amb el nom ~1 s). Funciona per a parades TMB I estacions Bicing (canals
  de wink separats per evitar col·lisió d'ids).
- **Llista d'Aprop meu** ara és UNA llista barrejada (parades + estacions Bicing)
  ordenada per proximitat, tota numerada (cercle taronja idèntic; la "b" de Bicing
  va inline a la fila de pastilles, davant de l'⚡). Capçalera en una línia:
  "Parades: n - Estacions bicing: m" (s'omet cada part si el seu xip està a `cap`).
  S'ha tret la fila "La meva ubicació" (el mapa ja diu "Tu") i el botó
  "Actualitzar" (el GPS s'auto-actualitza). El slider de Radi té un hit-area
  vertical més gran (44 px) sense canviar el dibuix.
- Cooltra sempre per sota dels TMB (`bringToBack()`). Custom panes amb DivIcon
  **van donar problemes** — patró estable: `L.circleMarker`/`Marker` simple.

#### Mockups HTML guardats
- `mockup-route-planner.html` · `mockup-bicing.html` · `mockup-bicing-markers.svg`
- Convenció: mockups grans al root abans d'UI gran.

### Pegats / lessons learned (els que han costat sang)
- **`wrangler pages dev --` proxy syntax es trenca** quan `wrangler.toml` té
  `pages_build_output_dir`. Solució: el script `dev:functions` actual usa
  `concurrently` corrent vite i wrangler per separat. Wrangler pinned a `~3.99.0`.
- **CSS `mask-image` requereix alfa real**. Si la PNG és RGB sense alfa, el
  browser cau a luminance i pinta un bloc sòlid sense silueta visible. Cal
  RGBA + dilatació + boost d'alpha si les línies són primes (les Cooltra
  estaven gairebé al límit).
- **El nom de la classe CSS ha de coincidir amb el `kind`**. `CooltraKind` és
  `'scooter' | 'bike'`, però la CSS tenia `--moto` per error → màscara no
  s'aplicava. Lliçó: usa el valor del tipus com a suffix.
- **Custom Leaflet panes són traïdors amb DivIcon**. Provat diverses voltes en
  aquesta sessió; sempre acabàvem tornant a `L.circleMarker` + `bringToBack()`.
- **CSS `position: relative` sobre `.leaflet-marker-icon`** trenca el
  posicionament inline de Leaflet. Per a fills absoluts confia en el `position:
  absolute` que Leaflet ja posa.
- **iOS Safari auto-zoom** en focusar inputs amb `font-size < 16px`. Tots els
  inputs del planner ja són ≥16px a mòbil.
- **OTP/TMB epoch ms no sempre quadren amb el rellotge**. Computa l'hora
  d'arribada des de `Date.now() + duration*1000`, no del `endTime` absolut.
- **`useCooltraVehicles` no peta si el navegador té caché stale del SW**. Si
  els endpoints nous no responen, demana hard refresh i comprova SW.
- **iOS PNG upload via GitHub web** afegeix `.png.png` al final del nom — cal
  renomenar després.
- **Icones de la barra de modes han de ser monocromes `currentColor`**. Un PNG/SVG
  de color fix (logo TMB vermell) es fon amb la barra vermella en estat inactiu.
  Inline + `currentColor` → s'adapta sol (blanc/vermell). Igual la `BicingLogo`.
- **Emojis (⚡🚲) no es centren sols** dins d'un botó: cal embolicar-los en un span
  amb `line-height: 1` (descens de l'emoji). Per icones crítiques, millor SVG.
- **Inline SVG dins d'un badge cau ~1px** (baseline gap) → `svg { display: block }`.
- **`box-sizing: border-box` és global** → per igualar mides d'icones rodones,
  mira la mida total (vora inclosa). Un disc ple sense vora sembla més gros que un
  amb vora blanca a la mateixa mida (per això Cooltra fa 40, no 44).
- **GBFS Bicing**: el feed pot diferir de l'spec (v2 vs v3); normalitza defensiu i
  **verifica amb crida real**. A Bicing qualsevol ancoratge lliure accepta
  qualsevol bici → no té sentit separar el retorn per tipus.
- **Bicing porta els noms en MAJÚSCULES** → es normalitzen a Title Case amb
  `src/utils/titleCase.ts` (connectors `de/la/i…` en minúscula, articles elidits `l'/d'`)
  al normalitzador (`_bicing.ts → localisedName`).
- **FGC GTFS‑RT no és JSON**: els datasets d'Opendatasoft contenen un **fitxer `.pb`**
  (protobuf), no camps. Cal baixar el `.pb` i descodificar‑lo (`src/utils/gtfsRt.ts`). I el
  feed **omet `route_id`/`headsign`** → la línia/destí venen del mapa `trip_id`→línia
  (`fgcTrips.ts`, generat de `trips.txt`); els `stop_id` sí casen amb l'estàtic.
- **El `prebuild` (build:fgc) ha de ser NO‑FATAL** i amb timeout: a Cloudflare regenera les
  dades reals; en entorns sense xarxa (dev/sandbox) ha de fer skip i mantenir el seed perquè
  `npm run build` no peti.
- **PWA: el service worker feia navigation‑fallback a `index.html` també per a `/api/*`** →
  obrir un endpoint a la barra d'adreces mostrava l'app. Solució: `workbox.navigateFallbackDenylist:
  [/^\/api\//]` a `vite.config.ts`. (Cal recarregar un parell de cops perquè s'activi el SW nou.)
- **Reús de components TMB per a FGC**: estan acoblats als tipus i favorits de TMB. FGC
  replica el **disseny/classes** (StopRow, LineHeaderBanner, `.panel`, FAB stack) amb dades i
  bucket de favorits propis, en lloc de reusar‑los directament. La paritat literal demanaria
  el refactor multi‑operador (camp `operator` a tota la cadena) — pendent i gros.

### El que NO fer (decisions fermades)
- **NO un PNG de color fix com a icona de mode** (es fon amb la barra) — monocrom.
- **NO separar elèctric/mecànic en el RETORN de Bicing** (docks compartits).
- **NO amagar les estacions Bicing buides** en mode agafar — pintar-les en gris.
- **NO el FAB vermell gran** per la lupa de Línies — icona rodona estàndard 44 px.
- **Clustering Cooltra** — abandonat; punts simples.
- **Cache offline dels tiles del mapa**.
- **`lang=ca` a Photon** — no suportat.
- (Revertit) L'antiga regla d'eliminar Apple/Google Maps dels popups: ara hi ha
  "Ruta fins aquí" (planner) **+** icona caminant (Apple/Google a peu) + Compartir.

### Els 4 objectius i les seves apostes

#### 1. RETENCIÓ / hàbit (prioritari)
- ✅ Favorits.
- ✅ PWA installable.
- ✅ Planificador de rutes A→B (en aquesta sessió).
- Aposta gran pendent: **notificacions push "surt ara"** — cal Web Push +
  backend amb estat → trenca el cost zero.

#### 2. CREIXEMENT / abast
- ✅ Compartir parada per enllaç (loop víric WhatsApp).
- Quick win pendent: **alertes de servei / incidències TMB** (TMB publica
  afectacions; valor alt, cost zero).
- Aposta gran pendent: **SEO** amb pàgines per línia/parada indexables.

#### 3. MONETITZAR
- Encara prematur. Aposta futura B2B: **widget white-label** per a
  hotels/comerços ("com arribar fins aquí"). **NO** ads.

#### 4. PORTFOLI / demo
- ✅ Integració mobilitat secundària: **Cooltra** (motos + bicis last-mile).
- ✅ **Bicing** (estacions GBFS): mode propi + capa a Aprop meu + favorits.
- Quick win pendent: **mode fosc**, transicions polides.
- Aposta gran: integració **FGC** com a segon operador TMB-equivalent.

### Roadmap proposat (què toca ara, en ordre)

1. **Verificar el feed Bicing real en producció** (l'allowlist de dev no hi
   arribava): comprovar `/api/bicing/stations` i que el desglossament elèctric/
   mecànic i els ancoratges quadren; ajustar `functions/_bicing.ts` si cal.
2. **Alertes de servei / incidències TMB**. Cost zero, valor diari alt.
3. **Mode fosc** + pulits visuals lleugers.
4. **Optimitzar imatges Cooltra** a SVG (`currentColor` en comptes de `mask-image`).
5. ✅✅ **FGC com a segon operador** — **FET i a producció** (mode + Aprop meu + favorits +
   temps real GTFS‑RT). Dades reals regenerades a cada deploy (`prebuild`). Es va evitar el
   refactor multi‑operador gros usant tipus/bucket FGC propis (patró Bicing). Veure la secció
   "FGC (Ferrocarrils)" més amunt. **Pendents menors d'FGC:** (a) confirmar que el feed RT
   d'FGC ompla bé línia/destí en hores punta amb el GTFS regenerat; (b) opcional: vista
   "tots els trens FGC". *(L'endpoint diagnòstic `functions/api/fgc/debug.ts` ja s'ha esborrat.)*
6. **Refactor multi‑operador** (futur, gros): unificar TMB+FGC (+Bicing) amb un camp
   `operator` a tipus/favorits/RT (~30 fitxers) per reusar literalment els components en lloc
   de replicar disseny. Avui FGC funciona sense això.
7. **Push "surt ara"** o **widget B2B**: només si la retenció validada justifica trencar el
   cost zero.

> **Deute tècnic menor — NETEJAT:** s'ha esborrat `public/logo-tmb.png` (ja no
> s'usa, substituït per SVG inline), el component orfe `ViewToggle` (+ el seu
> test) i el CSS associat (`.view-toggle-*`, `.panel-toggle-mobile`). El tipus
> `ViewMode` viu ara inline a `LiniesView.tsx`. `.planner-view-toggle` és una
> classe diferent (Route Planner) i es manté.

### Com encarar la propera feature

Si l'usuari demana una feature gran, segueix el workflow del projecte:
1. Pregunta el que sigui ambigu.
2. Mockup HTML a l'arrel (`mockup-*.html`) abans d'UI gran.
3. PRD amb la skill `/CREATE-PRD` (a `tasks/prd-*.md`).
4. Task list amb la skill `/GENERATE-TASKS` (a `tasks/tasks-*.md`).
5. Branca per parent task. Sub-tasques comparteixen branca.
6. Verifica `lint + build + test` abans de cada push.
7. PR cap a `main` + squash merge (o, si el MCP de GitHub no va, `git merge
   --ff-only` + `git push origin main`). Cloudflare desplega sol.

Pensa sempre en **impacte vs cost** i en **mantenir el free tier**.

> Nota: hi ha **69 tests** Vitest (eren 33). Mantén-los verds. Nous des d'FGC:
> `utils/fgc.test.ts`, `utils/gtfsRt.test.ts`, `utils/titleCase.test.ts`, `stores/favorits.test.ts`.

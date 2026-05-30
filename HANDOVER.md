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
> PR + squash-merge a `main` quan el canvi sigui llest.
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
> Mira el bloc "**Estat de producció actual**" més avall — la sessió anterior va
> aterrar dues features grans i molt UI/UX polish; no reinventis components que
> ja existeixen.

---

## Part B · Visió, estat i roadmap

### Tesi central
L'app és avui un **visor + planificador** de mobilitat a Barcelona. Filosofia de
recursos: **cost zero (Cloudflare free)** fins que una mètrica clara justifiqui
pagar. Volem convertir-la en eina de rutina diària, no només consulta puntual.

### Estat de producció actual

#### Quatre modes al header
Icones SVG. A mòbil només icones, a tablet+ icona + label.
- 🧭 **Ruta** — planificador A→B (TMB Planner + geocoder Photon)
- 🚌 **Línies** — explorador de línies amb mapa o llista
- 🎯 **Aprop meu** — parades a la rodona amb GPS i radi configurable
- ⭐ **Favorits** — parades/línies desades amb llista o mapa

Component: `src/components/ModeToggle.tsx`. Routing simple via `useState` a `App.tsx`.

#### Filtres Metro / Bus (Aprop meu i Línies)
Dos toggles independents — ja no existeix "Tots". Per defecte tots dos ON; mai
poden estar tots dos OFF (l'últim queda sticky). Persistència separada:
- `tmb-aprop-meu-filter-v1`
- `tmb-linies-filter-v1`

Internament `FilterType = 'tots' | 'metro' | 'bus'` (el FilterBar tradueix els
dos toggles a aquest valor unificat per no haver de refactoritzar la resta).

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
- **Botó "Ruta fins aquí"** als popups de parada (`AproperMeuStopPopup`,
  `StopPopup`) reemplaça l'antic "Com arribar-hi" (que delegava a Apple/Google
  Maps i ja no té sentit perquè el planner intern el subsumeix). Escriu un seed
  a `sessionStorage` i dispara l'event `tmb:open-planner`; `App.tsx` l'escolta i
  canvia de mode.

#### Sistema de controls al mapa
Cada mapa té una pila vertical al cantó superior dret:
- Botó Cooltra (amb logo) → quan està actiu, sota: botó motos + botó bicis (filtres)
- Sota d'això (només Línies): RefreshControl + VehicleVisibilityToggle (bus icon)
- Els filtres de tipus usen format de bombolla amb doble anell + silueta blanca

Cantó inferior dret: botó de recentrar + view-toggle (un sol botó rodó que mostra
la icona de l'altre mode — no segmented).

Cantó superior esquerre (a mòbil pot moure's a baix-esquerra via CSS): brúixola
de rotació + +/- de zoom, sempre apilats verticalment a la mateixa cantonada.

#### Sistema de mides de marcadors
- **Mini Ø10–14** → vehicles Cooltra (`CircleMarker radius 5`) i parades TMB
  no-top a Aprop meu
- **Gran Ø20** → top stops a Aprop meu i parades de Favorits (`radius 10`)
- Wink a Aprop meu en tap des de la llista: només +1 radi (subtil, no jump)
- Cooltra sempre per sota dels TMB (`bringToBack()` a l'overlayPane). Custom
  panes amb DivIcon **van donar problemes diversos** — el patró estable és
  `L.circleMarker` + `bringToBack()`.

#### Mockups HTML guardats
- `mockup-route-planner.html` — UI del planner (3 estats)
- `mockup-cooltra-icons.html` — primera ronda d'icones moto/bici
- `mockup-cooltra-bike-icons.html` — segona ronda de bicis
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

### El que NO fer (decisions fermades)
- **Apple/Google Maps shortcut "Com arribar-hi"** a popups de parada — eliminat
  perquè el planner intern el subsumeix.
- **Toggle segmented Map↔List** a Línies — substituït per un sol botó rodó que
  mostra la icona de l'altre mode.
- **Clustering Cooltra** — abandonat; ara són punts simples sense agrupació.
- **Cache offline dels tiles del mapa**.
- **`lang=ca` a Photon** — no suportat.

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
- ✅ Integració mobilitat secundària: **Cooltra** (motos + bicis com a
  last-mile, també last-mile dins del planner).
- Quick win pendent: **mode fosc**, transicions polides.
- Aposta gran: integració **FGC** com a segon operador TMB-equivalent.

### Roadmap proposat (què toca ara, en ordre)

1. **Alertes de servei / incidències TMB**. Cost zero, valor diari alt,
   encaixa amb la tesi d'hàbit.
2. **Mode fosc** + pulits visuals lleugers.
3. **Optimitzar les imatges Cooltra**: `cooltra-moto.png` i `cooltra-bike.png`
   ja són ~10 KB però convertir-les a SVG real seria més net (no caldria
   `mask-image`, podríem colorar amb `currentColor`).
4. **FGC com a segon operador**. Viable a cost zero (FGC publica GTFS +
   GTFS-RT), però requereix refactor multi-operador (~30 fitxers acoblats a
   TMB) + segona via d'ingesta (parsejar GTFS + descodificar Protobuf de
   GTFS-RT). **No és quick win** — feina dedicada.
5. **Notificacions push "surt ara"** o **widget B2B**: només si la retenció
   ja validada justifica trencar el cost zero, o si hi ha primer client B2B.

### Com encarar la propera feature

Si l'usuari demana una feature gran, segueix el workflow del projecte:
1. Pregunta el que sigui ambigu.
2. Mockup HTML a l'arrel (`mockup-*.html`) abans d'UI gran.
3. PRD amb la skill `/CREATE-PRD` (a `tasks/prd-*.md`).
4. Task list amb la skill `/GENERATE-TASKS` (a `tasks/tasks-*.md`).
5. Branca per parent task. Sub-tasques comparteixen branca.
6. Verifica `lint + build + test` abans de cada push.
7. PR cap a `main`, squash merge. Cloudflare desplega sol.

Pensa sempre en **impacte vs cost** i en **mantenir el free tier**.

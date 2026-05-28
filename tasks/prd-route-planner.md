# PRD: Route Planner (Planificador de rutes A → B)

## 1. Introduction / Overview

Tu et Mous Bé permet avui veure on són les parades de TMB i quina és la flota
Cooltra disponible. El que **encara no permet** és la pregunta més bàsica
d'una app de transport: *"com vaig d'aquí a allà?"*.

Aquesta feature afegeix un **planificador de rutes A → B** que utilitza la
API oficial de TMB (basada en OpenTripPlanner) per calcular itineraris
multimodals (caminar + metro + bus). L'usuari escriu un destí, l'app
geocodifica l'adreça via Photon (OSM), demana a TMB l'itinerari, i ho pinta
sobre el mapa Leaflet existent.

**Què resol per a l'usuari:** "vull anar a [carrer X / parada Y / lloc Z]
ara mateix" sense haver de sortir de l'app a Google Maps.

## 2. Goals

1. Permetre planificar una ruta des de la **ubicació actual** fins a una
   adreça/parada/POI escrit per l'usuari, **per a aquest mateix moment**.
2. Mostrar fins a **3 alternatives** etiquetades per criteri d'optimització
   (més ràpida / menys transbords / menys camí).
3. Visualització **estil minimalista**: ruta dibuixada al mapa amb popups a
   les parades clau (embarcar, transbordar, baixar). Sense fitxa de text gran.
4. Integrar-se a l'estructura existent (modes al header, mapa Leaflet) sense
   trencar les vistes Línies / Aprop meu / Favorits actuals.

## 3. User Stories

- **Com a viatger**, vull obrir l'app, escriure "Mercat de Sant Antoni" i
  veure quina és la millor manera d'arribar-hi des d'on sóc ara, sense haver
  de configurar res.
- **Com a viatger habitual**, vull comparar entre la ruta més ràpida i una
  que tingui menys transbords, perquè a vegades prefereixo arribar tard però
  còmode.
- **Com a usuari recurrent**, vull que l'app recordi els meus últims destins
  perquè el 80% dels meus viatges són als mateixos llocs.
- **Com a usuari mirant una parada al mapa**, vull poder dir "porta'm aquí"
  d'un clic, sense haver d'escriure l'adreça.
- **Com a usuari que prefereix una via**, vull poder excloure el metro o el
  bus si vull només l'altra opció.

## 4. Functional Requirements

### 4.1 Estructura: nou mode al header

1. S'afegeix un **quart mode** al `ModeToggle` del header:
   - **Ruta** (nou) — accés al planificador
   - **Línies** (existent)
   - **Aprop meu** (existent)
   - **Favorits** (existent)
2. Es revisen les **icones dels 4 modes** per donar coherència visual:
   - Ruta = fletxa de navegació
   - Línies = bus+rectangle metro
   - Aprop meu = radar concèntric 🎯
   - Favorits = estrella ⭐
3. **Mode labels al header**: a mòbil només es mostra la icona (estalvi
   d'espai); a tablet/desktop es manté el text sota o al costat de la
   icona.
4. El mode "Ruta" arrenca obert sense destí, amb el camp "Des d'on"
   pre-emplenat automàticament amb la ubicació actual i el camp "Cap a on"
   buit i amb focus.

### 4.2 Entrada A → B

5. **Camp "Des d'on"**: per defecte = "La meva ubicació" (dot blau, com a
   `LocationBlock`). **És editable**: l'usuari pot substituir-lo per una
   adreça escrita o un suggeriment Photon, igual que el camp de destí. El
   text "La meva ubicació" es manté com a placeholder fins que es comença
   a escriure.
5. **Camp "Cap a on"**: autocomplete que fa una petició a Photon (via proxy
   CF) per cada lletra escrita, amb **debounce de 300ms**, mínim **3
   caràcters** abans d'enviar.
6. **Biaix de proximitat**: les peticions a Photon s'envien amb les
   coordenades del centre de Barcelona (41.387, 2.168) i `location_bias_scale=0.2`
   perquè els resultats apareguin ordenats per proximitat a la ciutat.
7. **Dropdown de suggerències**: mostra les `features` de Photon. Cada
   suggeriment ensenya `name` en negreta i `district / city` o el `street`
   complet en gris.
8. **History**: després de cada ruta planificada amb èxit, el destí
   triat es desa a `localStorage` (clau `tmb-planner-history-v1`). El
   dropdown del camp "Cap a on" mostra els **últims 5 destins** quan el
   camp està buit (abans d'escriure res).
9. **Botó d'intercanvi** (↕) entre els dos camps perquè l'usuari pugui
   invertir A ↔ B sense reescriure.

### 4.3 Botó d'acció contextual

10. Als popups de parades existents (`AproperMeuStopPopup`,
    `StopPopup`, etc.) s'afegeix un botó **"Ruta fins aquí"** que obre el
    mode "Ruta" amb el camp "Cap a on" pre-emplenat amb el nom i les
    coordenades de la parada, i dispara la planificació immediatament.

### 4.4 Càlcul de la ruta

11. Es crea un nou endpoint **`/api/planner/plan`** al backend (CF Functions)
    que proxia `https://api.tmb.cat/v1/planner/plan` amb les credencials
    `TMB_APP_ID/TMB_APP_KEY` ja configurades.
12. Paràmetres enviats a TMB:
    - `fromPlace`, `toPlace` en format `lat,lon`
    - `date`/`time` = ara mateix (calculat al servidor per evitar
      desincronies de rellotge del client)
    - `arriveBy=false`
    - `mode=TRANSIT,WALK` (filtrable segons 4.5)
    - `maxWalkDistance=800`
    - `showIntermediateStops=true`
    - `numItineraries=5` (per tenir on triar les 3 alternatives)
13. La resposta es **normalitza** abans d'arribar al frontend per amagar
    la complexitat d'OTP: només els camps necessaris (durada, transbords,
    walkDistance, legs amb mode/route/from/to/legGeometry).

### 4.5 Filtres de transport

14. Sota els camps A → B, dos toggles **Metro** i **Bus** (ON per defecte).
    L'usuari pot desactivar-ne un per excloure'l del càlcul. No es permet
    desactivar els dos alhora (mostra un avís).
15. Els filtres es persisteixen a `localStorage`.

### 4.6 Visualització del resultat

16. Tabs amb 3 alternatives etiquetades:
    - **Més ràpida** — itinerari amb `duration` mínima
    - **Menys transbords** — itinerari amb `transfers` mínim (desempate per duració)
    - **Menys camí** — itinerari amb `walkDistance` mínim (desempate per duració)
    
    Si la API torna menys de 3 itineraris útils, només s'ensenyen les tabs
    que tenen contingut. Si dues categories caurien sobre el mateix
    itinerari, només es mostra una vegada (etiqueta combinada).
17. La tab seleccionada **dibuixa la ruta al mapa**:
    - Trams de WALK → línia discontínua gris
    - Trams de BUS → línia del color de la línia TMB (de `linia.color`)
    - Trams de METRO/SUBWAY → línia del color de la línia TMB
18. **Marcadors a parades clau** (no a totes les intermèdies):
    - Origen — punt blau (mateix estil que el dot "Tu")
    - Destí — pin vermell TMB
    - Cada **boarding** (on agafes un transport) i cada **alighting** (on
      baixes) — cercle amb el color de la línia
    - Cada **transbord** — un cercle especial (marca distintiva amb dues
      línies)
19. **Popups** als marcadors clau amb la info crítica:
    - Origen: "Sortida ara"
    - Boarding: "Pugeu al [V15] cap a [Av. Tibidabo]" + temps d'espera
    - Alighting: "Baixeu a [parada]"
    - Destí: "Arribada [HH:MM]"
20. **Resum compact** sobre el mapa (chip / pill): "32 min · 1 transbord ·
    480m caminant". No més detall textual — la informació detallada viu
    als popups.
21. El mapa fa fit-bounds sobre la ruta sencera al carregar el resultat.
22. **Botó "Recentrar"** flotant al mapa (cantonada inferior dreta del
    contenidor) que torna a fer fit-bounds sobre la ruta sencera quan
    l'usuari ha mogut o ampliat el mapa.

### 4.6.bis Flota Cooltra al voltant del destí

23. Al carregar un resultat, es mostren automàticament al mapa els
    vehicles Cooltra (motos blaves, bicis verdes — mateix patró que
    `CooltraLayer`) que estiguin **dins d'un radi de 200m del destí**.
24. Es reutilitza el hook `useCooltraVehicles` ja existent (sense necessitat
    de toggle aquí; sempre actiu al planner). El filtre per distància es fa
    al client amb `haversine()`.
25. Aquests vehicles es renderitzen com a punts mini (Ø14, com a la resta
    de l'app) i, en fer-hi clic, mostren el popup Cooltra estàndard amb
    "Reserva gratis".
26. La idea és oferir-li a l'usuari una alternativa de "last-mile" en
    arribar: després de baixar del transport públic, potser pot agafar una
    moto/bici Cooltra per acabar el trajecte.
27. El toggle global Cooltra (de les altres vistes) **no apareix** al mode
    "Ruta". L'única manera de fer aparèixer Cooltra al planner és tenir
    un destí amb vehicles a la rodona — apareixen sense intervenció.

### 4.7 Estats i errors

22. **Carregant**: spinner + missatge ("Buscant rutes…") mentre s'espera la
    resposta de TMB.
23. **Sense ruta**: missatge clar ("No hi ha cap ruta entre aquests punts
    amb el filtre actual"). Suggeriment: activar metro/bus si està
    desactivat, o ampliar la distància màxima a peu.
24. **Fora de la zona TMB**: si TMB torna 4xx o respon sense itineraris i
    el destí és lluny de Barcelona, missatge específic ("Aquest destí està
    fora de la xarxa TMB").
25. **Sense ubicació**: si l'usuari no permet GPS i no escriu origen manual,
    bloquejar el botó "Buscar" amb tooltip explicatiu.
26. **API caiguda**: missatge genèric + botó "Tornar a provar". Es fa
    log al `console.error` per al debug.

### 4.8 Persistència

27. **History de destins**: últims 5 a `localStorage` (clau
    `tmb-planner-history-v1`). Estructura: `[{name, lat, lng, ts}]`.
28. **Filtres**: clau `tmb-planner-modes-v1` amb `{metro: boolean, bus: boolean}`.
29. **Últim destí** (per recuperar si l'usuari surt i torna): clau
    `tmb-planner-last-v1` (només si vol que ho recordem — té sentit
    persistir-ho sense pregunta o sols dins la sessió? veure Open Questions).

## 5. Non-Goals (Out of Scope)

- **Sortir / arribar en un moment futur** (es resol amb "ara" exclusivament
  per a la primera iteració).
- **Suggeriments de ruta múltiples vs una sola** — no s'inclou una segona
  opció diferent del set de 3 tabs. No hi haurà una llista scrollable de
  tots els itineraris que tornaria OTP.
- **Bici / patinet** com a mode propi del càlcul (TMB Planner no en disposa).
  La integració amb Cooltra es limita a mostrar-ne els vehicles a 200m del
  destí (veure 4.6.bis); no s'integra al càlcul de la ruta.
- **Cotxe / taxi** — fora del propòsit de l'app.
- **Compra d'entrades / preus de trajecte**.
- **Notificacions push** ("ara mateix arriba el teu V15") — fora d'aquest
  PRD.
- **Compartir ruta** com a enllaç — fora d'aquesta iteració.
- **Guardar rutes com a favorits** — només destins, no rutes senceres.
- **Re-planificació automàtica al canviar d'ubicació** — l'usuari ha de
  refrescar explícitament.
- **Indicacions pas-a-pas per al tram de WALK** (girs concrets, distàncies
  metre a metre). Només es dibuixa una línia gris.

## 6. Design Considerations

- **Reutilització**: l'estructura visual encaixa amb el mapa Leaflet ja
  existent (`MapView`, `AproperMeuMap`). El mode "Ruta" usa un nou
  contenidor `RoutePlannerView` que renderitza els camps i el mateix tipus
  de mapa Leaflet a sota.
- **Mòbil first**: els camps A/B es presenten apilats verticalment al
  mòbil, amb el dropdown ocupant la pantalla. A desktop, panell lateral
  (estil Aprop meu).
- **Colors**: respecta la paleta existent. Trams es pinten amb els colors
  TMB de cada línia (ja tenim `getLineColor`). El color blau Cooltra **no**
  s'utilitza per a aquest planner (per no confondre).
- **Cooltra**: el toggle Cooltra existent no es mostra dins el mode
  "Ruta" (no té sentit barrejar planificació TMB amb la flota Cooltra a la
  v1).
- **Mockup HTML**: abans d'implementar, es crea un `mockups/route-planner.html`
  estàtic per validar el layout (segons conveis del projecte).
- **Icones de mode**: cal decidir les 4 icones noves abans de codificar.
  Proposta inicial: Ruta = fletxa de navegació, Línies = metro+bus,
  Aprop meu = radar 🎯, Favorits = estrella ⭐. A consensuar al PRD review.

## 7. Technical Considerations

- **Backend**:
  - Nou `functions/_planner.ts` amb helper `fetchPlan(creds, params)` que
    parla amb `api.tmb.cat/v1/planner/plan`.
  - Nou `functions/api/planner/plan.ts` amb el handler i la normalització
    de resposta.
  - Nou `functions/_photon.ts` + `functions/api/geocode/search.ts` amb
    proxy a `photon.komoot.io/api/`. Cache pública 1h per a queries
    repetides.
- **Frontend**:
  - `src/services/planner.ts` i `src/services/geocode.ts`
  - Hooks: `useRoutePlan(from, to, modes)` i `usePhotonSearch(query, biasLatLng)`
  - Components: `RoutePlannerView`, `RouteSearchForm`, `RoutePlanTabs`,
    `RoutePlanMap` (encapsula el Leaflet i pinta la geometria), `RouteLegPopup`
- **Geometria**:
  - Els legs d'OTP retornen `legGeometry.points` codificats com a Google
    polyline. Necessitem decodificar (5-10 línies via un decoder existent
    com `@mapbox/polyline` o impl. pròpia). Avaluar quina pesa menys.
- **Encoding de la resposta Photon**: la resposta JSON és UTF-8; el
  navegador la parseja correctament tot i que Safari ho pinta com Latin-1
  al barra d'URL. No cal cap workaround.
- **Modes als header**:
  - Cal extendre `useDisplayMode` per acceptar el nou valor `'route'`.
  - Cal actualitzar `ModeToggle` per afegir el botó.
  - Renombrar/canviar icones requereix tocar els components dels modes
    existents — feinada acotada però present.
- **Branca**: seguint conveni del projecte, treballar a
  `task/route-planner-1.0-setup`, `2.0-geocoder`, etc., una per parent task.

## 8. Success Metrics

- **Funcional**: una usuari obert el mode "Ruta", escriu "Sant Antoni",
  selecciona el primer resultat, i veu una ruta dibuixada al mapa en
  menys de 3 segons. Es prova per a:
  - Destins propers (<1km)
  - Destins lluny (>10km)
  - Destins fora de cobertura → missatge clar
- **Adopció**: si en una setmana de live el 20% dels usuaris actius
  proven el planner almenys un cop, la feature és validada.
- **Rendiment**:
  - Photon respon < 500ms p95 (proxiat via CF).
  - TMB planner < 1500ms p95.
  - Render del mapa amb ruta dibuixada < 200ms.
- **Tests**: cobertura mínima per als components `RouteSearchForm`,
  `RoutePlanTabs`, el hook `useRoutePlan` (mockejant fetch).

## 9. Decisions tancades

- **Icones dels 4 modes**: fletxa de navegació / bus+rectangle / radar
  concèntric / estrella. Validades al mockup `mockup-route-planner.html`.
- **Mode labels al header**: només icona a mòbil, icona+text a tablet/desktop.
- **Tornar a planificar**: no hi ha botó dedicat. L'usuari edita els camps
  per refer la cerca.
- **Origen "La meva ubicació"** és editable per a una adreça arbitrària.
- **Botó "Recentrar"** al mapa: SÍ (cantonada inferior dreta).
- **Cooltra al planner**: NO toggle, però SÍ visualització automàtica de
  vehicles a 200m del destí com a opció de last-mile.

## 10. Open Questions

1. **Última ruta**: persistim entre sessions o només dins la mateixa sessió?
   Proposta: només sessió (es perd si tanques pestanya), per no obrir
   l'app amb una ruta vella que potser ja no és vàlida.
2. **3a tab "Menys camí"**: és realment útil si la diferència de caminar
   amb la més ràpida és <100m? Heurística: si el delta de caminar entre
   les 3 alternatives és <100m, només mostrem 2 tabs.
3. **Indicacions pas a pas** del tram WALK: el frontend rep `steps[]` però
   no els pinta. ¿Cal aprofundir en una versió posterior?
4. **Filtres més fins**: només Metro i Bus a l'MVP. Tram, FGC, Rodalies,
   Bus turístic… ¿s'inclouen en una futura iteració?
5. **Història com a chips ràpids** vs dropdown: a la v1 fem dropdown quan
   el camp està buit. Es podria evolucionar a chips de "destins
   freqüents" sobre el form.
6. **A → A**: què passa si l'usuari posa origen i destí iguals (o molt
   propers, p.ex. mateixa parada)? Mostrar missatge "Ja estàs aquí" sense
   anar a TMB.
7. **Radi Cooltra de 200m**: és el valor inicial. Si l'experiència indica
   que cal ampliar (zona residencial sense vehicles) o reduir (zona
   plena), parametritzem.

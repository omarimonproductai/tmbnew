# PRD — Integració FGC (Ferrocarrils de la Generalitat de Catalunya)

> Estat: esborrany per implementar. Workflow del projecte: PRD → `/GENERATE-TASKS` →
> branca per parent task → lint+test+build abans de push.

## 1. Introducció / Visió general

"Tu et Mous Bé" mostra avui metro i bus de TMB i estacions Bicing. Falta un operador
ferroviari clau de l'àrea de Barcelona: **FGC**, que cobreix corredors que el metro no
fa (Barcelona‑Vallès des de Pl. Catalunya cap a Sant Cugat/Sabadell/Terrassa, i
Llobregat‑Anoia des de Pl. Espanya cap al Baix Llobregat).

Aquest PRD afegeix **FGC com a segon operador de transport** a l'app, amb **paritat
funcional amb TMB**: explorador de línies propi (mode nou al header), aparició a "Aprop
meu", possibilitat de marcar parades FGC com a favorites, recorreguts al mapa, **arribades
en temps real** i **posicions de vehicles**.

Problema que resol: l'usuari que combina metro/bus amb FGC ha de sortir de l'app per
consultar FGC. Amb la integració, l'app passa a ser un visor multi‑operador real de la
mobilitat de Barcelona.

## 2. Objectius

1. Incloure **totes les línies FGC amb connexió directa a Barcelona** (almenys una parada
   dins del terme municipal de Barcelona ciutat), mostrant **la línia sencera** (incloent
   parades fora de Barcelona).
2. Afegir un **mode nou al header** que reprodueixi l'experiència del mode "Línies" de TMB
   (llista de línies + mapa amb parades + cerca + ordenació + ★), adaptat a FGC.
3. Integrar FGC a **"Aprop meu"** (parades FGC a la llista i al mapa per proximitat, amb
   filtre propi).
4. Permetre **marcar parades FGC com a favorites**, barrejades amb la resta de favorits.
5. Oferir **temps real** (arribades per parada + posicions de vehicles al mapa) amb el
   mateix patró visual que TMB.
6. Mantenir el **cost zero (Cloudflare free)** i la robustesa actual (cache + fallback +
   Toast quan una crida falla).

## 3. Històries d'usuari

- **Com a** usuari del Vallès **vull** veure les properes circulacions de la S1 a Pl.
  Catalunya **perquè** vull saber si arribo a temps al tren.
- **Com a** usuari **vull** un mode FGC al header igual que el de TMB **perquè** ja sé com
  funciona i no haig d'aprendre res nou.
- **Com a** usuari **vull** que en obrir "Aprop meu" surtin també les parades FGC properes
  **perquè** sovint la millor opció és el tren, no el metro.
- **Com a** usuari **vull** desar la meva parada FGC habitual a Favorits **perquè** la
  consulto cada dia.
- **Com a** usuari **vull** veure el recorregut de la línia FGM al mapa i on és cada tren
  ara mateix **perquè** m'ajuda a interpretar el servei d'un cop d'ull.

## 4. Requisits funcionals

### Dades i backend
1. El sistema ha d'ingerir el **GTFS estàtic d'FGC** (Open Data FGC) per obtenir línies,
   parades, recorreguts (shapes) i colors de línia.
2. El sistema ha de **seleccionar només les línies amb connexió directa a Barcelona**: una
   línia s'inclou si **almenys una de les seves parades és dins del terme municipal de
   Barcelona ciutat**. Un cop inclosa, es mostren **totes** les seves parades.
3. El backend ha d'exposar endpoints sota `functions/api/fgc/` seguint el patró de TMB:
   3.1. Llistat de línies FGC (amb id, codi, nom, color, tipus).
   3.2. Parades d'una línia (amb ordre/recorregut i shape per pintar la polyline).
   3.3. Parades FGC (per "Aprop meu" i favorits) amb coordenades.
   3.4. **Arribades en temps real** per parada (properes circulacions).
   3.5. **Posicions de vehicles** en temps real per línia.
4. Si una crida en temps real falla, el sistema ha d'usar **cache + Toast no bloquejant**
   (mateix comportament que TMB/Bicing), mostrant la part estàtica igualment.

### Mode nou al header
5. S'ha d'afegir un **mode nou** a `ModeToggle` (icona monocroma `currentColor`), col·locat
   al header. Ordre proposat: `Ruta · Línies (TMB) · FGC · Bicing · Aprop meu · Favorits`.
6. El mode FGC ha de **reproduir el mode "Línies" de TMB** reutilitzant‑ne els components
   (llista de línies amb badge de color, cerca, ordenació proximitat/A·Z/Z·A, mapa amb
   parades, ★ a línies i parades, toggle mapa/llista, controls de mapa estàndard).
7. En seleccionar una línia FGC, el mapa ha de pintar el **recorregut (polyline amb el
   color de la línia)**, les **parades** i, si està disponible, els **vehicles en temps
   real**, amb el patró visual de TMB.
8. En obrir una parada FGC s'han de mostrar les **properes circulacions (temps real)** i
   les accions ja existents als popups (Ruta fins aquí + caminant + Compartir).

### "Aprop meu"
9. Les **parades FGC properes** han d'aparèixer a la **llista unificada** d'Aprop meu
   (barrejades amb parades TMB i estacions Bicing), ordenades per proximitat i numerades
   igual que la resta.
10. Les parades FGC han d'aparèixer al **mapa d'Aprop meu** amb un marcador propi i
    distingible (veure §6), respectant el radi i el "guinyo" en tocar la fila.
11. S'ha d'afegir un **filtre FGC** als toggles d'Aprop meu (al costat de Metro/Bus), amb
    el seu propi estat persistit. La capçalera de comptadors ha d'incloure el recompte FGC.

### Favorits
12. L'usuari ha de poder **marcar/desmarcar una parada FGC com a favorita** (★), tant des
    de la llista d'Aprop meu com des del mode FGC.
13. Les parades FGC favorites s'han de mostrar **barrejades** amb la resta de favorits
    (parades TMB + estacions Bicing) a la llista i al `FavMap`, sense secció pròpia.
14. Com a conseqüència de §6 (mirall de Línies), l'usuari **també** ha de poder marcar
    **línies FGC** com a favorites, barrejades amb les línies TMB favorites.
15. Els favorits FGC han de persistir a localStorage seguint la convenció de claus del
    projecte i sobreviure recàrregues.

### Temps real i marcadors
16. Les **arribades en temps real** d'FGC s'han de mostrar amb el mateix format de minuts
    que TMB (a la llista d'Aprop meu i al popup de parada).
17. Les **posicions de vehicles** FGC s'han de pintar al mapa de la línia (mode FGC),
    refrescant‑se periòdicament (com TMB), amb control de refresc i de visibilitat.

## 5. No‑objectius (fora d'abast)

- **Línies FGC sense connexió directa a Barcelona** (Lleida–La Pobla de Segur, Cremallera
  de Montserrat, Vall de Núria, funiculars turístics): NO s'inclouen.
- **Canvis al mode "Ruta"** (planificador): el planner ja inclou FGC via OTP/TMB; no es
  toca en aquest PRD.
- **Correspondències Metro↔FGC** a estacions compartides (Pl. Espanya, Pl. Catalunya,
  Provença, etc.): fora d'abast v1 (possible futur).
- **Alertes/incidències de servei FGC**: fora d'abast (futur).
- **Bitlletatge, tarifes o validació**: fora d'abast.
- **Cooltra/Bicing nous a sobre d'FGC**: cap canvi a aquestes capes.

## 6. Consideracions de disseny

- **Icona del mode (header):** monocroma `currentColor` (decisió ferma del projecte; un
  logo de color fix es fon amb la barra vermella). Proposta: wordmark "FGC" dins d'un
  quadrat arrodonit (com el wordmark "TMB") o un glyph de tren regional. Cal **mockup**
  abans d'implementar (convenció del projecte per a UI gran).
- **Marcador de parada FGC al mapa:** ha de ser **distingible** de TMB (cercles metro/bus),
  Bicing (quadrats) i Cooltra (mini punts). Proposta: cercle amb el color de la línia
  representativa + un petit glyph de tren, o una forma pròpia. Cal mockup.
- **Colors de línia:** usar `route_color` del GTFS d'FGC (cada línia S/R/L/FGM té el seu).
- **Reutilització:** el mode FGC ha de **reaprofitar** els components de Línies (LineList,
  MapView, FilterBar, SortControls, RefreshControl, popups) per mantenir coherència visual
  i reduir codi nou.
- **Convivència de classes CSS:** atenció a no contaminar classes compartides entre vistes
  (ex. `.panel`), com adverteix el HANDOVER.
- Mockups a l'arrel: `mockup-fgc.html` (mode + marcadors) abans de la UI gran.

## 7. Consideracions tècniques

- **Refactor multi‑operador (clau).** El HANDOVER avisa que ~30 fitxers estan acoblats a
  TMB. Cal introduir un concepte d'**operador** (`TMB | FGC`) als tipus i a la lògica de
  línies/parades/favorits, en lloc de duplicar tot el flux. Decidir aviat: estendre els
  tipus existents amb un camp `operator` vs. tipus paral·lels.
- **Fonts de dades FGC (confirmades per recerca, maig 2026).** FGC publica Open Data al
  portal **Dades Obertes FGC** (Opendatasoft, `dadesobertes.fgc.cat`):
  - **GTFS estàtic:** `https://www.fgc.cat/google/google_transit.zip` (zip; inclou rutes,
    parades, shapes i, típicament, `route_color`).
  - **GTFS‑Realtime** (protobuf): datasets `vehicle-positions-gtfs_realtime` (posicions),
    `trip-updates-gtfs_realtime` (arribades) i `alerts-gtfs_realtime` (alertes de servei).
  - → Això **resol la pregunta oberta #1**: el temps real existeix (posicions + arribades),
    així que la paritat total (§16–17) és viable.
- **Ingesta GTFS + GTFS‑RT.** El GTFS estàtic d'FGC és petit; opció recomanada per al
  **límit de 50 subrequests/invocació de Cloudflare free**: **pre‑bake** de les dades
  estàtiques (línies/parades/shapes/colors filtrades a "connexió Barcelona") en un JSON
  durant el build, servit per la Function. Per al temps real hi ha **dues vies a avaluar**:
  (a) consumir el **GTFS‑RT protobuf** i descodificar‑lo a la Function (cal un decoder
  Protobuf); (b) usar l'**API de records JSON d'Opendatasoft** del mateix dataset
  (`/api/explore/v2.1/catalog/datasets/<slug>/records`), que retorna **JSON** i evitaria el
  protobuf. Preferir (b) si el contingut és equivalent (molt més simple a Cloudflare).
- **⚠️ Validació pendent en producció (regla d'or).** Des de l'entorn de dev els hosts FGC
  estan **fora de l'allowlist** (no s'ha pogut baixar el feed; mateix cas que Bicing). Cal
  validar **en una Pages Function** (o entorn amb xarxa oberta): URL exacta del GTFS‑RT
  (protobuf vs. records JSON), si cal **API key/token** d'Opendatasoft, i que
  `route_color`/noms/`shapes` quadren. Si una via RT no fos viable, v1 degrada a estàtic.
- **Línies que qualifiquen (connexió directa a Barcelona).** Barcelona‑Vallès des de Pl.
  Catalunya (L6, L7, L12, S1, S2, S5/S6/S7…) i Llobregat‑Anoia des de Pl. Espanya (L8, S3,
  S4, S8, S9, R5, R6, R50, R60). Excloses: Lleida–La Pobla de Segur, Cremallera de
  Montserrat, Vall de Núria i funiculars (sense parada a Barcelona).
- **Definició de "Barcelona ciutat".** Els GTFS stops no porten municipi; cal un criteri
  programàtic (polígon municipal de Barcelona, o bbox + curació) per decidir quines línies
  qualifiquen. Resoldre a la fase de dades.
- **Credencials.** Si FGC requereix clau, afegir‑la a Cloudflare Pages (Variables and
  Secrets, Production) i passar‑la per paràmetre als helpers (patró de `functions/_tmb.ts`).
- **Persistència (localStorage).** Seguir la convenció existent, p. ex.
  `tmb-fgc-filter-v1`, `tmb-aprop-fgc-filter-v1`, cache de dades FGC, i bucket de favorits
  FGC (nou bucket o camp `operator` dins dels buckets actuals `tmb-fav-parades` /
  `tmb-fav-linies`).
- **Tests Vitest:** mantenir els 56 verds i afegir‑ne per al normalitzador FGC, el filtre
  d'inclusió "connexió Barcelona" i el filtre d'Aprop meu.

## 8. Mètriques d'èxit

1. Totes les línies FGC amb parada a Barcelona apareixen al mode nou amb el recorregut
   complet i el color correcte.
2. Les parades FGC properes surten a "Aprop meu" (llista + mapa) i es poden filtrar.
3. Es poden crear i recuperar favorits de parades FGC (i línies FGC) després de recarregar.
4. Les arribades en temps real i les posicions de vehicles es mostren quan el feed RT és
   disponible; quan falla, l'app no es bloqueja (cache + Toast).
5. `lint + test + build` verds; sense regressions a TMB/Bicing/Cooltra.

## 9. Preguntes obertes

1. ~~Feed de temps real FGC~~ **RESOLT**: FGC publica GTFS‑RT (posicions, arribades,
   alertes) a `dadesobertes.fgc.cat`. Queda per validar **en producció**: URL exacta
   (protobuf vs. records JSON d'Opendatasoft) i si cal **API key**. (Veure §7.)
2. **Criteri exacte de "Barcelona ciutat":** polígon municipal oficial o llista curada
   d'estacions? Inclou casos límit (p. ex. estacions a la frontera del terme)?
3. ~~Marca i icona~~ **RESOLT**: ja s'ha creat `FgcLogo` (isotip de les baules entrellaçades,
   monocrom `currentColor`) i el mode nou al header amb placeholder "FGC · properament".
4. **Posició al header:** confirmem `FGC` just després de `Línies`? (6 modes; a mòbil són
   només icones, però convé validar que no quedi atapeït.)
5. **Favorits de línies FGC (§14):** es confirma que es poden marcar línies FGC, o v1 es
   limita a parades (com deia la petició original)?
6. **Bucket de favorits:** afegim camp `operator` als buckets existents o creem
   `tmb-fav-fgc`? (Decisió d'arquitectura del refactor multi‑operador.)
</invoke>

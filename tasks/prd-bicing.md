# PRD: Integració de Bicing (estacions GBFS)

## 1. Introduction / Overview

"Tu et Mous Bé" és avui un visor de **TMB** (metro/bus) amb una capa secundària de mobilitat (**Cooltra**, motos+bicis en free-floating). Aquesta feature afegeix el **Bicing** —el sistema públic de bicicletes compartides de Barcelona, basat en **estacions**— consumint el seu feed obert **GBFS v3.0** (`https://barcelona.publicbikesystem.net/customer/gbfs/v3.0/gbfs.json`).

A diferència de Cooltra (vehicles que es mouen), el Bicing és **station-based**: punts fixos amb un nombre de bicis disponibles (elèctriques / mecàniques) i ancoratges lliures que canvien en temps real. La integració apareix en dos llocs:

1. Dins de **"Aprop meu"**, com una **capa pròpia** d'estacions properes (mapa + llista + popup), amb dos xips compactes per filtrar per **elèctric** / **mecànic**.
2. Com un **mode nou al header** ("Bicing", al costat de Línies) amb el mapa complet de totes les estacions i els filtres **elèctriques** / **mecàniques**.

A més, les estacions es poden **desar a Favorits**, com ja passa amb parades i línies.

**Goal**: que un usuari pugui veure d'un cop d'ull on hi ha bicis Bicing (i de quin tipus) a prop seu o a tota la ciutat, amb dades en temps real i a cost zero d'infraestructura.

És una aposta de **portfoli/abast** (segon operador de mobilitat ben integrat) i alhora de **hàbit** (un commuter que combina metro/bus + Bicing).

## 2. Goals

1. Mostrar les estacions de Bicing amb **disponibilitat en temps real** (bicis elèctriques, bicis mecàniques, ancoratges lliures, estat).
2. A **"Aprop meu"**: capa pròpia d'estacions al mapa + secció pròpia a la llista + popup amb detalls, filtrables per tipus de bici.
3. **Mode "Bicing"** nou: mapa de totes les estacions amb filtres elèctriques/mecàniques.
4. Poder **desar estacions a Favorits** i veure-les al mode ★.
5. Mantenir el **cost zero** (Cloudflare free): poques subrequests, cache i refresc raonable.
6. Reaprofitar patrons ja existents (marcadors `CircleMarker`, `favStarIcon`, FilterBar amb estat `'cap'`, cache+toast com Cooltra).

## 3. User Stories

- **Com a usuari que vol agafar una bici ara**, obro "Aprop meu", activo el xip "elèctric" i veig al mapa i a la llista quines estacions properes tenen bicis elèctriques disponibles, amb quantes i a quina distància.
- **Com a usuari que torna una bici**, miro una estació al mapa i el popup em diu quants ancoratges lliures hi ha.
- **Com a commuter**, deso a Favorits l'estació de sota de casa i la del feina; les veig al mode ★ amb la resta del meu transport.
- **Com a usuari que planifica**, obro el mode "Bicing" i exploro totes les estacions de la ciutat filtrant per tipus de bici.

## 4. Functional Requirements

### Dades / Backend (Cloudflare Pages Functions)

1. Nou helper `functions/_bicing.ts` que llegeix el feed GBFS v3.0 i **normalitza** una estació a una forma estable per al frontend:
   - `id`, `name`, `lat`, `lng`, `capacity` (capacitat total)
   - `bikesElectric` (bicis elèctriques disponibles), `bikesMechanical` (bicis mecàniques disponibles)
   - `docksAvailable` (ancoratges lliures)
   - `status` (operativa / tancada / fora de servei → derivat de `is_installed` / `is_renting` / `is_returning`)
   - `lastReported` (timestamp de l'última actualització de l'estació)
2. Nou endpoint `functions/api/bicing/stations.ts` que retorna l'array d'estacions normalitzades (merge de `station_information` + `station_status`, creuant `vehicle_types.json` per separar elèctric vs mecànic).
3. El backend resol elèctric/mecànic mapejant `vehicle_types.json` (`propulsion_type`: `human` → mecànic, `electric_assist`/`electric` → elèctric) contra `station_status.vehicle_types_available`. **⚠️ Cal verificar la forma REAL del feed amb una crida abans de processar** (regla d'or del projecte: els camps i els ids poden diferir del que diu l'spec).
4. Capçaleres de cache raonables (l'estat és sensible al temps; permetre cache curt al navegador, sense cache compartida llarga). El feed són **2–3 subrequests** per invocació (discovery + 2 feeds), molt per sota del límit de 50.

### Frontend — dades

5. `src/types/bicing.ts` amb la interfície `BicingStation`.
6. `src/services/bicing.ts` (fetch a `/api/bicing/stations`).
7. `src/hooks/useBicingStations.ts`:
   - Refresc cada **60 s** (com Cooltra).
   - **Fallback offline**: cache a `localStorage` (`tmb-bicing-stations-v1`); si el fetch falla, s'usa la cache i es mostra un Toast (no bloqueja), igual que la resta de dades.

### "Aprop meu"

8. Les estacions Bicing es mostren **per defecte** com a **capa pròpia** al mapa (marcador visualment **diferenciat** dels punts TMB i Cooltra — veure Design Considerations), limitades pel **radi** actual.
9. A la llista, apareixen en una **secció pròpia** ("Estacions Bicing a prop · N"), **separada** de les parades i **fora** del recompte "X parades a prop".
10. Dos **xips compactes** nous a "Aprop meu": **elèctric** i **mecànic**.
    - Filtren per **disponibilitat real**: amb "elèctric" actiu es mostren només estacions amb **≥1 bici elèctrica** disponible; amb "mecànic", amb ≥1 mecànica; amb tots dos, estacions amb almenys una bici de qualsevol tipus.
    - Es poden **desmarcar tots dos** → s'**oculta** tota la capa Bicing (mateix patró que els xips Metro/Bus, estat `'cap'`).
    - El filtre afecta alhora **mapa i llista**.
    - Estat persistit a `localStorage` (`tmb-aprop-bicing-filter-v1`); per defecte tots dos actius.
11. Cada fila de la llista i el **popup** del marcador mostren els **detalls** (req. 14).
12. Cada estació (fila i popup) té una **estrella** ★ per desar/treure de Favorits.
13. Les estacions favorites mostren l'**estrella daurada** sobre el marcador al mapa (reaprofitant `utils/favStarIcon`).

### Detalls de l'estació (llista i popup) — req. 14

14. Mostrar:
    - **A.** Nom + distància (a "Aprop meu").
    - **B.** Bicis **elèctriques** i **mecàniques** disponibles (desglossat).
    - **C.** Ancoratges **lliures** + capacitat total.
    - **D.** **Estat** de l'estació (operativa / tancada / fora de servei).
    - El mateix conjunt al popup del mapa en clicar una estació (a "Aprop meu" i al mode Bicing).

### Mode "Bicing" (nou)

15. Afegir un **5è mode** al header, **al costat de "Línies"**, amb una icona **"B"** del Bicing. Ordre proposat: **Ruta · Línies · Bicing · Aprop meu · ★**.
16. Actualitzar `ModeToggle.tsx` i el routing de `App.tsx`.
17. El mode obre un **mapa amb TOTES les estacions** de la ciutat (sense límit de radi).
18. Dos **filtres** "elèctriques" / "mecàniques" amb la **mateixa lògica** que a "Aprop meu" (filtre per disponibilitat, tots dos desmarcables, persistència `tmb-bicing-filter-v1`).
19. Popup amb els mateixos detalls i **estrella** de favorit; estacions favorites amb estrella daurada al mapa.

### Favorits

20. Estendre el store de favorits (`src/stores/favorits.ts`) amb un **tercer bucket** per a estacions Bicing (id, nom, lat, lng), persistit a `localStorage` (`tmb-fav-bicing`).
21. `useFavorits` exposa `isBicingFav` / `toggleBicing`.
22. Al mode **★ Favorits**, les estacions Bicing desades apareixen **barrejades amb les parades, sense secció pròpia** (mateixa llista, ordenades per proximitat/recents com la resta), i també al mapa de Favorits (`FavMap`). Cada fila mostra els detalls de Bicing en comptes dels badges de línia.

## 5. Non-Goals (Out of Scope)

- **No** integració del Bicing al **planner de rutes** (last-mile com Cooltra) en aquesta versió.
- **No** reserva/desbloqueig de bici (el Bicing no exposa API pública d'això).
- **No** dades històriques ni predicció de disponibilitat.
- **No** afegir Bicing a l'explorador de **Línies**.
- **No** sincronització de favorits entre dispositius (segueix sent local).
- **No** clustering d'estacions (Bicing BCN té ~500 estacions; marcadors simples n'hi ha prou, menys que els ~1700 de Cooltra).

## 6. Design Considerations

- **Mockup primer** (convenció del projecte): crear `mockup-bicing.html` (mode Bicing + popup) i, si cal, un mockup específic dels **xips compactes**, abans de construir la UI.
- **Xips compactes** ("que ocupin molt poc"): proposta d'**icona + xifra** o **icona-sols** (p. ex. ⚡ per elèctric i una icona de bici/pedal per mecànic), en format pill petit reaprofitant l'estètica de `.filter-btn`. Decidir al mockup.
- **Marcador diferenciat**: el vermell ja l'usen metro (TMB) i, parcialment, Cooltra. Per evitar confusió, l'estació Bicing hauria de tenir **forma o glif propi** (p. ex. pin/quadrat arrodonit amb "B", o color Bicing diferenciat). Decidir al mockup. Z-order: a "Aprop meu" el TMB és el protagonista (Bicing pot anar a sota); al mode Bicing, les estacions són les protagonistes.
- **Icona del mode**: una "B" vermella d'estil Bicing al `ModeToggle` (només icona a mòbil, icona+label a tablet+, com els altres modes).
- Reaprofitar: `CircleMarker` + `bringToBack()` (patró estable, evitar custom panes/DivIcon segons HANDOVER), `favStarIcon`, `FilterBar` amb estat `'cap'`, utils de distància, patró de cache+Toast de Cooltra.

## 7. Technical Considerations

- **Verificació del feed (regla d'or)**: aquest entorn no pot accedir al host (network allowlist), però en **producció les Pages Functions** fan el fetch server-side sense restricció. Cal **afegir `barcelona.publicbikesystem.net` a l'allowlist** de l'entorn de desenvolupament i **verificar la forma real** dels feeds (`station_information`, `station_status`, `vehicle_types`) abans de parsejar — noms de camps i `vehicle_type_id` poden diferir.
- **Sense credencials**: GBFS és obert; no cal `.dev.vars` ni secrets a Cloudflare (a diferència de TMB/Cooltra).
- **Límit 50 subrequests/invocació**: no és problema (2–3 fetches).
- **Volum**: ~500 estacions; render directe amb `CircleMarker` és assumible.
- **GBFS `ttl`/`last_updated`**: l'spec els ofereix; tot i així refresquem cada 60 s (decisió de producte).
- **Cada merge a `main` desplega a producció** (sense staging); verificar `lint + build + test` abans de push.

## 8. Success Metrics

- Les estacions es mostren amb dades coherents amb l'app oficial de Bicing (disponibilitat dins del marge del refresc de 60 s).
- Un usuari pot, en ≤2 tocs des de "Aprop meu", veure estacions amb bicis elèctriques disponibles a prop.
- Hi ha usuaris que desen estacions Bicing a Favorits (ús del nou bucket).
- El mode "Bicing" rep ús (mètrica d'analytics si/quan s'afegeixi).

## 9. Open Questions

1. **Forma exacta del feed Bicing**: noms de camps i `vehicle_type_id` per a elèctric/mecànic — a confirmar amb crida real durant la implementació.
2. **Visual del marcador** Bicing per distingir-lo del vermell TMB/Cooltra — a tancar al mockup.
3. **Estacions buides / fora de servei**: es mostren igualment (amb estat) o s'atenuen visualment? (proposta: mostrar-les amb estat clar).
4. **Posició i asset exactes** de la icona "B" del nou mode.
5. **Comportament dels xips quan tots dos estan desmarcats** a "Aprop meu": confirmat que oculta tota la capa Bicing (no afecta parades TMB).

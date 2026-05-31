# PRD — Estimació horària del temps ("Cal paraigua?")

## 1. Introducció / Overview

Els usuaris demanen saber **quin temps farà avui a Barcelona** abans de sortir de
casa, i **sobretot si ha de ploure**. "Tu et Mous Bé" ja és el lloc on miren com
moure's; afegir-hi el temps el converteix en una **consulta de rutina diària** ("surto
ara → quin transport agafo **i** em cal paraigua?").

Aquesta primera versió mostra el temps **dins el mode "Aprop meu"** (el mode
d'arrencada, que ja té GPS): un **resum compacte** amb un veredicte clar de pluja
("cal paraigua?"), la temperatura actual i una **tira horària de les properes 24 h**.

Objectiu: respondre en <1 segon i d'un cop d'ull la pregunta "**plourà mentre soc
fora avui?**", sense afegir cap mode nou ni trencar el cost zero (Cloudflare free).

> Nota d'abast: la ubicació "dins Aprop meu" és **de moment**. El codi ha de quedar
> prou desacoblat (hook + component propis) per poder-se promoure a mode propi o a
> banner global en el futur sense reescriure la lògica.

## 2. Goals

1. Un usuari a "Aprop meu" veu **immediatament** un veredicte de pluja per a les
   properes hores ("Cal paraigua" / "No et cal") sense cap interacció.
2. Mostrar la **temperatura actual** i la **previsió horària de pluja i temperatura
   de les properes 24 h** (creuant la mitjanit).
3. Fer servir la **ubicació GPS** de l'usuari quan estigui disponible; si no,
   **Barcelona ciutat** com a fallback.
4. **Cost zero**: font de dades gratuïta i sense credencials; ≤1 subrequest per
   invocació; cache CDN adient (les dades meteo no canvien cada 30 s).
5. No degradar l'experiència d'Aprop meu: si el temps falla, Aprop meu segueix
   funcionant igual (degradació elegant, com els altres feeds).

## 3. User Stories

- **Com a** usuari que surt de casa al matí, **vull** veure d'un cop d'ull si plourà
  avui **perquè** decideixi si agafo paraigua abans de baixar al carrer.
- **Com a** usuari, **vull** veure la temperatura actual i com evolucionarà **perquè**
  sàpiga com vestir-me.
- **Com a** usuari que ja és a "Aprop meu" mirant parades, **vull** que el temps surti
  al mateix lloc **perquè** no haja d'anar a una altra app ni a un altre mode.
- **Com a** usuari sense permís de GPS, **vull** veure igualment el temps de Barcelona
  **perquè** la informació segueixi sent útil.

## 4. Functional Requirements

### Dades i backend
1. El sistema ha d'obtenir la previsió d'una **API meteorològica gratuïta i sense
   credencials** (recomanat: **Open‑Meteo**, `api.open-meteo.com/v1/forecast`, que no
   requereix API key i suporta previsió horària i probabilitat de precipitació).
2. La crida s'ha de fer a través d'una **Cloudflare Pages Function**
   (`functions/api/weather/forecast.ts`) seguint el patró del projecte (proxy +
   normalització + `cache-control`), **no** directament des del frontend.
3. La Function ha d'acceptar **`lat` i `lon`** com a query params i validar‑los; si
   falten o són invàlids, ha d'usar les coordenades de **Barcelona** per defecte.
4. La resposta normalitzada ha d'exposar com a mínim:
   - **Actual**: temperatura (°C), codi de cel (WMO), indicador de pluja en curs.
   - **Horari (properes 24 h)**: per hora → timestamp, temperatura (°C),
     **probabilitat de precipitació (%)**, **precipitació (mm)**, codi de cel (WMO).
5. La Function ha de demanar les dades en **zona horària `Europe/Madrid`** i tornar
   timestamps que el frontend pugui mostrar en hora local de Barcelona.
6. `cache-control` de la resposta: **`max-age=600`** (10 min) — prou fresc per a temps,
   prou llarg per no consumir invocacions. (Ajustable si cal.)
7. Degradació: si l'API falla, la Function torna un error controlat i el frontend ho
   gestiona sense trencar Aprop meu (mostra estat "temps no disponible", reusa cache
   recent si n'hi ha).

### Lògica "Cal paraigua?"
8. El sistema ha de derivar un **veredicte binari de pluja** a partir de les properes
   ~12 h (o fins a final del dia): hi ha pluja prevista si **alguna hora** supera un
   **llindar de probabilitat** (per defecte **≥ 50 %**) **i/o** una **quantitat
   mínima** de precipitació (per defecte **≥ 0,2 mm**). Els llindars han de ser
   constants fàcilment ajustables.
9. El veredicte s'ha de mostrar com a **missatge clar en català**:
   - Amb pluja → p. ex. **"Agafa paraigua"** + la **franja horària** principal
     ("cap a les 17–19 h").
   - Sense pluja → p. ex. **"No et cal paraigua"**.
10. Si plou **ara mateix**, el missatge ho ha de prioritzar ("Està plovent").

### UI (dins "Aprop meu")
11. A "Aprop meu" hi ha d'haver un **resum de temps compacte** (capçalera/targeta) que
    mostri sempre: **icona de cel + temperatura actual + veredicte de paraigua**.
12. El resum s'ha de poder **desplegar** per veure la **tira horària de les properes
    24 h** (scroll horitzontal): per cada hora → hora, icona de cel, temperatura i
    **% de pluja** (destacant visualment les hores amb pluja probable).
13. Les **icones de cel** s'han de derivar del **codi WMO** amb un mapatge a icona +
    etiqueta en català (sol, núvols, pluja, tempesta, boira, neu…). Han de ser
    monocromes/SVG coherents amb l'estil de l'app (lliçó del HANDOVER: res de PNG de
    color fix que es fongui amb la barra).
14. Estats d'UI: **carregant** (skeleton discret), **error/no disponible** (missatge
    curt, no bloqueja Aprop meu), **sense GPS** (mostra temps de Barcelona amb una nota
    "Barcelona").
15. El refresc ha de seguir la **regla d'or del mapa**: actualitzar el temps **mai** ha
    de moure el centre ni el zoom del mapa d'Aprop meu.

### Persistència i refresc
16. Cachejar l'última previsió a **localStorage** (clau `tmb-weather-v1`) per pintar a
    l'instant en obrir l'app i com a fallback si la xarxa falla.
17. Refrescar la previsió en un **interval raonable** (p. ex. cada 10 min o en
    re‑foco/canvi notable de posició), no cada 30 s com els feeds en temps real.

## 5. Non-Goals (Out of Scope)

- **No** és un mode propi al header (de moment viu dins "Aprop meu").
- **No** hi ha previsió multi‑dia (5–7 dies) en aquesta versió: només **ara + 24 h**.
- **No** hi ha **notificacions push** de pluja ("avís abans de sortir"): trencaria el
  cost zero (cal Web Push + backend amb estat). Queda com a aposta futura.
- **No** mostrem vent, humitat, UV, qualitat de l'aire ni mapes de radar en v1
  (només cel, temperatura i pluja).
- **No** és un cercador de temps d'altres ciutats: sempre GPS o Barcelona.
- **No** afegim cap dependència nova pesada ni cap servei de pagament.

## 6. Design Considerations

- **Mockup HTML a l'arrel abans de l'UI** (convenció del projecte):
  `mockup-temps.html` amb el resum compacte + la tira horària desplegada.
- Reutilitzar estil i tokens de l'app (`src/App.css`); component nou
  (p. ex. `WeatherSummary.tsx` + `WeatherHourly.tsx`) col·locat dins el layout
  d'Aprop meu, **sense contaminar** les classes compartides (`.panel` té regles del
  bottom‑sheet — vigilar, lliçó del HANDOVER).
- El veredicte de paraigua és l'element més prominent (mida/contrast), perquè és
  "el que més interessa".
- Icones de cel: SVG inline / `currentColor` o set d'emojis controlats embolicats amb
  `line-height: 1` (lliçó del HANDOVER sobre centrat d'emojis).

## 7. Technical Considerations

- **Font de dades**: Open‑Meteo (gratuït, sense key). Camps suggerits:
  `current=temperature_2m,weather_code,precipitation`;
  `hourly=temperature_2m,precipitation_probability,precipitation,weather_code`;
  `forecast_hours=24` (o `forecast_days=2` retallant a 24 h); `timezone=Europe/Madrid`.
  ⚠️ **Regla d'or del projecte: verificar la forma real de la resposta amb una crida
  real** abans de processar‑la (l'entorn de dev pot tenir el host fora de l'allowlist;
  en producció les Pages Functions hi accedeixen).
- **Estructura backend**: `functions/_weather.ts` (helper + normalitzador defensiu) +
  `functions/api/weather/forecast.ts` (proxy públic, sense credencials), com `_bicing.ts`.
- **Subrequests**: 1 sola crida per invocació → molt per sota del límit de 50.
- **Frontend**: `types/weather.ts`, `services/weather.ts`, `hooks/useWeather.ts`
  (refresc + cache `tmb-weather-v1` + fallback/Toast), `utils/weatherCode.ts` (WMO →
  icona/etiqueta CA, amb tests), `utils/umbrella.ts` (veredicte de pluja, amb tests),
  components `WeatherSummary`/`WeatherHourly`.
- **Tests Vitest** (mantenir la suite verda; ara 69): com a mínim
  `utils/weatherCode.test.ts` i `utils/umbrella.test.ts` (casos: pluja al matí, pluja
  ara, dia sec, dades parcials/buides).
- **Desacoblament**: la lògica (hook + utils) no ha de dependre d'Aprop meu, per poder
  promoure el temps a mode propi/banner sense reescriure‑la ("de moment").

## 8. Success Metrics

- L'usuari pot respondre "em cal paraigua avui?" **sense sortir d'Aprop meu** i d'un
  cop d'ull (validació qualitativa amb el feedback que va originar la petició).
- **0 regressions** a Aprop meu quan el temps no està disponible (Aprop meu segueix
  carregant parades/Bicing/FGC).
- Consum: **1 subrequest** per càrrega de temps; sense credencials; cost zero mantingut.
- Reducció del feedback recurrent demanant "saber si plourà".

## 9. Open Questions

1. **Llindars de "cal paraigua"**: confirmem 50 % de probabilitat i/o 0,2 mm? Volem dos
   nivells ("potser" vs "segur") o només binari?
2. **Finestra del veredicte**: properes 12 h, fins a final del dia, o tota la finestra
   de 24 h?
3. **Disparador de refresc**: només interval de temps, o també quan l'usuari es mou X
   metres?
4. **Promoció futura a mode propi/banner**: ho preveiem ja a la UI (p. ex. fent el
   resum tappable cap a una vista ampliada) o ho deixem totalment per a una v2?
5. **Atribució**: Open‑Meteo demana citar la font (CC‑BY) — on posem el crèdit (peu del
   panell de temps)?

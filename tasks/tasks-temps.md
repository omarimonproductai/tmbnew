# Tasks — Estimació horària del temps ("Cal paraigua?")

Basat en `tasks/prd-temps.md`.

## Relevant Files

- `functions/_weather.ts` - Helper + normalitzador defensiu de la resposta d'Open‑Meteo (current + hourly → forma estable de l'app). Patró de `functions/_bicing.ts`.
- `functions/api/weather/forecast.ts` - Pages Function pública (proxy, sense credencials): valida `lat`/`lon`, crida Open‑Meteo, normalitza i respon amb `cache-control: max-age=600`.
- `src/types/weather.ts` - Tipus compartits (`WeatherNow`, `WeatherHour`, `WeatherForecast`, codis WMO).
- `src/services/weather.ts` - Client frontend que crida `/api/weather/forecast`.
- `src/utils/weatherCode.ts` - Mapatge codi WMO → icona + etiqueta en català.
- `src/utils/weatherCode.test.ts` - Tests del mapatge WMO (codis coneguts + fallback desconegut).
- `src/utils/umbrella.ts` - Lògica del veredicte "cal paraigua" (llindars + franja horària + pluja ara).
- `src/utils/umbrella.test.ts` - Tests del veredicte (pluja matí, pluja ara, dia sec, dades parcials/buides).
- `src/hooks/useWeather.ts` - Hook de dades: fetch per GPS (fallback Barcelona), refresc per interval, cache `tmb-weather-v1`, degradació elegant.
- `src/components/WeatherSummary.tsx` - Resum compacte (icona + temperatura actual + veredicte), desplegable.
- `src/components/WeatherHourly.tsx` - Tira horària de les properes 24 h (scroll horitzontal).
- `src/components/ParadesAprop.tsx` - Mode "Aprop meu": s'hi insereix el resum de temps (passant la posició GPS ja existent).
- `src/App.css` - Estils dels components de temps (sense contaminar `.panel`).
- `mockup-temps.html` - Mockup HTML del resum compacte + tira horària (a l'arrel, abans de l'UI).

### Notes

- Tests amb **Vitest**: `npm test` (no Jest). Cal mantenir la suite verda (ara 69).
- Verificació abans de cada push: `npm run lint && npm test && npm run build`.
- ⚠️ **Regla d'or**: verificar la forma REAL de la resposta d'Open‑Meteo amb una crida real abans de processar‑la (en dev el host pot estar fora de l'allowlist; en prod la Function hi accedeix).
- ⚠️ **Regla d'or del mapa**: el refresc del temps mai ha de moure centre/zoom del mapa d'Aprop meu.
- Mantenir la lògica (hook + utils) desacoblada d'Aprop meu per poder promoure‑la a mode propi/banner en el futur ("de moment").

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Treballar a la branca assignada `claude/compassionate-shannon-SYYeo` (ja creada des de `main`); confirmar que està actualitzada amb `main`.

- [x] 1.0 Backend: Pages Function de previsió (Open‑Meteo) + normalitzador
  - [x] 1.1 Verificar amb una crida real la forma de la resposta d'Open‑Meteo (`current` + `hourly` amb `temperature_2m,precipitation_probability,precipitation,weather_code`, `timezone=Europe/Madrid`, `forecast_hours=24`) i anotar els camps reals.
  - [x] 1.2 Crear `functions/_weather.ts` amb un normalitzador defensiu: actual (temp, codi WMO, pluja en curs) + array de 24 h (timestamp, temp, prob. pluja %, precip mm, codi WMO). Gestionar camps absents/nuls.
  - [x] 1.3 Crear `functions/api/weather/forecast.ts`: llegir `lat`/`lon` dels query params, validar‑los i fer fallback a coordenades de Barcelona si falten o són invàlids.
  - [x] 1.4 Cridar Open‑Meteo (1 sol fetch), normalitzar amb `_weather.ts` i respondre JSON amb `cache-control: max-age=600`.
  - [x] 1.5 Degradació: si Open‑Meteo falla, tornar un error controlat (status + cos JSON) sense excepcions no gestionades.
  - [ ] 1.6 Provar l'endpoint en local (`npm run dev:functions`) amb i sense `lat`/`lon`. ⚠️ PENDENT: el host d'Open‑Meteo està fora de l'allowlist de dev (com va passar amb Bicing); cal validar‑lo en producció (regla d'or). El normalitzador és defensiu mentrestant.

- [x] 2.0 Lògica compartida: tipus, client, mapatge WMO i veredicte (amb tests)
  - [x] 2.1 Crear `src/types/weather.ts` (`WeatherNow`, `WeatherHour`, `WeatherForecast`).
  - [x] 2.2 Crear `src/services/weather.ts` que crida `/api/weather/forecast?lat=&lon=` i retorna `WeatherForecast` tipat.
  - [x] 2.3 Crear `src/utils/weatherCode.ts`: codi WMO → `{ icon, label }` en català (sol, núvols, pluja, tempesta, boira, neu…) amb fallback per a codis desconeguts.
  - [x] 2.4 Escriure `src/utils/weatherCode.test.ts` (codis representatius + fallback).
  - [x] 2.5 Crear `src/utils/umbrella.ts`: veredicte de pluja sobre les properes ~12 h (llindars constants ajustables: prob. ≥ 50 % i/o precip ≥ 0,2 mm), franja horària principal ("cap a les 17–19 h") i prioritat "Està plovent" si plou ara.
  - [x] 2.6 Escriure `src/utils/umbrella.test.ts` (pluja al matí, pluja ara, dia sec, dades parcials/buides).

- [x] 3.0 Hook de dades `useWeather`
  - [x] 3.1 Crear `src/hooks/useWeather.ts` que rep `lat`/`lon` (o null) i crida el client; si no hi ha posició, usa Barcelona i marca `source: 'barcelona'`.
  - [x] 3.2 Cache a localStorage `tmb-weather-v1`: pintar a l'instant l'última previsió i usar‑la com a fallback si la xarxa falla (+ Toast, com els altres feeds).
  - [x] 3.3 Refresc per interval (~10 min) i en re‑foco; **no** cada 30 s. Netejar timers en desmuntar.
  - [x] 3.4 Exposar estats: `loading`, `error`, `forecast`, `source` ('gps' | 'barcelona').

- [x] 4.0 Mockup HTML + UI dins "Aprop meu"
  - [x] 4.1 Crear `mockup-temps.html` a l'arrel amb el resum compacte i la tira horària desplegada (validar disseny abans de codi).
  - [x] 4.2 Crear `WeatherSummary.tsx`: icona de cel + temperatura actual + veredicte de paraigua (element més prominent); botó/àrea per desplegar.
  - [x] 4.3 Crear `WeatherHourly.tsx`: tira horària 24 h amb scroll horitzontal (hora, icona, temp, % pluja; destacar hores amb pluja probable).
  - [x] 4.4 Inserir `WeatherSummary` a `ParadesAprop.tsx` reutilitzant la posició GPS ja existent; estat de càrrega (skeleton), error ("temps no disponible", no bloqueja) i nota "Barcelona" quan `source==='barcelona'`.
  - [x] 4.5 Afegir estils a `src/App.css` sense tocar `.panel` (evitar contaminació del bottom‑sheet); icones de cel monocromes/SVG coherents amb l'app.
  - [x] 4.6 Comprovar la regla d'or del mapa: el refresc del temps no mou centre ni zoom del mapa d'Aprop meu.
  - [x] 4.7 Afegir l'atribució d'Open‑Meteo (CC‑BY) al peu del panell de temps.

- [x] 5.0 Verificació i push
  - [x] 5.1 `npm run lint` net.
  - [x] 5.2 `npm test` verd (incloent els tests nous de `weatherCode` i `umbrella`).
  - [x] 5.3 `npm run build` correcte.
  - [x] 5.4 Commits petits i descriptius; push a `claude/compassionate-shannon-SYYeo`.

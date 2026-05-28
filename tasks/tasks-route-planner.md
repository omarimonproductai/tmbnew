# Tasks · Route Planner

Source PRD: [`prd-route-planner.md`](./prd-route-planner.md)
UI reference: [`/mockup-route-planner.html`](../mockup-route-planner.html)

## Relevant Files

### Backend (Cloudflare Functions)
- `functions/_planner.ts` (new) — TMB Planner helpers: types (OTP `Itinerary` / `Leg`), `fetchPlan(creds, params)`, normalisation.
- `functions/api/planner/plan.ts` (new) — `GET /api/planner/plan` handler.
- `functions/_photon.ts` (new) — Photon helpers: URL builder with proximity bias, fetch.
- `functions/api/geocode/search.ts` (new) — `GET /api/geocode/search?q=&lat=&lon=` handler with 1h cache.

### Frontend services & types
- `src/services/planner.ts` (new) — `getRoutePlan(from, to, modes)`.
- `src/services/geocode.ts` (new) — `searchPlaces(query, biasLatLng)`.
- `src/types/planner.ts` (new) — `RoutePlan`, `Itinerary`, `Leg`, `LegMode` types.
- `src/types/geocode.ts` (new) — `GeocodeResult` type.

### Frontend hooks
- `src/hooks/useDisplayMode.ts` (modified) — add `'route'` to the mode union and persistence.
- `src/hooks/useRoutePlan.ts` (new) — fetch + manage state for a planning request.
- `src/hooks/useRoutePlan.test.ts` (new) — unit tests with mocked fetch.
- `src/hooks/usePhotonSearch.ts` (new) — debounced (300ms) autocomplete hook.
- `src/hooks/usePlannerHistory.ts` (new) — localStorage CRUD for last 5 destinations.
- `src/hooks/usePlannerHistory.test.ts` (new) — unit tests.
- `src/hooks/usePlannerModes.ts` (new) — localStorage for `{metro, bus}` filters.

### Frontend components
- `src/components/RoutePlannerView.tsx` (new) — top-level container for the new mode.
- `src/components/RouteSearchForm.tsx` (new) — A→B fields, swap button, autocomplete dropdown integration.
- `src/components/RouteSearchForm.test.tsx` (new) — input + validation tests.
- `src/components/RouteFieldRow.tsx` (new) — the dot + dashed line + dot column shared by the two fields.
- `src/components/GeocodeDropdown.tsx` (new) — render Photon results.
- `src/components/RoutePlanTabs.tsx` (new) — 3-tab selector (Més ràpida / Menys transbords / Menys camí).
- `src/components/RoutePlanTabs.test.tsx` (new) — tab labelling + dedupe tests.
- `src/components/RoutePlanMap.tsx` (new) — Leaflet map with polylines + key markers + summary chip.
- `src/components/RouteLegPopup.tsx` (new) — small Leaflet popup content for boarding / transfer / alighting.
- `src/components/RouteSummaryChip.tsx` (new) — floating chip on top of the map.
- `src/components/RouteRecenterButton.tsx` (new) — fit-bounds button on the map.
- `src/components/PlannerModeFilters.tsx` (new) — Metro/Bus pills.
- `src/components/PlannerEmptyState.tsx` (new) — error / no-route / missing-GPS messaging.
- `src/components/ModeToggle.tsx` (modified) — 4 buttons, new icons, mobile = icon-only / desktop = icon+label.
- `src/components/ModeToggle.test.tsx` (modified) — tests for the 4 modes incl. `'route'`.
- `src/components/AproperMeuStopPopup.tsx` (modified) — "Ruta fins aquí" button.
- `src/components/StopPopup.tsx` (modified) — same button.

### App wiring & styling
- `src/App.tsx` (modified) — render `RoutePlannerView` when mode is `'route'`.
- `src/App.css` (modified) — styles for form, dropdown, tabs, map controls, mode toggle.

### Utilities
- `src/utils/polyline.ts` (new) — Google polyline decoder (lat/lng pairs).
- `src/utils/polyline.test.ts` (new) — known fixture tests.
- `src/utils/distance.ts` (existing) — `haversine()` reused for 200m Cooltra filter.

### Existing pieces reused
- `src/hooks/useCooltraVehicles.ts` — fetched once, filtered client-side for the destination 200m radius.
- `src/components/CooltraLayer.tsx` — renders the filtered fleet on the planner map.
- `functions/_tmb.ts` — credentials helper (already in place).

### Notes
- All new tests follow the project's vitest convention; run `npm test`.
- Verify lint+build+test before pushing each parent task (per `CLAUDE.md`).
- Each parent task (1.0, 2.0…) opens its own branch off `feature/route-planner` per the
  "Branch per Parent Task" convention, with an integration PR back into it.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off in this file by changing `- [ ]` to `- [x]`. Update after every sub-task, not just at parent completion.

---

## Tasks

- [ ] **0.0 Create feature branch**
  - [ ] 0.1 `git checkout main && git pull`
  - [ ] 0.2 `git checkout -b feature/route-planner && git push -u origin feature/route-planner`
  - [ ] 0.3 Confirm the PRD (`tasks/prd-route-planner.md`) and the mockup
        (`mockup-route-planner.html`) exist on this branch.

- [ ] **1.0 Backend proxies (TMB Planner + Photon geocoder)**
  - [ ] 1.1 Create `functions/_planner.ts` with `OTPItinerary` / `OTPLeg` types
        reflecting the fields used by the frontend (mode, route, routeShortName,
        startTime, endTime, from, to, distance, duration, legGeometry.points,
        intermediateStops, transitTime, walkTime, transfers, walkDistance).
  - [ ] 1.2 In `_planner.ts`, write `buildPlanUrl(params)` that emits the TMB
        URL with `mode=TRANSIT,WALK` (configurable), `maxWalkDistance=800`,
        `showIntermediateStops=true`, `numItineraries=5`, MM-DD-YYYY date
        and `hh:mmam/pm` time computed server-side from `Date.now()`.
  - [ ] 1.3 Write `normalisePlan(rawOtpResponse)` that strips OTP cruft and
        returns `{itineraries: Itinerary[]}` matching the frontend type.
  - [ ] 1.4 Create `functions/api/planner/plan.ts` with the `onRequest`
        handler. Validate required query params (`fromLat`, `fromLon`,
        `toLat`, `toLon`). Allow optional `modes=metro,bus`. Set
        `cache-control: no-store` because plans are time-sensitive.
  - [ ] 1.5 Create `functions/_photon.ts` with `buildPhotonUrl(q, bias?)`
        adding `&lat=41.387&lon=2.168&location_bias_scale=0.2` by default
        and `&limit=5`.
  - [ ] 1.6 Create `functions/api/geocode/search.ts` with the handler.
        Require `q` of length ≥ 3. Set `cache-control: public, max-age=3600`.
  - [ ] 1.7 Probe both endpoints from the dev server with curl (one expected
        success, one validation error per endpoint). Save sample output to
        `tasks/probe-planner.txt` and `tasks/probe-geocode.txt` for
        reference.

- [ ] **2.0 New "Ruta" mode + icon redesign**
  - [ ] 2.1 Update `src/hooks/useDisplayMode.ts`: extend the union type to
        `'linies' | 'aprop' | 'favorits' | 'route'`. Keep localStorage key.
        Default starts at `'aprop'` (unchanged; do not switch the landing
        page in this feature).
  - [ ] 2.2 Update `src/components/ModeToggle.tsx`: redesign with 4 buttons.
        Each button renders an inline SVG (Ruta = nav arrow, Línies =
        bus+rectangle, Aprop meu = radar concèntric, Favorits = star).
  - [ ] 2.3 Add responsive label: SVG icon always; text label visible only
        at `min-width: 641px` via CSS class (e.g. `.mode-btn__label`
        with `display: none` until tablet breakpoint).
  - [ ] 2.4 Update `src/components/ModeToggle.test.tsx`: test that 4
        buttons render, that clicking each calls onChange with the right
        value, and that `'route'` is recognised.
  - [ ] 2.5 Create `src/components/RoutePlannerView.tsx` shell (placeholder
        text "Route planner – coming soon" inside `<main className="app-main">`).
  - [ ] 2.6 Update `src/App.tsx` to render `RoutePlannerView` when
        `mode === 'route'`.
  - [ ] 2.7 Update `src/App.css` for the new ModeToggle layout (icon column
        + optional label, sizing tweaks for 4 items).
  - [ ] 2.8 Smoke-check: switch between the 4 modes in dev, confirm
        navigation works and each view still renders correctly.

- [ ] **3.0 Search form (A → B)**
  - [ ] 3.1 Create `src/services/geocode.ts` with `searchPlaces(query)` that
        calls `/api/geocode/search?q=…`. Returns typed `GeocodeResult[]`.
  - [ ] 3.2 Create `src/types/geocode.ts` with `GeocodeResult`
        `{ id, name, sub, lat, lng, osmType, osmKey }`.
  - [ ] 3.3 Create `src/hooks/usePhotonSearch.ts` with 300ms debounce,
        min-3-char threshold, and abort on rapid retyping.
  - [ ] 3.4 Create `src/hooks/usePlannerHistory.ts` with
        `add(destination)`, `list()` (max 5, MRU order), persistence on
        `tmb-planner-history-v1`.
  - [ ] 3.5 Create `src/hooks/usePlannerModes.ts` with `{ metro, bus }`
        defaulting both to true, persisted on `tmb-planner-modes-v1`.
  - [ ] 3.6 Create `src/components/RouteFieldRow.tsx`: blue dot (origin) +
        dashed line + red dot (destination), with editable inputs and a
        prop for the focused field.
  - [ ] 3.7 Create `src/components/GeocodeDropdown.tsx`: renders Photon
        results with icon (POI/transit/street) + name (bold) + sub.
  - [ ] 3.8 Create `src/components/PlannerModeFilters.tsx`: Metro/Bus pills.
        Prevent both being toggled off (show a small inline message).
  - [ ] 3.9 Create `src/components/RouteSearchForm.tsx` that composes the
        field row, dropdowns (history when empty, geocode when typing),
        filter pills, and the swap button (↕).
  - [ ] 3.10 GPS auto-fill: on mount, if geolocation grants, prefill
        `from` with `{ name: 'La meva ubicació', lat, lng }`. If denied,
        leave the field empty with placeholder and block the "Buscar"
        button.
  - [ ] 3.11 Make origin editable: tapping the field clears the "La meva
        ubicació" sentinel and lets the user search for any address.
  - [ ] 3.12 Swap button (↕) swaps the two values atomically.
  - [ ] 3.13 Tests in `RouteSearchForm.test.tsx`: input debouncing, GPS
        auto-fill flow, swap behaviour, history shown when empty,
        Metro+Bus prevention.

- [ ] **4.0 Result rendering on map**
  - [ ] 4.1 Create `src/types/planner.ts` mirroring the normalised backend
        shape (`Itinerary`, `Leg`, `LegMode = 'WALK' | 'BUS' | 'METRO' | 'SUBWAY' | 'TRAM'`).
  - [ ] 4.2 Create `src/services/planner.ts` with
        `getRoutePlan(from, to, modes): Promise<RoutePlan>`.
  - [ ] 4.3 Create `src/hooks/useRoutePlan.ts` with explicit `trigger()`
        (no auto-fetch — only on Buscar). Surface loading / error / data.
  - [ ] 4.4 Create `src/utils/polyline.ts` Google polyline decoder
        (5-precision). Add tests with at least 2 fixtures.
  - [ ] 4.5 Create `src/components/RoutePlanTabs.tsx` with labelling
        logic: pick fastest / fewest-transfers / least-walking. If two
        labels would map to the same itinerary, only render one with a
        combined label (e.g. "Més ràpida · menys transbords").
  - [ ] 4.6 Create `src/components/RoutePlanMap.tsx`: render polyline per
        leg (WALK = dashed gray, transit = `linia.color` or fallback by
        mode). Add boarding / alighting / transfer markers and the origin
        dot + destination pin. Fit-bounds on mount.
  - [ ] 4.7 Create `src/components/RouteLegPopup.tsx` with leg-specific
        content (e.g. "Pugeu al [V15] cap a [Av. Tibidabo]", "Baixa",
        "Transbord"). Bind to the relevant markers.
  - [ ] 4.8 Create `src/components/RouteSummaryChip.tsx`: floats over the
        top of the map showing big duration + meta (arribada, transbords,
        m a peu).
  - [ ] 4.9 Create `src/components/RouteRecenterButton.tsx` (bottom-right
        of the map) that re-applies fit-bounds to the route.
  - [ ] 4.10 Create `src/components/PlannerEmptyState.tsx` for the
        loading spinner, no-route, fora-de-cobertura, and API error
        states; use it where appropriate inside `RoutePlannerView`.
  - [ ] 4.11 When a result is loaded, the `RouteSearchForm` collapses to a
        compact 2-line summary at the top (origin + destination text,
        swap button optional). Tapping either line re-expands the field.
  - [ ] 4.12 Tests in `RoutePlanTabs.test.tsx` covering labelling logic
        and dedupe; tests in `useRoutePlan.test.ts` mocking fetch.

- [ ] **5.0 Last-mile Cooltra + contextual entry + polish**
  - [ ] 5.1 Inside `RoutePlannerView`, call `useCooltraVehicles(true)` to
        always have the fleet available.
  - [ ] 5.2 When a `RoutePlan` is loaded, compute the destination
        coordinates and filter the fleet by `haversine(dest, vehicle) ≤ 200`.
  - [ ] 5.3 Pass the filtered list to `RoutePlanMap` and render via the
        existing `CooltraLayer` component.
  - [ ] 5.4 Update `src/components/AproperMeuStopPopup.tsx` to add a
        button **"Ruta fins aquí"** that calls a callback prop with
        `{ name, lat, lng }`.
  - [ ] 5.5 Update `src/components/StopPopup.tsx` likewise for the Línies
        view's stops.
  - [ ] 5.6 Wire the callback in the parent views (`AproperMeuView`,
        `LiniesView`): on click, switch `mode` to `'route'` and store the
        seed destination in a shared ref or `sessionStorage`
        (`tmb-planner-seed-v1`). `RoutePlannerView` consumes it on mount,
        clears the seed, prefills the destination, triggers Buscar.
  - [ ] 5.7 Handle the A → A edge case: if origin and destination are
        within 50m, show a friendly "Ja estàs aquí" message instead of
        calling the API.
  - [ ] 5.8 Handle the no-GPS edge case: if `useGeolocation()` returns
        `denied`, render an inline hint in the form ("Activa la
        geolocalització o escriu un origen") and disable Buscar until
        either GPS arrives or the user types an origin.
  - [ ] 5.9 Responsive polish:
        - Mobile: the form lives in a top sheet that collapses on result.
        - Desktop/tablet: form in a left panel (≥ 641px), map fills the rest.
  - [ ] 5.10 Run `npm run lint && npm run build && npm test` clean before
        opening the integration PR.
  - [ ] 5.11 Walk through `Open Questions` in the PRD once more; mark
        resolutions or move unresolved ones to a follow-up task list.
  - [ ] 5.12 Open the integration PR from `feature/route-planner` to
        `main` summarising what landed and including before/after
        screenshots.

## Relevant Files

- `vite.config.ts` - On registrar i configurar `vite-plugin-pwa` (manifest + Workbox).
- `package.json` - Afegir la dependència `vite-plugin-pwa`.
- `index.html` - Meta tags d'iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`).
- `public/` - Icones de l'app (192/512 + maskable) i, si cal, `apple-touch-icon`.
- `src/hooks/useInstallPrompt.ts` - Hook nou: captura `beforeinstallprompt`, estat d'instal·lació i de descartament.
- `src/hooks/useInstallPrompt.test.ts` - Tests del hook d'instal·lació.
- `src/hooks/useDisplayMode.ts` - Hook nou: detecta mode standalone (instal·lada) i estat online/offline.
- `src/components/InstallBanner.tsx` - Banner/botó "Instal·la l'app" (Android) + fitxa d'instruccions iOS.
- `src/components/InstallBanner.test.tsx` - Tests del banner segons plataforma i estat de descartament.
- `src/App.tsx` - Muntar el banner i decidir la vista d'arrencada (Favorits si standalone + té favorits).
- `mockup-pwa-install.html` - Mockup HTML del banner Android i de la fitxa iOS abans d'implementar la UI.

### Notes

- Tests amb Vitest: `npx vitest run` (o un path concret). Mantenir els 33 tests existents verds.
- Verificar `npm run lint`, `npx vitest run` i `npm run build` abans de cada push (convenció del repo).
- Cost zero: tot al client, sense canvis al backend ni a les Pages Functions.
- Provar instal·lació i offline en **dispositiu real** (Android/Chrome i iOS Safari); Lighthouse per als checks PWA.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Treballar a la branca designada de la sessió (`claude/lucid-ritchie-GtQ1u`); confirmar amb `git status` que partim neta i actualitzada.

- [x] 1.0 Configurar tooling PWA, manifest i icones (vite-plugin-pwa, meta tags iOS, icones placeholder)
  - [x] 1.1 Instal·lar `vite-plugin-pwa` com a devDependency i afegir-lo a `package.json`.
  - [x] 1.2 Registrar `VitePWA(...)` a `vite.config.ts` amb `registerType: 'autoUpdate'` i el bloc `manifest` (name "Tu et Mous Bé", short_name curt, `start_url: '/'`, `display: 'standalone'`, `theme_color: '#c8001e'`, `background_color`).
  - [x] 1.3 Generar icones placeholder a partir del badge "TMB" a `public/`: `pwa-192.png`, `pwa-512.png` i una variant `maskable` (purpose `maskable`), i referenciar-les al manifest.
  - [x] 1.4 Afegir a `index.html` els meta/link d'iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` i `theme-color`.
  - [x] 1.5 Verificar amb `npm run build` que es genera `manifest.webmanifest` + service worker i que el manifest és vàlid (sense errors a la consola).

- [ ] 2.0 Service worker i comportament offline (precache del shell, dades cachejades offline, temps real "no disponible offline")
  - [x] 2.1 Configurar el precache de Workbox per a l'app shell (assets del build: HTML/CSS/JS) via la config de `vite-plugin-pwa`. _(generateSW, 10 entrades precachejades)_
  - [ ] 2.2 (Opcional, per defecte OFF — open question #2) Afegir un runtime cache conservador per als tiles de CARTO amb límit d'entrades/edat; deixar-ho documentat però desactivat si es decideix no fer-ho. _(deixat OFF de moment)_
  - [x] 2.3 Confirmar que les dades ja guardades a localStorage (`tmb-parades-all-v1`, `tmb-fav-*`) es llegeixen i es pinten sense xarxa (revisar que cap fetch bloqueja el render inicial). _(ja ho fa `useTotesParades`: hidrata des de cache + manté dades en fallada)_
  - [x] 2.4 Crear `src/hooks/useDisplayMode.ts` amb detecció `navigator.onLine` + esdeveniments `online`/`offline` (i, reaprofitat a la 4.0, detecció de standalone).
  - [x] 2.5 Mostrar un estat clar de "temps real no disponible offline" reutilitzant el patró de `Toast`/estat existent, sense bloquejar la UI.
  - [x] 2.6 Gestionar l'actualització del SW entre deploys (`autoUpdate`); verificar que un build nou substitueix el SW i no deixa l'usuari amb una versió antiga enganxada.
  - [ ] 2.7 Provar en mode avió: l'app obre, mostra mapa base + parades/favorits guardats, i el temps real indica que no està disponible. _(prova manual en dispositiu)_

- [x] 3.0 UX d'invitació a instal·lar (mockup → banner Android amb `beforeinstallprompt` + fitxa d'instruccions iOS + persistència del descartament)
  - [x] 3.1 Fer `mockup-pwa-install.html` a l'arrel amb el banner Android i la fitxa d'instruccions iOS (estètica actual: vermell de capçalera, cantonades arrodonides). Validar el disseny abans de codificar.
  - [x] 3.2 Crear `src/hooks/useInstallPrompt.ts`: capturar `beforeinstallprompt` (amb `preventDefault`), guardar l'event i exposar `canInstall` + `promptInstall()`; netejar en `appinstalled`.
  - [x] 3.3 Afegir detecció de plataforma iOS Safari (sense `beforeinstallprompt`) per decidir banner vs. fitxa d'instruccions.
  - [x] 3.4 Crear `src/components/InstallBanner.tsx`: a Android, botó "Instal·la l'app" que crida `promptInstall()`; a iOS, fitxa amb el flux "Compartir → Afegir a pantalla d'inici" (reaprofitar el patró `dir-sheet`/backdrop).
  - [x] 3.5 Persistir el descartament a localStorage (clau `tmb-install-dismissed-v1`); no mostrar la invitació si està descartada, si ja s'executa en standalone o si l'app ja està instal·lada.
  - [x] 3.6 Muntar `<InstallBanner />` a `src/App.tsx` (no intrusiu, descartable).
  - [x] 3.7 Tests: `useInstallPrompt.test.ts` (captura/neteja de l'event) i `InstallBanner.test.tsx` (Android vs iOS, ocult quan descartat/standalone).

- [ ] 4.0 Vista d'arrencada en mode instal·lat (detectar standalone → arrencar a ★ Favorits si n'hi ha, si no "Aprop meu")
  - [x] 4.1 Ampliar `src/hooks/useDisplayMode.ts` amb detecció standalone: `matchMedia('(display-mode: standalone)')` + `navigator.standalone` (iOS).
  - [x] 4.2 Llegir el nombre de favorits des de `stores/favorits.ts` per decidir la vista inicial.
  - [x] 4.3 A `src/App.tsx`, fixar el mode inicial: si standalone **i** té favorits → `Favorits`; altrament mantenir `Aprop meu`. Afecta només l'arrencada, no la navegació posterior.
  - [ ] 4.4 Verificar que al navegador normal (no instal·lat) el comportament d'arrencada no canvia (cap regressió). _(prova manual)_

- [ ] 5.0 Verificació i tancament (Lighthouse PWA, prova manual install/offline en dispositiu, lint/test/build, PR)
  - [x] 5.1 `npm run lint`, `npx vitest run` (40 verds) i `npm run build` sense errors.
  - [ ] 5.2 Auditoria Lighthouse PWA: instal·labilitat, manifest, SW, standalone. _(requereix lloc desplegat/HTTPS)_
  - [ ] 5.3 Prova manual en dispositiu real: instal·lar i obrir en standalone a Android/Chrome i a iOS Safari; obrir instal·lada amb favorits → arrenca a ★ Favorits. _(prova en dispositiu)_
  - [x] 5.4 Actualitzar `CLAUDE.md`: afegir la clau de persistència `tmb-install-dismissed-v1` i la PWA a la llista de "Features ja fetes".
  - [ ] 5.5 Commit final i obrir PR cap a `main` amb resum + test plan manual (o merge segons workflow).

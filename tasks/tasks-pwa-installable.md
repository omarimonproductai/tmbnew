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

- [ ] 0.0 Create feature branch
- [ ] 1.0 Configurar tooling PWA, manifest i icones (vite-plugin-pwa, meta tags iOS, icones placeholder)
- [ ] 2.0 Service worker i comportament offline (precache del shell, dades cachejades offline, temps real "no disponible offline")
- [ ] 3.0 UX d'invitació a instal·lar (mockup → banner Android amb `beforeinstallprompt` + fitxa d'instruccions iOS + persistència del descartament)
- [ ] 4.0 Vista d'arrencada en mode instal·lat (detectar standalone → arrencar a ★ Favorits si n'hi ha, si no "Aprop meu")
- [ ] 5.0 Verificació i tancament (Lighthouse PWA, prova manual install/offline en dispositiu, lint/test/build, PR)

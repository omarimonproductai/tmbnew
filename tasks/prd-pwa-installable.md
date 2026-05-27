# PRD — PWA installable ("Tu et Mous Bé")

## 1. Introduction/Overview

Avui l'app és un lloc web que s'obre al navegador. Per fer el salt de **visor puntual** a
**eina de rutina diària** (tesi del roadmap a `HANDOVER.md`), el primer pas és convertir-la en una
**PWA installable**: l'usuari l'afegeix a la pantalla d'inici, l'obre a pantalla completa (sense
barra del navegador) i la troba com una app més del telèfon. A més, en obrir-la instal·lada anirà
directament als seus **★ Favorits**, reforçant l'hàbit.

Aquesta feature es manté a **cost zero** (Cloudflare free): tot passa al client, sense backend nou.

## 2. Goals

1. L'app compleix els criteris d'instal·labilitat (manifest vàlid + service worker + servida per
   HTTPS) i el navegador ofereix "afegir a pantalla d'inici".
2. Oberta instal·lada, s'executa en mode **standalone** (fullscreen, sense barra d'URL).
3. Oferir una invitació pròpia a instal·lar (banner/botó) a Android/Chrome i **instruccions
   visuals per a iOS Safari**, que no té prompt natiu.
4. Funcionament bàsic **offline**: l'app obre, mostra el mapa base i les últimes parades/favorits
   guardats; el temps real es marca clarament com a no disponible sense connexió.
5. En obrir instal·lada, arrencar a **★ Favorits** si l'usuari en té; si no, a "Aprop meu".
6. No degradar el rendiment ni l'experiència actual al navegador normal.

## 3. User Stories

- Com a usuari habitual, vull **afegir l'app a la pantalla d'inici** i obrir-la d'un toc, com
  qualsevol app, sense escriure la URL.
- Com a usuari d'iPhone, vull **saber com instal·lar-la** (Safari no mostra cap botó automàtic),
  amb instruccions clares dins l'app.
- Com a usuari que obre l'app instal·lada, vull veure **els meus favorits de seguida**, perquè és
  el que consulto cada dia.
- Com a usuari amb mala cobertura al metro, vull que l'app **obri igualment** i em mostri l'última
  informació guardada en comptes d'una pantalla en blanc.

## 4. Functional Requirements

### Manifest i instal·labilitat
1. El sistema ha d'incloure un **Web App Manifest** amb: `name` ("Tu et Mous Bé"), `short_name`
   ("TuetMousBé" o similar curt), `start_url`, `display: "standalone"`, `theme_color` (vermell de
   capçalera, p. ex. `#c8001e`), `background_color` i el joc d'icones.
2. El manifest ha de referenciar icones de **192×192** i **512×512** px, incloent-hi una variant
   **maskable**.
3. L'app ha de registrar un **service worker** que permeti la instal·lació i el funcionament
   offline bàsic.
4. La capçalera HTML ha d'incloure els `meta`/`link` necessaris per a iOS (p. ex.
   `apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`).

### Invitació a instal·lar (UX)
5. A Android/Chrome, el sistema ha de capturar l'esdeveniment `beforeinstallprompt` i mostrar un
   **banner/botó propi "Instal·la l'app"**; en prémer-lo, dispara el prompt natiu.
6. A iOS Safari (sense `beforeinstallprompt`), el sistema ha de mostrar una **fitxa d'instruccions**
   il·lustrant el flux "Compartir → Afegir a pantalla d'inici".
7. La invitació **no ha de ser intrusiva**: es pot descartar, i un cop descartada o un cop l'app ja
   està instal·lada (mode standalone) **no ha de tornar a aparèixer** (persistir l'estat a
   localStorage).

### Comportament offline
8. En obrir l'app sense connexió, el **shell** (HTML/CSS/JS, mapa base Leaflet) ha de carregar des
   de la cache del service worker.
9. Les parades i favorits ja guardats a localStorage (`tmb-parades-all-v1`, `tmb-fav-*`) s'han de
   mostrar igualment offline.
10. Les dades de **temps real** que requereixen xarxa han de mostrar un estat clar de "no
    disponible offline" (reutilitzant el patró de Toast/estat ja existent), sense bloquejar la UI.
11. Quan torni la connexió, l'app ha de poder tornar a obtenir dades en viu amb normalitat.

### Vista d'arrencada
12. Quan l'app s'executi en **mode standalone** (instal·lada) i l'usuari tingui **almenys un
    favorit**, ha d'arrencar al mode **★ Favorits**.
13. Si no hi ha favorits (o no s'executa en standalone), s'ha de mantenir el comportament actual
    (arrencar a "Aprop meu").

## 5. Non-Goals (Out of Scope)

- **Notificacions push** ("surt ara"): requereix Web Push + backend amb estat → fase posterior.
- **Cache offline dels tiles del mapa**: massa cost en espai/complexitat per ara.
- **Sincronització en segon pla** (Background Sync) de dades de temps real.
- Qualsevol canvi al backend o a les Pages Functions.
- Botó d'instal·lació per a navegadors d'escriptori (es pot afegir si surt de franc, però no és
  objectiu).

## 6. Design Considerations

- La invitació a instal·lar ha de seguir l'estètica actual (vermell de capçalera, cantonades
  arrodonides, to mòbil). Convé un **mockup HTML** del banner Android i de la fitxa d'instruccions
  iOS abans d'implementar (convenció del repo per a UI nova).
- Icones: **es generaran placeholders** a partir del badge/logo "TMB" actual perquè l'app sigui
  instal·lable des del primer dia; el poliment gràfic queda per a una iteració posterior.
- La fitxa d'iOS pot reutilitzar el patró d'action sheet / backdrop ja existent
  (`DirectionsButton` / `dir-sheet`).

## 7. Technical Considerations

- **Eina del service worker:** `vite-plugin-pwa` (Workbox), integrat amb el build de Vite. Genera
  manifest + SW amb **precache** de l'app shell automàticament i poc codi a mà.
- Estratègia de cache suggerida: **precache** dels assets del build; **runtime cache** per als
  tiles de CARTO amb límit (opcional i conservador, sense pretendre offline complet del mapa).
- Cal vigilar la **invalidació de cache** entre deploys (Workbox ho gestiona amb revisions; provar
  que un nou deploy actualitza el SW i no deixa l'usuari amb una versió antiga enganxada).
- Detecció de standalone: `window.matchMedia('(display-mode: standalone)')` (i
  `navigator.standalone` per a iOS) per a la regla de la vista d'arrencada (req. 12).
- Detecció d'estat de connexió: `navigator.onLine` + esdeveniments `online`/`offline`.
- Mantenir el comportament actual al navegador no instal·lat (cap regressió).

## 8. Success Metrics

- L'auditoria **Lighthouse PWA** passa els checks d'instal·labilitat (manifest, SW, HTTPS,
  standalone).
- Es pot **instal·lar i obrir** l'app en standalone a Android/Chrome i a iOS Safari (prova manual
  en dispositiu real).
- Amb el mode avió activat, l'app **obre** i mostra parades/favorits guardats sense pantalla en
  blanc; el temps real indica "no disponible offline".
- Oberta instal·lada amb favorits, arrenca a **★ Favorits**.
- (Indicador d'impacte a mitjà termini) Augment d'usuaris recurrents / sessions des de la icona
  instal·lada.

## 9. Open Questions

1. `short_name` definitiu i `theme_color` exacte (confirmar el vermell de marca).
2. Volem un **runtime cache conservador dels tiles** del mapa (millora l'obertura offline) o ho
   deixem totalment fora per simplicitat?
3. ~~Quant de temps esperem abans de tornar a mostrar la invitació a instal·lar si l'usuari l'ha
   descartada?~~ → Resolt: reapareix **un cop al dia** (TTL de 24 h sobre el timestamp de descartament).
4. Les icones placeholder: partim del quadrat "TMB" de la capçalera o d'algun altre asset?

# PRD: Favorits (línies i parades guardades)

## 1. Introduction / Overview

tmbnew és avui un **visor** de transport: l'usuari cerca una línia o mira "aprop meu" de manera puntual. Aquesta feature afegeix **favorits** — guardar línies i parades amb una estrella — i una **vista pròpia** que les recull amb temps real, perquè el commuter obri l'app i vegi "el meu transport" sense buscar.

És la primera aposta de **retenció / hàbit** del roadmap de producte: converteix la visita ocasional en rutina diària, amb cost zero d'infraestructura (tot a `localStorage`).

**Goal**: que un usuari pugui marcar les seves línies i parades habituals i, en un sol toc, veure-les amb les properes arribades en temps real.

## 2. Goals

1. Marcar/desmarcar una **línia** com a favorita des de la llista de línies.
2. Marcar/desmarcar una **parada** com a favorita des del seu popup (mapa Línies i mapa Aprop meu).
3. Una **vista Favorits** pròpia (3r mode al header, icona ★) que mostra:
   - Parades guardades amb arribades en temps real **inline**.
   - Línies guardades com a accés ràpid.
4. **Persistència** a `localStorage`, sense backend.
5. Estat compartit i sincronitzat entre tots els punts on apareix l'estrella.

## 3. Non-Goals

- **No** sincronització entre dispositius (requeriria compte/backend).
- **No** notificacions push (fase posterior).
- **No** reordenació manual de favorits (l'ordre és per proximitat / ordre d'afegit).
- **No** límit dur de favorits en aquesta versió (recomanació suau, no bloqueig).

## 4. User Stories

- **Com a commuter**, marco la parada del meu carrer i la línia que agafo cada matí; obro la vista ★ i veig quan passa el proper bus sense cap cerca.
- **Com a usuari**, navegant pel mapa trobo una parada útil, premo l'estrella i queda guardada per després.
- **Com a usuari**, vull treure un favorit que ja no faig servir tan fàcil com el vaig afegir.

## 5. Functional Requirements

### Navegació
1. El header passa a tenir 3 modes: **Línies**, **Aprop meu**, **★** (icona estrella, sense text per estalviar espai al mòbil).
2. En seleccionar ★ es mostra la **FavoritsView**.

### Marcar favorits
3. A cada fila de la llista de línies hi ha una **estrella** (☆ buida / ★ daurada plena) que fa toggle.
4. Al **popup de parada** (tant a Línies com a Aprop meu) hi ha la mateixa estrella.
5. En marcar/desmarcar, el canvi es reflecteix **immediatament** a tots els llocs (estat compartit).

### Vista Favorits
6. Secció "★ Parades guardades": cada parada mostra nom, tipus, i les properes arribades en temps real agrupades (reaprofitant `useTempsReal` + `groupArrivalsByDestination`).
7. Secció "★ Línies guardades": chips o files amb badge + nom; en clicar, obre la línia al mode Línies.
8. Ordre de parades: per **proximitat** si hi ha geolocalització, sinó per ordre d'afegit.
9. **Estat buit**: si no hi ha cap favorit, missatge explicatiu ("Marca línies i parades amb ★ per tenir-les aquí").

### Persistència
10. Claus `localStorage`: `tmb-fav-linies` i `tmb-fav-parades`.
11. Es guarda la informació mínima per renderitzar sense re-fetch: línia (`id, codi, nom, tipus, color`), parada (`id, codi, nom, lat, lng, tipus, liniesQueParen`).
12. Lectura tolerant a errors (private mode / JSON corrupte → llista buida).

## 6. Design Considerations

- **Estrella daurada** (#f7a700) com a affordance universal de "guardat".
- La vista Favorits **reaprofita** els components de temps real existents (no en crea de nous per a les arribades).
- Estat compartit via un **store extern** (mòdul singleton + `useSyncExternalStore`) per evitar prop-drilling i mantenir sincronia entre estrelles disperses.
- Mockups: `mockup-favorits.html` (interacció) i `mockup-favorits-placement.html` (decisió de navegació → opció B, mode propi).

## 7. Technical Notes

- `src/stores/favorits.ts`: estat + persistència + `subscribe/getSnapshot`.
- `src/hooks/useFavorits.ts`: wrapper amb `useSyncExternalStore`, exposa `{ favLinies, favParades, toggleLinia, toggleParada, isLiniaFav, isParadaFav }`.
- `src/components/FavStar.tsx`: botó estrella reutilitzable.
- `AppMode` amplia a `'favorits'`.

## 8. Success Metrics (per a quan hi hagi analytics)

- % d'usuaris que tenen ≥1 favorit.
- Freqüència d'obertura de la vista Favorits.
- Retorn a 7 dies dels usuaris amb favorits vs sense.

## 9. Open Questions

1. Límit suau de parades favorites (cada una = 1 crida de temps real). Proposta: sense bloqueig, però documentar-ho.
2. Animació en marcar (pulse de l'estrella)? Nice-to-have.

# Task List — Integració FGC

> Basat en `tasks/prd-fgc.md`. Workflow: branca per parent task; sub-tasques comparteixen
> branca; `npm run lint && npm test && npm run build` abans de cada push.
>
> **Ja fet abans d'aquest pla** (a `main`): `FgcLogo` (isotip monocrom `currentColor`),
> mode `fgc` al `ModeToggle` i placeholder "FGC · properament" a `App.tsx`; PRD amb
> endpoints FGC verificats.

## Tasks

- [ ] 0.0 Crear la branca de feature
- [ ] 1.0 Backend i dades estàtiques FGC (ingesta GTFS, filtre "connexió Barcelona", pre-bake JSON, endpoints estàtics)
- [ ] 2.0 Model multi-operador i favorits (camp `operator`, parades/línies FGC al store, ★ barrejat)
- [ ] 3.0 Mode FGC complet al header (mirall de Línies: llista + mapa + cerca + ordenació + recorregut + marcador; substituir el placeholder)
- [ ] 4.0 Integració d'FGC a "Aprop meu" (llista unificada + mapa + filtre FGC + comptadors)
- [ ] 5.0 Temps real FGC (backend RT + arribades al popup/llista + posicions de vehicles al mapa + refresc/visibilitat)
- [ ] 6.0 Mockups, tests, verificació del feed en producció i desplegament
</content>

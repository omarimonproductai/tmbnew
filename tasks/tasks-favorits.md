# Tasks: Favorits (línies i parades guardades)

PRD: `tasks/prd-favorits.md`
Mockups: `mockup-favorits.html`, `mockup-favorits-placement.html` (opció B)

## Relevant Files

- `src/types/tmb.ts` - Tipus `FavLinia` i `FavParada`.
- `src/stores/favorits.ts` - Store extern (singleton) amb persistència a localStorage + subscribe/getSnapshot.
- `src/hooks/useFavorits.ts` - Wrapper amb `useSyncExternalStore`.
- `src/components/FavStar.tsx` - Botó estrella reutilitzable (toggle).
- `src/components/ModeToggle.tsx` - Afegir mode `'favorits'` (icona ★).
- `src/App.tsx` - Renderitzar `FavoritsView` quan el mode és favorits.
- `src/components/FavoritsView.tsx` - La pantalla de favorits (parades + línies).
- `src/components/LineList.tsx` - Estrella a cada fila.
- `src/components/StopPopup.tsx` - Estrella al popup (vista Línies).
- `src/components/AproperMeuStopPopup.tsx` - Estrella al popup (Aprop meu).
- `src/App.css` - Estils de l'estrella, vista favorits, estat buit.

### Notes
- Tot a localStorage, sense backend.
- La vista favorits reaprofita `useTempsReal` + `groupArrivalsByDestination`.
- Estat compartit via store extern perquè les estrelles disperses se sincronitzin.

## Instructions for Completing Tasks
**IMPORTANT:** Marca cada subtasca canviant `- [ ]` per `- [x]` a mesura que avances.

---

## Tasks

### 1.0 Model de dades i store
- [x] 1.1 Afegir `FavLinia` i `FavParada` a `types/tmb.ts`.
- [x] 1.2 Crear `stores/favorits.ts`: estat inicial des de localStorage, `subscribe`, `getLiniesSnapshot`, `getParadesSnapshot`, `toggleLinia`, `toggleParada`, `isLiniaFav`, `isParadaFav`, persistència + emit.
- [x] 1.3 Crear `hooks/useFavorits.ts` amb `useSyncExternalStore`.

### 2.0 Component estrella
- [x] 2.1 Crear `FavStar.tsx`: rep `active` + `onToggle`, renderitza ☆/★, `stopPropagation`.
- [x] 2.2 Estils `.fav-star` / `.fav-star.on` (daurat) + scale en activar.

### 3.0 Integrar estrella als punts de marcatge
- [x] 3.1 `LineList.tsx`: estrella a cada fila lligada a `isLiniaFav` / `toggleLinia` (wrapper `.line-row` per no niar botons).
- [x] 3.2 `StopPopup.tsx`: estrella al header del popup (vista Línies).
- [x] 3.3 `AproperMeuStopPopup.tsx`: estrella al popup (Aprop meu).

### 4.0 Mode i vista Favorits
- [x] 4.1 `ModeToggle.tsx`: afegir mode `'favorits'` amb icona ★ (sense text).
- [x] 4.2 `App.tsx`: renderitzar `FavoritsView` per al mode favorits.
- [x] 4.3 Crear `FavoritsView.tsx`: secció parades (temps real inline) + secció línies (accés ràpid) + estat buit.
- [x] 4.4 Ordenar parades per proximitat (geolocalització) amb fallback a ordre d'afegit.
- [x] 4.5 En clicar una línia guardada, obrir-la al mode Línies (callback `onOpenLine` → `requestedLineId` a `LiniesView`).

### 5.0 Estils
- [x] 5.1 Estils de la vista favorits (seccions, capçaleres, files).
- [x] 5.2 Estat buit.

### 6.0 Verificació
- [x] 6.1 `npm run lint` net.
- [x] 6.2 `npm test` passa (33).
- [x] 6.3 `npm run build` ok.
- [ ] 6.4 Commit + push a main.

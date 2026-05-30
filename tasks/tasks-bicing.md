# Tasks: Integració de Bicing (GBFS)

> Basat en `tasks/prd-bicing.md`. Convenció: una branca per parent task (veure CLAUDE.md §5);
> verificar `lint + build + test` abans de cada push; PR + squash-merge a `main`.

## Tasks

- [ ] 0.0 Create feature branch
- [ ] 1.0 Backend + capa de dades: proxy GBFS, normalització, tipus, servei i hook (refresc 60s + cache)
- [ ] 2.0 Mockup HTML: xips compactes elèctric/mecànic, marcador d'estació diferenciat i popup de detalls (abans de construir UI)
- [ ] 3.0 Component compartit de capa Bicing: marcadors + popup amb detalls d'estació (reutilitzable per Aprop meu i mode Bicing)
- [ ] 4.0 Integració a "Aprop meu": capa al mapa per radi + secció pròpia a la llista + xips elèctric/mecànic (filtre per disponibilitat, desmarcables)
- [ ] 5.0 Mode "Bicing" nou: header/ModeToggle + routing a App + mapa complet d'estacions + filtres elèctriques/mecàniques
- [ ] 6.0 Favorits d'estacions: store + useFavorits + estrella daurada als marcadors + integració al mode ★ (barrejat amb parades) i FavMap

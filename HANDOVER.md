# HANDOVER — "Tu et Mous Bé": visió de producte i roadmap

> Context **tècnic** (stack, restriccions, features fetes, dev local): veure [`CLAUDE.md`](./CLAUDE.md).
> Aquest document és la **visió de producte** i el **roadmap**: què construir després i per què.

Ets enginyer i alhora director de producte d'aquesta app. Continua'n l'evolució mantenint
qualitat tècnica i pensant en impacte de producte.

## Tesi central
L'app és avui un **visor** (consulta puntual). El salt d'impacte és convertir-la en **eina de
rutina diària**. Filosofia de recursos: **mantenir-se a cost zero (Cloudflare free)** fins que una
mètrica justifiqui pagar; no muntar infra cara abans de tenir usuaris.

## Estat actual (els 2 primers quick wins del roadmap, fets)
- ✅ **PWA installable**: manifest + service worker (Workbox via `vite-plugin-pwa`), banner d'instal·lació Android amb `beforeinstallprompt`, fitxa d'instruccions per a iOS Safari, avís d'offline, icones de marca pròpies (incl. favicon), arrenca a ★ Favorits si s'obre instal·lada amb favorits. Reapareix la invitació un cop al dia després de descartar-la.
- ✅ **Compartir parada per enllaç**: botó ⬆ Comparteix al popup i a la llista d'Aprop meu (`navigator.share`/copiar); enllaç `?parada=<id>` que en obrir-lo centra el mapa d'Aprop meu a la parada i obre el seu popup amb totes les línies i temps real, injectant el marcador encara que sigui fora del radi/filtre. Sense modal fosc.

A part, en aquesta sessió també s'han fet pulits d'UX a "Aprop meu" (filtre Tots/Metro/Bus, guinyo del marcador en triar parada, slider de radi 100–1500 m amb default 300 m, sheet obert per defecte, zoom inicial més proper, refresc real-time de la posició cada 10s sense parpelleig), i bug fixes de mapa (franja grisa per `invalidateSize`, popup tapat per la capçalera, refresh de Línies que resetejava el zoom, control de rotació que se solapava).

## Els 4 objectius i les seves apostes

### 1. RETENCIÓ / hàbit (prioritari)
- ✅ Favorits.
- ✅ PWA installable.
- Aposta gran pendent: **notificacions push "surt ara"** (cal Web Push + backend amb estat → trenca el cost zero).

### 2. CREIXEMENT / abast
- ✅ Compartir parada per enllaç (loop víric WhatsApp).
- Quick win pendent: **alertes de servei / incidències** (TMB publica afectacions; valor alt, esforç mitjà).
- Aposta gran pendent: **SEO** amb pàgines per línia/parada indexables.

### 3. MONETITZAR
- Encara prematur sense base d'usuaris. Aposta futura B2B: **widget white-label** per a hotels/comerços ("com arribar fins aquí"). NO ads.

### 4. PORTFOLI / demo
- Quick win pendent: visualització "viva" (vehicles animats més polits, mode fosc, transicions).
- Aposta gran: integració d'**FGC** com a segon operador (vegeu sota).

## Recomanació d'evolució (què toca ara)

1. **Alertes de servei / incidències** *(següent natural)*. TMB publica afectacions a la seva API; cost zero, valor alt per l'usuari diari. Encaixa amb la tesi d'hàbit (l'app et "salva el dia" quan hi ha un tall).
2. **Mode fosc + petits pulits visuals**. Quick win de portfoli + accessibilitat.
3. **FGC com a segon operador**. Discutit en aquesta sessió: viable i a cost zero (FGC publica GTFS + GTFS-RT), però **no és un quick win** — cal refactor multi-operador (~30 fitxers acoblats a TMB) i una segona via d'ingesta (parsejar GTFS + descodificar Protobuf de GTFS-RT). Aporta valor real (commuter rail Vallès/Llobregat + trams urbans). Bona feina per a una iteració dedicada.
4. **Notificacions push** o **B2B**: només si la retenció validada justifica trencar el cost zero o tens un primer client B2B.

## El que NO fer encara
- **Planificador de rutes A→B**: o és caríssim (routing propi) o depèn d'un tercer; millor seguir delegant a Apple/Google Maps amb el botó "Com arribar-hi" que ja existeix.
- **Infra de pagament** abans de validar retenció.
- **Cache offline dels tiles del mapa**: més complexitat que valor per ara (open question del PRD PWA — quedem-ho off).

## Com treballar la propera feature
Si l'usuari tria una feature gran, segueix el workflow: proposa, fes mockup HTML si és UI, crea PRD
+ task list a `tasks/` (skills `/create-prd` i `/generate-tasks`), implementa, verifica
(lint/test/build), commit. Pensa sempre en impacte vs cost i en mantenir el free tier.

Convenció recent: tots els PRs s'estan fusionant a `main` automàticament (Cloudflare Pages desplega
a producció en fer merge). Hi ha hagut **23 PRs** en aquesta sessió, tots fusionats.

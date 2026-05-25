# PRD: Llistat de Línies TMB amb Mapa de Parades

## 1. Introducció / Overview

Volem construir una pàgina web pública que consumeixi l'API gratuïta de TMB (Transports Metropolitans de Barcelona) per mostrar totes les línies de transport disponibles a la ciutat de Barcelona. L'usuari podrà filtrar les línies per tipus de transport (bus, metro, etc.), seleccionar-ne una i veure en un mapa interactiu totes les seves parades amb informació en temps real d'arribada de vehicles (si l'API de TMB ho proporciona sense cost).

**Problema que resol:** Actualment no hi ha una eina senzilla i visual que permeti explorar totes les línies de TMB i les seves parades en un mapa interactiu de forma gratuïta.

---

## 2. Objectius

1. Mostrar el llistat complet de línies de TMB agrupades i filtrades per tipus de transport.
2. Permetre seleccionar una línia i visualitzar totes les seves parades en un mapa interactiu.
3. Mostrar informació en temps real d'arribada de vehicles a cada parada (condicionat a disponibilitat gratuïta de l'API).
4. Oferir una experiència d'usuari clara i ràpida, en català.
5. Fer servir exclusivament serveis gratuïts (API TMB, Leaflet + OpenStreetMap, React + Vite, allotjament gratuït).

---

## 3. User Stories

- **Com a usuari**, vull veure totes les línies de transport de Barcelona en una llista, per saber quines opcions tenc disponibles.
- **Com a usuari**, vull filtrar les línies per tipus de transport (bus, metro, tramvia, FGC, Rodalies...), per trobar ràpidament el que busco.
- **Com a usuari**, vull clicar una línia i veure les seves parades en un mapa, per entendre el recorregut visualment.
- **Com a usuari**, vull veure el temps d'arribada del pròxim vehicle a cada parada (si és disponible), per planificar millor el meu viatge.
- **Com a usuari**, vull que tot estigui en català, per sentir-me còmode amb la interfície.

---

## 4. Requisits Funcionals

1. L'aplicació ha de connectar-se a l'API de TMB i obtenir el llistat de totes les línies disponibles.
2. El llistat de línies ha de mostrar: identificador de la línia, nom, tipus de transport i color identificatiu (si l'API el proporciona).
3. L'usuari ha de poder filtrar les línies per tipus de transport mitjançant botons o pestanyes (ex: Bus, Metro, Tramvia, FGC, Rodalies).
4. En seleccionar una línia, l'aplicació ha de mostrar un mapa interactiu (Leaflet + OpenStreetMap) centrat en el recorregut de la línia.
5. El mapa ha de mostrar un marcador per a cada parada de la línia seleccionada.
6. En clicar un marcador de parada, s'ha de mostrar un popup amb el nom de la parada i, si l'API ho permet gratuïtament, el temps d'arribada del pròxim vehicle.
7. El mapa ha de traçar el recorregut de la línia entre parades (polilínia) si les dades de l'API ho permeten.
8. La interfície ha d'estar íntegrament en català.
9. L'aplicació ha de ser responsive (funcionar correctament en mòbil i escriptori).
10. Tots els serveis utilitzats han de ser gratuïts (API TMB, Leaflet/OSM, allotjament).

---

## 5. Non-Goals (Fora d'Abast)

- No es construirà un planificador de rutes entre punts d'origen i destinació.
- No es mostrarà informació d'incidències o alertes de servei.
- No hi haurà autenticació ni comptes d'usuari.
- No es guardarà cap dada de l'usuari ni historial de cerca.
- No es suportarà cap idioma més enllà del català en la primera versió.
- No s'integrarà cap servei de pagament ni API de cost.

---

## 6. Consideracions de Disseny

- **Layout:** Panell lateral esquerre amb el llistat i filtres de línies. Panell dret amb el mapa (tipus split-view).
- **Mòbil:** El panell lateral passa a ser un drawer o pestanya inferior; el mapa ocupa tota la pantalla.
- **Colors:** Cada línia mostra el seu color identificatiu (ex: L1 de metro en vermell, L2 en lila...) si l'API els retorna.
- **Mapa:** Leaflet amb tiles d'OpenStreetMap. Marcadors de parada amb el color de la línia seleccionada.
- **Tipografia i estil:** Senzill i net, sense llibreries de components externes pesades (es pot usar Tailwind CSS, que és gratuït).

---

## 7. Consideracions Tècniques

- **Frontend:** React + Vite (TypeScript recomanat).
- **Mapes:** Leaflet.js + `react-leaflet` + tiles OpenStreetMap (gratuït, sense API key).
- **API TMB:** Requereix registre gratuït a [developer.tmb.cat](https://developer.tmb.cat) per obtenir `app_id` i `app_key`. Cal verificar quins endpoints són gratuïts:
  - `GET /v1/transit/linies` — llistat de línies.
  - `GET /v1/transit/linies/{id}/parades` — parades d'una línia.
  - `GET /v1/ibus/lines/{line}/stops/{stop}` — temps real d'arribada (verificar si és gratuït).
- **Allotjament:** GitHub Pages o Netlify (pla gratuït), ja que és una app estàtica.
- **Variables d'entorn:** Les credencials de l'API de TMB s'han de gestionar com a variables d'entorn (`.env`) i no commitejar-les mai al repositori.
- **CORS:** Verificar si l'API de TMB permet crides directes des del navegador o si cal un proxy lleuger.

---

## 8. Mètriques d'Èxit

- L'usuari pot veure el llistat complet de línies en menys de 2 segons des de la càrrega inicial.
- En seleccionar una línia, el mapa amb les parades es mostra en menys de 2 segons.
- El filtre per tipus de transport funciona correctament per a tots els tipus disponibles a l'API.
- L'aplicació funciona correctament en Chrome, Firefox i Safari (escriptori i mòbil).
- Zero cost d'infraestructura i APIs.

---

## 9. Preguntes Obertes

1. **CORS de l'API TMB:** Cal verificar si l'API permet crides directes des del navegador (client-side) o si caldrà un petit servidor proxy (ex: Netlify Functions, que té pla gratuït).
2. **Temps real gratuït:** Cal confirmar durant el desenvolupament si l'endpoint de temps real d'iBus és accessible amb les credencials gratuïtes de TMB.
3. **Cobertura de l'API:** Quins tipus de transport cobreix realment l'API de TMB? (Metro, Bus, Tramvia... però FGC i Rodalies poden tenir APIs pròpies separades.)
4. **Dades de recorregut (shapes):** L'API de TMB proporciona les coordenades del traçat de la línia (per dibuixar la polilínia al mapa) o només les coordenades de les parades?

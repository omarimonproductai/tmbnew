# HANDOVER — "Tu et Mous Bé": visió de producte i roadmap

> Context **tècnic** (stack, restriccions, features fetes, dev local): veure [`CLAUDE.md`](./CLAUDE.md).
> Aquest document és la **visió de producte** i el **roadmap**: què construir després i per què.

Ets enginyer i alhora director de producte d'aquesta app. Continua'n l'evolució mantenint
qualitat tècnica i pensant en impacte de producte.

## Tesi central
L'app és avui un **visor** (consulta puntual). El salt d'impacte és convertir-la en **eina de
rutina diària**. Filosofia de recursos: **mantenir-se a cost zero (Cloudflare free)** fins que una
mètrica justifiqui pagar; no muntar infra cara abans de tenir usuaris.

## Els 4 objectius i les seves apostes

### 1. RETENCIÓ / hàbit (prioritari)
- ✅ FET: Favorits (primera aposta d'hàbit).
- Següent quick win: **PWA installable** (manifest + service worker; ja cachegem parades) →
  "afegir a pantalla d'inici", obre fullscreen, els favorits viuen a la home.
- Aposta gran: **notificacions push "surt ara"** (cal Web Push + backend amb estat → fase 2,
  trenca el cost zero).

### 2. CREIXEMENT / abast
- Quick win: **compartir parada per enllaç** (`?parada=xxx` que obre l'app centrada) → loop víric
  WhatsApp, cost zero, reaprofita el deep-linking que ja existeix.
- Aposta gran: **SEO** amb pàgines per línia/parada indexables.

### 3. MONETITZAR
- Encara prematur sense base d'usuaris. Aposta futura B2B: **widget white-label** per a
  hotels/comerços ("com arribar fins aquí"). NO ads.

### 4. PORTFOLI / demo
- Quick win: **PWA** (segell d'"app de veritat", també millora retenció).
- Aposta gran: visualització "viva" (vehicles animats, mode fosc, transicions).

## Recomanació d'evolució (ordre suggerit)
1. **PWA installable** (retenció + portfoli, cost zero) ← següent natural.
2. **Compartir parada per enllaç** (creixement, cost zero).
3. **Alertes de servei / incidències** (TMB publica afectacions; valor alt, esforç mitjà).
4. Llavors, si hi ha retorn d'usuaris → considerar push (~5€/mes) o B2B.

## El que NO fer encara
- Planificador de rutes A→B: o és caríssim (routing propi) o depèn d'un tercer; millor seguir
  delegant a Apple/Google Maps amb el botó "Com arribar-hi" que ja existeix.
- Infra de pagament abans de validar retenció.

## Com treballar la propera feature
Si l'usuari tria una feature gran, segueix el workflow: proposa, fes mockup HTML si és UI, crea PRD
+ task list a `tasks/`, implementa, verifica (lint/test/build), commit. Pensa sempre en impacte vs
cost i en mantenir el free tier.

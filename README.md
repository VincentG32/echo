# Pulse

> **Outil interne de centralisation et priorisation du feedback produit.**
> Vos collègues proposent (bugs, idées, améliorations), votent — vous priorisez sur des données, plus à l'instinct.

🌐 **Live** → [pulse-one-brown.vercel.app](https://pulse-one-brown.vercel.app)
📦 **Repo** → [github.com/VincentG32/pulse](https://github.com/VincentG32/pulse)

Stack : **Next.js 16** (App Router) · **TypeScript** · **Tailwind v4** · **Airtable** · **n8n** · **Qdrant** · **Claude (Anthropic)** · **Auth JWT custom** · **Vercel**

---

## Sommaire
1. [Pourquoi Pulse](#pourquoi-pulse)
2. [Fonctionnalités livrées](#fonctionnalités-livrées)
3. [Stack & justifications](#stack--justifications)
4. [Architecture](#architecture)
5. [Modèle de sécurité](#modèle-de-sécurité)
6. [Accessibilité](#accessibilité)
7. [Setup local](#setup-local)
8. [Schéma Airtable](#schéma-airtable)
9. [Automatisations Airtable](#automatisations-airtable)
10. [Automatisations n8n](#automatisations-n8n)
11. [Structure du code](#structure-du-code)
12. [Décisions techniques (mini-ADRs)](#décisions-techniques-mini-adrs)
13. [Roadmap V2 / V3](#roadmap-v2--v3)
14. [Limitations connues](#limitations-connues)
15. [Crédits](#crédits)

---

## Pourquoi Pulse

Dans une équipe produit, le feedback utilisateur arrive de partout : Slack, Notion, mails, tickets de support… Résultat :

- Priorisation **à l'instinct** ("celui qui crie le plus fort gagne")
- Idées **dupliquées** parce que personne ne sait ce qui a déjà été soumis
- Pas de signal clair sur ce qui compte **pour les utilisateurs**, pas pour celui qui le porte

Pulse résout ça avec un périmètre volontairement minimaliste :

- **Une source unique** de feedback, structurée (titre, description, type)
- **Un vote = un user** (un utilisateur ne peut voter qu'une seule fois par feedback)
- **Tri émergent** par nombre de votes : le top, c'est ce que l'équipe attend vraiment
- **Un dashboard admin** pour modérer

Pas de plugin tiers exposé aux utilisateurs, pas d'intégration Slack. L'IA reste un outil interne (classification, agent d'aide au test, contrôle qualité), jamais une dépendance de la boucle principale de feedback/vote/priorisation.

---

## Fonctionnalités livrées

### Brief original (V1) ✅

**Authentification**
- Inscription email / mot de passe (bcrypt, 8 chars min)
- Connexion / déconnexion
- Rôle `user` attribué automatiquement à l'inscription
- Rôle `admin` configurable (manuellement dans Airtable)

**Feedbacks**
- Création (Title, Description, Type) — Creator et CreatedAt remplis automatiquement
- 3 types : 🐛 **Bug** · 💡 **Idée** · ✨ **Amélioration** (avec couleurs distinctes)
- Édition / suppression réservées au créateur
- Le bouton est masqué côté UI **et** l'API renvoie 403 si tentative cross-user

**Votes**
- Un user ne peut voter qu'une fois par feedback (anti-double-vote)
- `VoteCount` incrémenté atomiquement avec la création du Vote
- Tri descendant par votes sur la page liste

**Pages**
- `/` — landing
- `/login`, `/signup`
- `/feedbacks` — liste publique aux users connectés
- `/feedback/[id]` — détail avec actions (voter / éditer / supprimer)
- `/submit` — formulaire de création (accessible via "+ Nouveau feedback" sur `/feedbacks` ou depuis `/campagne`, plus de lien direct dans le menu — voir V7)
- `/admin` — dashboard admin (suppression universelle)

**Sécurité**
- Toutes les mutations passent par un check `getCurrentUser()` côté serveur
- Permission par ressource : 401 / 403 / 409 selon le cas
- Cookie JWT `httpOnly` + `sameSite=lax` + `secure` en prod
- Le token Airtable ne quitte jamais le serveur

### Quick wins ajoutés (V1.5) ✅

- **Landing page** dédiée sur `/` (hero, 3 cards de features, "Comment ça marche", CTA) pour accueillir les nouveaux visiteurs au lieu de les dropper dans la liste
- **Auth gate** sur `/feedbacks` et `GET /api/feedbacks` : la liste n'est plus publique (incohérent avec un outil **interne** d'équipe)
- **Filtres par type** (chips cliquables) avec compteurs par catégorie
- **Toasts** ([sonner](https://sonner.emilkowal.ski/)) sur toutes les mutations (login, signup, vote, edit, delete, logout)
- **Édition inline** sur la page détail (toggle "Modifier" → form dans la même page, pas de route `/edit` séparée)

### Évolutions livrées (V2 → V5) ✅

- **Workflow dev kanban** — table `Feedbacks.Status`, page `/dev` à 4 colonnes (à faire / en cours / review / livré), drag-drop ([dnd-kit](https://dndkit.com/)) avec boutons fallback pour clavier et mobile, confetti à la livraison (respecte `prefers-reduced-motion`)
- **Notifications in-app** — bannière sur la liste pour le créateur quand son feedback avance, badge sur les cards, dismiss persistant
- **Commentaires** — table `Comments`, fil de discussion sur la page détail, notification automatique au créateur
- **Dashboard admin tabbed** — `/admin?tab=overview` (KPIs + charts recharts + top votes + top contributeurs) et `?tab=list` (modération)
- **Auth durcie** — email verification (token 24h, gate optionnel via env), password reset (token 1h), tous via Resend (gracieusement dégradé sans clé d'API)
- **Rate limiting** — Upstash Redis sliding window sur `/api/auth/login` (5/min), `/api/auth/signup` (3/min), `/api/feedbacks/[id]/vote` (20/min)
- **Observabilité** — Sentry (erreurs prod) + Vercel Analytics (Web Vitals)
- **Dark mode** — toggle manuel persistant + détection auto `prefers-color-scheme`, tokens CSS isolés par thème via `[data-theme="dark"]`
- **Qualité** — 10 tests E2E Playwright + GitHub Actions CI (typecheck + lint + build à chaque PR), audit code interne (sécurité + architecture + performance + accessibilité) avec correctifs documentés
- **Accessibilité WCAG 2.1 AA** — audit interne passé, focus visible global, skip-link, contrast AA, `role="alert"` sur erreurs, `prefers-reduced-motion` respecté (cf. [Accessibilité](#accessibilité))

### V6 ✅

- **Criticité sur les bugs** — champ `Feedbacks.Criticality` (`bloquant` / `majeur` / `mineur`) obligatoire à la création quand `type=bug`, exposé via radio buttons avec définitions inline pour forcer un référentiel commun ("L'utilisateur peut-il quand même utiliser l'app ?"). Cf. composant [`CriticalityBadge`](src/components/CriticalityBadge.tsx).
- **Admin override criticité (2 surfaces)** — un admin peut reclasser un bug à la hausse ou à la baisse :
  - **Inline dans `/admin?tab=list`** — [`CriticalityPicker`](src/components/CriticalityPicker.tsx), popover sur le badge, 2 clics pour reclasser
  - **Page détail** — [`AdminCriticalityOverride`](src/app/feedback/[id]/AdminCriticalityOverride.tsx), 3 boutons toggle, pour les workflows "deep dive un feedback"
  - Les deux UIs partagent l'API `PATCH /api/feedbacks/[id]/criticality` (admin-only). Update optimiste + rollback si erreur.
- **Dashboard "bloquants en cours"** — sur `/admin?tab=overview` : 5e tile KPI (rouge si > 0) + liste pleine-largeur "🔴 Top bugs bloquants à traiter" triée par votes. Boucle complète tile → liste → page détail → reclasser/livrer.
- **Alerte 🚨 Bug bloquant** — automatisation Airtable qui envoie un email à l'admin dès qu'un feedback bascule en `type=bug ∧ criticality=bloquant`. Formule `BloquantSubject` côté Airtable. Déclenchée à la création OU sur override admin. Cf. [Automatisations Airtable](#automatisations-airtable).
- **Export CSV admin** — endpoint `GET /api/admin/export` (admin-only) qui stream un CSV UTF-8 (avec BOM Excel) de tous les feedbacks (ID, Title, Description, Type, Criticality, Status, VoteCount, CreatorName, AssignedToName, CreatedAt). Lien "📥 Exporter CSV" sur le dashboard admin.
- **Soft delete** — un click "Supprimer" ne détruit plus la ligne Airtable, il pose `Feedbacks.DeletedAt = nowIso()`. Tous les reads filtrent `{DeletedAt} = ''` (`listFeedbacks`, `listBacklogFeedbacks`, `getFeedbackById`). Récupération possible côté admin en vidant le champ dans Airtable.
- **a11y CI automatisé** — job `A11y · axe-core` ajouté à GitHub Actions. À chaque push/PR, axe-core scanne les 4 pages publiques (Landing, Login, Signup, Forgot password) et fail la CI sur toute violation `serious`/`critical`. Sans gate (E2E_ENABLED), car ces pages n'ont pas besoin d'Airtable de test. **A immédiatement attrapé une régression de contraste** (text-tertiary 4.33:1 sur le fond rose du test de palette).
- **Charte graphique teal** — tokens d'action passés en teal (`#0F766E` light, `#14B8A6` dark) après un détour par le rouge. Choisi pour ne clasher avec aucun des 7 badges sémantiques (bug-rouge, idée-violet, amélioration-vert, criticité bloquant/majeur/mineur). Contraste validé par axe-core sur les 4 pages publiques.

### V7 — Cahier de test, Compagnon de test & IA ✅

- **Cahier de test** — table `CahierTests` (voir [Schéma Airtable](#schéma-airtable)) + page `/campagne` : liste les scénarios de test de la campagne active (`Pulse V1`), groupés par zone, avec un badge de priorité. Chaque item a un lien "Donner un feedback sur ce test" qui pré-remplit `/submit` (titre + description) avec le code du test, le scénario et le résultat attendu.
- **Compagnon de test** — widget de chat ([`CompagnonWidget`](src/components/CompagnonWidget.tsx)), visible sur `/campagne` et `/submit` une fois connecté. Guide vers le bon scénario du cahier de test actif et détecte les doublons potentiels avant soumission (propose de voter pour un feedback existant plutôt que d'en créer un nouveau). Détail complet, modèles et garde-fous : voir [Automatisations n8n](#automatisations-n8n).
- **Pipeline de qualité** — jeu de test de 8 cas (table `JeuDeTest`, un par catégorie attendue) rejoué contre l'agent réel, noté par un juge IA sur 3 critères (table `Evaluation`). Baseline : **4.96/5** (Pertinence 4.88, Sécurité 5.00, Clarté 5.00) sur 8/8 cas sans erreur.
- **Correctif dashboard** — les graphiques de `/admin` (répartition par type, backlog par statut) ne s'affichaient plus correctement : l'animation d'entrée des barres (Recharts) ne se résolvait jamais dans certains cas. Corrigé en désactivant l'animation d'entrée sur les deux graphiques.
- **Correctif mode sombre** — la feuille de style figeait toutes les couleurs à leur valeur claire au moment de la compilation (`@theme inline` appliqué à tort aux couleurs, pas seulement aux polices), ce qui empêchait `[data-theme="dark"]` de s'appliquer sur la quasi-totalité des classes `bg-*`/`text-*`. Corrigé en séparant les couleurs dans leur propre bloc `@theme` (sans `inline`).
- **Navigation simplifiée** — suppression de l'onglet "Soumettre" du menu (trop de chemins différents pour arriver au même formulaire) ; le bouton "+ Nouveau" de `/feedbacks` est renommé "+ Nouveau feedback" pour être plus explicite.

---

## Stack & justifications

| Couche | Choix | Pourquoi ce choix |
|---|---|---|
| Framework | **Next.js 16 App Router** | Server Components pour la liste (pas de `useEffect` de fetch côté client), API routes co-localisées, déploiement Vercel en 1 clic |
| Langage | **TypeScript strict** | Sécurité de type sur la frontière auth/Airtable où les bugs sont silencieux et coûteux |
| Styling | **Tailwind CSS v4** | Tokens de design en CSS custom properties, définis dans `globals.css` (couleurs et radii dans un bloc `@theme` classique, polices dans un bloc `@theme inline` séparé — voir [ADR](#décisions-techniques-mini-adrs) sur pourquoi ce n'est pas le même bloc). Brand color = teal `#0F766E` (light) / `#14B8A6` (dark), choisi V6 pour ne clasher avec aucun des 7 badges sémantiques (bug/idée/amélioration + criticité bloquant/majeur/mineur) |
| Backend | **API Routes Next.js (Node runtime)** | Mêmes types partagés avec le front via `lib/`, pas de serveur Express à maintenir |
| Base de données | **Airtable** | Plan gratuit suffisant pour un MVP, UI native pour debug, pas de migrations SQL à gérer pendant la formation |
| Auth | **JWT custom + bcryptjs** | Pédagogique pour une formation : on voit la mécanique (hash, signature, cookie), pas masqué derrière une lib |
| Validation | **Zod** | Schémas réutilisables côté form ET côté API (single source of truth) |
| Notifications | **sonner** | Léger, accessible, 0 config |
| Hébergement | **Vercel** | Déploiement `git push` → live, free tier généreux, Preview URLs par PR |
| Automatisation & agent IA | **n8n** (VPS personnel) | Orchestration visuelle des workflows (classification, digest, agent) sans redéployer l'app à chaque ajustement de prompt ou de logique |
| Base vectorielle | **Qdrant** (self-hosted) | Recherche par similarité pour le RAG du Compagnon de test (cahier de test + détection de doublons) ; auto-hébergé pour rester propriétaire de l'infrastructure |
| Embeddings | **Cohere** (`embed-multilingual-v3.0`) | Multilingue, 1024 dimensions, bon rapport qualité/coût pour un corpus en français |
| Modèles de langage | **Claude Sonnet** (agent) + **Claude Haiku** (garde-fou, classification, juge) | Le modèle le plus capable réservé au dialogue ; un modèle rapide et économe pour les tâches courtes et répétitives — détail au [Bloc automatisations n8n](#automatisations-n8n) |

---

## Architecture

```
┌──────────────────────────────┐
│  Browser (React + Tailwind)  │
│  pages: /, /login, /signup,  │
│         /feedbacks, /submit, │
│         /feedback/[id],      │
│         /campagne, /dev,     │
│         /admin               │
└──────────┬───────────────────┘
           │ fetch + cookie JWT (httpOnly)
           ▼
┌──────────────────────────────┐
│  Next.js API routes (server) │  ← AIRTABLE_TOKEN, JWT_SECRET
│  /api/auth/{signup,login,    │     restent ici, jamais en client
│            logout}, /api/me, │
│  /api/feedbacks[/:id][...],  │
│  /api/admin/export,          │
│  /api/compagnon ─────────────┼──┐
│                               │  │ webhook (Basic Auth)
│  proxy.ts (middleware) :      │  │
│  redirige vers /login si      │  │
│  pas de cookie                │  │
└──────────┬────────────────────┘  │
           │ airtable.js SDK       │
           ▼                       ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│  Airtable base "Pro"     │◄─┤  n8n (VPS personnel)         │
│  Users · Feedbacks ·     │  │  Compagnon de test, garde-   │
│  Votes · Comments ·      │  │  fou, RAG (Qdrant), digest,  │
│  Notifications ·         │  │  classification, monitoring  │
│  CahierTests · Monitoring│  └─────────────────────────────┘
│  · JeuDeTest · Evaluation│
└───────────────────────────┘
```

**Single source de vérité pour les données** : `src/lib/airtable.ts` est un fichier barrel qui ré-exporte les modules `src/lib/airtable/{users,feedbacks,votes,notifications,comments,cahierTests}.ts`. Aucun composant React ne connaît la forme des records — ils consomment des types `UserRecord` / `FeedbackWithCreator` / `VoteRecord` propres.

**n8n ne passe jamais par `lib/airtable.ts`** : les workflows lisent/écrivent Airtable directement (credentials propres, côté n8n). L'app Next.js ne fait qu'appeler le webhook du Compagnon de test via `/api/compagnon` ; elle ne connaît rien du contenu des automatisations. Détail complet : [Automatisations n8n](#automatisations-n8n).

**Server Components par défaut, Client uniquement quand nécessaire.** Les pages liste / détail / admin sont des Server Components qui appellent directement `lib/airtable.ts` côté serveur — pas de hop fetch HTTP inutile. Seuls les composants interactifs (forms, boutons de vote) sont `"use client"`.

---

## Modèle de sécurité

Quatre couches qui se renforcent. Compromettre une seule ne suffit pas.

### 1. Le token Airtable n'atteint jamais le navigateur
- Variable d'env `AIRTABLE_TOKEN` lue **côté serveur uniquement** (`process.env`)
- Aucun préfixe `NEXT_PUBLIC_` (qui exposerait au bundle client)
- Vérification : `curl https://pulse-one-brown.vercel.app/_next/static/...` ne contient jamais `pat...`

### 2. Authentification par cookie JWT signé
- Cookie `pulse_token` :
  - `httpOnly` (impossible à lire en JS, donc immune aux XSS)
  - `secure` en prod (HTTPS uniquement)
  - `sameSite=lax` (CSRF protection raisonnable, signup depuis un lien externe fonctionne)
  - `maxAge` = 7 jours
- Signé HS256 avec `JWT_SECRET` (256 bits aléatoires via `openssl rand -base64 48`)
- Payload : `{ sub: userId, email, role }` — le rôle est dans le JWT pour éviter un fetch DB par requête en middleware

### 3. Autorisation par ressource (server-side)
Les vérifications de propriété sont **dans les API routes**, pas dans l'UI :

| Action | 401 si | 403 si | 409 si |
|---|---|---|---|
| `POST /api/feedbacks` | non connecté | — | — |
| `PATCH /api/feedbacks/:id` | non connecté | `creator !== user.id` | — |
| `DELETE /api/feedbacks/:id` | non connecté | `creator !== user.id` ET `role !== admin` | — |
| `POST /api/feedbacks/:id/vote` | non connecté | — | vote déjà existant |

**Cacher un bouton dans l'UI ne suffit pas** — un `curl` direct contournerait. La vraie barrière est l'API route. L'UI ne fait que masquer ce qui n'est pas actionnable, pour la lisibilité.

### 4. Le webhook du Compagnon de test est authentifié, et ne fait jamais confiance à l'identité déclarée dans le message

Le widget de chat envoie l'identité et le rôle de l'utilisateur à n8n, mais ces deux champs sont **relus côté serveur depuis la session** dans `/api/compagnon` (jamais reconstruits depuis ce que le navigateur envoie). Le webhook n8n lui-même est protégé par Basic Auth (`COMPAGNON_WEBHOOK_USER`/`_PASS`) — sans ce verrou, n'importe qui connaissant l'URL du webhook aurait pu l'appeler directement en se déclarant `role: admin`, en contournant totalement l'app et son contrôle d'identité.

### Tests d'attaque effectués (manuels)
- ✅ User A tente `PATCH /api/feedbacks/<id-de-B>` → 403
- ✅ User non connecté → 401 sur tous les endpoints sensibles (y compris `GET /api/feedbacks/[id]`)
- ✅ User normal essaie `/admin` → redirigé vers `/feedbacks`
- ✅ Vote 2× sur le même feedback → 409, `VoteCount` inchangé
- ✅ Token JWT bidouillé (signature invalide) → 401
- ✅ Token Airtable absent du JS bundle vérifié dans Network tab
- ✅ Login avec email inexistant : latence égale à un email valide (timing attack mitigé via `dummyVerify`)
- ✅ Appel direct du webhook `/api/compagnon` sans en-tête d'authentification → 401 côté n8n

### Hardening additionnel
- **Length caps Zod** : `email.max(254)` (RFC 5321), `password.max(128)` → empêche un payload géant qui ferait boucler bcrypt côté serverless
- **Rate limiting per-IP** (Upstash Redis, optionnel via `UPSTASH_REDIS_REST_*`) sur `/api/auth/login` (5/min), `/api/auth/signup` (3/min), `/api/feedbacks/[id]/vote` (20/min). No-op en dev/CI sans les env vars.
- **Vercel Analytics** + **Sentry** (optionnel via `SENTRY_DSN` env var) → monitoring d'erreurs et Web Vitals en prod
- **Tests E2E Playwright** sur 10 scenarios critiques (signup, login, vote, anti-double-vote, permissions cross-user, kanban workflow)

---

## Accessibilité

Cible **WCAG 2.1 AA**. Audit interne passé, correctifs appliqués sur les écarts les plus visibles.

### Fondations (déjà en place avant audit)

- `<html lang="fr">` + landmarks sémantiques (`<header>`, `<nav>`, `<main>`, `<aside>`)
- Tous les `<input>` ont un `<label htmlFor>` associé (Lighthouse 100)
- Tous les boutons icon-only (toggle thème, dismiss notif, select assign) ont un `aria-label`
- Hiérarchie de titres propre : 1 `<h1>` par page, `<h2>` cohérents
- `TypeBadge` / `StatusBadge` : emojis en `aria-hidden`, label texte lu par les lecteurs d'écran
- Le drag-drop kanban a un **fallback bouton complet** — toutes les actions sont accessibles au clavier sans drag

### Correctifs livrés (audit interne)

| ID | Correctif | Impact |
|---|---|---|
| **C-1** | Focus ring global (`:focus-visible` outline action color, 2px, offset 2px) | Tab navigation visible — WCAG 2.4.7 |
| **C-2** | Skip link "Aller au contenu principal" (sr-only, devient visible au focus) | Bypass du Header pour clavier — WCAG 2.4.1 |
| **C-3** | `text-tertiary` foncé en light (`#656565`, abaissé une 2ᵉ fois en V6 quand le job axe-core a flag 4.33:1 sur le test de palette rose) et dark (`#9a9a9a`) | Contraste AA 4.5:1 — WCAG 1.4.3 |
| **I-3** | `role="alert"` sur tous les blocs d'erreur form (login, signup, submit, reset, FeedbackActions) | Erreurs annoncées par lecteur d'écran après submit |
| **I-4** | `celebrate()` confetti respecte `prefers-reduced-motion: reduce` | WCAG 2.3.3, sensibilité vestibulaire |
| **A-2** | `aria-busy={pending}` sur boutons submit pendant les requêtes API | État "occupé" exposé aux lecteurs d'écran |
| **A-3** | Bannières `Notification` et `Verification` en `<aside aria-label>` | Landmarks navigables |
| **A-4** | `inputMode="email"` explicite sur les champs email | Clavier mobile correct, défense en profondeur sur `type=email` |
| **A-5** | `AppToaster` synchronise sonner avec `data-theme` Pulse (au lieu de `prefers-color-scheme`) | Toasts cohérents avec le thème manuel choisi |

### Items audit identifiés mais non encore corrigés (V3)

| ID | Item | Effort |
|---|---|---|
| I-1 | `KeyboardSensor` sur dnd-kit pour drag clavier (fallback bouton existe) | ~10 min |
| I-2 | Émojis dans labels de boutons en `aria-hidden` (ex: "📌 Backlog", "🗑️ Supprimer") | ~15 min |
| I-5 | `aria-current="page"` sur les liens du Header correspondant à la route active | ~15 min |

### Audit automatisé en CI (V6) ✅

Le job **`A11y · axe-core`** dans `.github/workflows/ci.yml` lance [axe-core](https://github.com/dequelabs/axe-core) via Playwright sur les 4 pages publiques (Landing, Login, Signup, Forgot password) à chaque push/PR. Toute violation `serious` ou `critical` fait échouer la CI. Tags scannés : `wcag2a / wcag2aa / wcag21a / wcag21aa`.

Pages logguées-in (`/feedbacks`, `/admin`, `/dev`) restent couvertes par l'audit manuel — pas de test base Airtable de test requis pour ce job de base.

### Limites connues
- **Pas de test manuel avec lecteur d'écran réel** (NVDA / VoiceOver) — couverture via inspection statique du markup + axe-core uniquement.
- **Pages logguées-in non scannées en CI** — un job a11y plus large couvrirait `/feedbacks`, `/admin`, `/dev` (nécessiterait `E2E_ENABLED=true` + une base Airtable de test).

---

## Setup local

### Prérequis
- Node ≥ 20
- Compte Airtable (gratuit), GitHub, Vercel (gratuit)

### 1. Installer

```bash
git clone https://github.com/VincentG32/pulse.git
cd pulse
npm install
```

### 2. Créer la base Airtable
1. [airtable.com](https://airtable.com) → **Create a base** → la nommer `Pulse Base`
2. Récupérer le `Base ID` dans l'URL (`airtable.com/appXXXXXXXXXXXXXX/...`)
3. [airtable.com/create/tokens](https://airtable.com/create/tokens) → créer un PAT
   - Name : `Pulse local`
   - Scopes : `data.records:read`, `data.records:write`, `schema.bases:read`
   - Access : restreindre à la base `Pulse Base` (best practice sécu)

### 3. Créer les tables
Voir [Schéma Airtable](#schéma-airtable) ci-dessous.

### 4. Variables d'env

```bash
cp .env.example .env.local
# Éditer .env.local et remplir au minimum :
#   AIRTABLE_TOKEN=patXXXXXXXXXXXXXX...
#   AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
#   JWT_SECRET=$(openssl rand -base64 48)
```

Variables optionnelles :
- `RESEND_API_KEY` (+ `RESEND_FROM_EMAIL`, `APP_URL`) — active l'envoi des emails de vérification et de reset password. Sans la clé, les URLs sont loggées dans la console serveur (suffisant en dev). Free tier 3k emails/mois.
- `REQUIRE_EMAIL_VERIFICATION=true` — active le gate API qui bloque `POST /api/feedbacks`, `/vote`, `/comments` pour les utilisateurs non vérifiés. Off par défaut pour ne pas casser les seeds existants — à activer après migration manuelle.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — active le rate limiting per-IP. Sans ces vars, le limiteur est no-op (pratique en dev/CI).
- `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (même valeur) — active le monitoring d'erreurs Sentry. Sans ces vars, le SDK reste no-op.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — pour l'upload de source maps au build (facultatif).
- `COMPAGNON_WEBHOOK_URL` + `COMPAGNON_WEBHOOK_USER` + `COMPAGNON_WEBHOOK_PASS` — active le widget "Compagnon de test" (`/api/compagnon`), qui appelle le webhook n8n de l'agent en Basic Auth. Sans ces vars, l'API renvoie 503 et le widget ne s'affiche simplement pas (dégradation gracieuse, comme les autres intégrations optionnelles ci-dessus). Détail : [Automatisations n8n](#automatisations-n8n).

⚠️ **Ne jamais préfixer `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `JWT_SECRET` avec `NEXT_PUBLIC_`** — ce serait exposer le token côté client.

### 5. Lancer

```bash
npm run dev
# → http://localhost:3000
```

### 6. Créer un admin
Après inscription via `/signup`, ouvrir Airtable → table `Users` → changer `Role` à `admin`. Re-login pour rafraîchir le JWT.

### 6 bis. Comptes de test (base de dev)

Seed data utilisée pour les démos et les tests E2E. Tous marqués `EmailVerifiedAt` non null donc le banner de vérification ne s'affiche pas pour eux.

| Email | Role | Usage |
|---|---|---|
| `alice@test.com` | admin | Compte admin principal — accès au dashboard `/admin` (vue d'ensemble + liste/modération) |
| `demo-admin@pulse.app` | admin | **Compte admin partageable pour les démos live** — mdp dans `scripts/create-admin.mjs` |
| `bob@test.com` | user | Compte user générique pour vérifier les permissions cross-user |
| `prodtest@example.com` | user | Compte de test "réaliste" (domaine externe) |
| `vgranouillit.pro@gmail.com` | user | Compte propriétaire |
| `marc@pulse.app` | dev | Dev seed — assignations kanban |
| `yasmine@pulse.app` | dev | Dev seed |
| `lea@pulse.app` | dev | Dev seed |
| `marie@pulse.app` | user | User seed — feedbacks fictifs |
| `hugo@pulse.app` | user | User seed |
| `tom@pulse.app` | user | User seed |
| `sarah@pulse.app` | user | User seed |
| `alex@pulse.app` | user | User seed |

> **Comptes manquants ?** Les seeds `@pulse.app` sont fictifs : adresses non valides, emails de vérif/reset y seront loggés en console (pas envoyés). Pour tester un vrai flow Resend, utiliser une adresse réelle. Les mots de passe seed ne sont pas dans le repo — récupérables via password reset si Resend est configuré, ou en re-créant un user via `/signup`.

### 7. Déploiement Vercel
1. `git push` sur GitHub
2. [vercel.com/new](https://vercel.com/new) → Import → choisir le repo `pulse`
3. Environment Variables : ajouter les 3 mêmes (Production + Preview)
4. Deploy → URL en `xxx.vercel.app`

**Recommandé** : créer 2 bases Airtable séparées (`Pulse-Dev` et `Pulse-Prod`) pour ne pas polluer la prod avec de la data de test. Chaque environnement Vercel pointe sur sa base.

### 8. Tests E2E en CI (optionnel)

Le workflow `e2e` dans GitHub Actions exécute les 10 tests Playwright sur chaque push. Il est **opt-in** : tant qu'il n'est pas activé, le workflow CI tourne en `Typecheck · Lint · Build` seulement.

**Pour l'activer** :

1. **Créer une base Airtable de test isolée** :
   - airtable.com → Create base → la nommer `Pulse-Test`
   - Cloner manuellement le schéma de prod (5 tables : Users, Feedbacks, Votes, Notifications, Comments). Ou via [airtable.com/sync-data](https://airtable.com/sync-data).
   - Créer les 4 comptes de test : `alice@test.com` (admin), `bob@test.com` (user), `sarah@pulse.app` (user), `lea@pulse.app` (dev) — tous avec password `password123` (les tests les utilisent).
   - Récupérer le `Base ID` (commence par `app...`)
   - Créer un Personal Access Token dédié avec accès à cette base seulement.

2. **GitHub → Settings → Secrets and variables → Actions** :
   - Onglet **Secrets** : ajouter
     - `E2E_AIRTABLE_TOKEN` (le PAT de la base test)
     - `E2E_AIRTABLE_BASE_ID` (l'ID `app...` de la base test)
     - `E2E_JWT_SECRET` (n'importe quelle string aléatoire 32+ chars)
   - Onglet **Variables** : ajouter
     - `E2E_ENABLED` = `true`

3. Au prochain push, le job `E2E · Playwright` apparaît à côté du job `build`. Sur failure, le rapport HTML est uploadé en artifact (téléchargeable depuis l'onglet Actions).

⚠️ **Pourquoi une base séparée** : les tests créent et suppriment des feedbacks. Ils utilisent des titres préfixés `[E2E timestamp]` et nettoient via `afterEach`, mais une base dédiée garantit zéro pollution sur la prod.

---

## Schéma Airtable

### Diagramme des relations

```
┌──────────┐      ┌────────────┐      ┌──────┐
│  Users   │◄─────│ Feedbacks  │      │ Votes│
│          │  1:N │            │  1:N │      │
│ Email    │◄─────┤ Creator    │◄─────│ User │
│ Hash     │      │            │      │      │
│ Name     │      │            │◄─────┤ Feedback
│ Role     │      └────────────┘  1:N │      │
└──────────┘                          └──────┘
```

### Table `Users`
| Champ | Type | Notes |
|---|---|---|
| `Email` | Single line text | **Primary**, unique (vérifié à signup) |
| `PasswordHash` | Long text | bcrypt cost 10, jamais le password en clair |
| `Name` | Single line text | nom affiché |
| `Role` | Single select | `user` (default) · `dev` · `admin` |
| `CreatedAt` | dateTime | rempli explicitement à signup |
| `EmailVerifiedAt` | dateTime | null = email pas encore vérifié, set = vérifié à cette date |
| `VerificationToken` | Single line text | token de vérification d'email actif (24h), null après usage |
| `VerificationExpires` | dateTime | expiry du token de vérification |
| `ResetToken` | Single line text | token de reset password actif (1h), null après usage |
| `ResetExpires` | dateTime | expiry du token de reset |

> **Migration des utilisateurs existants** : après ajout des 5 champs ci-dessus, les rows existantes ont `EmailVerifiedAt` à null et seraient considérées comme non-vérifiées. Pour basculer les seeds (admin, devs de test) en vérifiés, mettez `EmailVerifiedAt` au timestamp ISO de votre choix dans Airtable. Le gate sur les actions API n'est actif que si `REQUIRE_EMAIL_VERIFICATION=true` (cf. setup), donc vous pouvez introduire la migration progressivement.

### Table `Feedbacks`
| Champ | Type | Notes |
|---|---|---|
| `Title` | Single line text | **Primary** |
| `Description` | Long text | |
| `Type` | Single select | `bug` · `idée` · `amélioration` |
| `VoteCount` | Number (integer) | dénormalisé pour le tri ; incrémenté dans la même route que `create Vote` |
| `Creator` | Link → Users | single record link |
| `CreatedAt` | dateTime | |
| `Status` | Single select | `to_do` · `in_progress` · `review` · `done` — alimente le workflow kanban `/dev` |
| `AssignedTo` | Link → Users | dev en charge du feedback (kanban) |
| `Criticality` | Single select | **V6** : `bloquant` · `majeur` · `mineur`. Obligatoire à la création quand `type=bug`, vide sinon. Admin peut override depuis `/admin?tab=list` (picker inline) ou la page détail. |
| `DeletedAt` | dateTime | **V6** soft delete : null = actif, set = supprimé (filtré hors des reads). Récupération en vidant le champ depuis Airtable. |
| `EmailSubject` | Formula | objet d'email pré-formaté pour les automatisations Airtable (cf. [Automatisations Airtable](#automatisations-airtable)) |
| `BodyTemplate` | Formula | corps d'email pré-formaté multi-lignes, idem |
| `HotVoteSubject` | Formula | **V6** : `"🔥 Hot vote : [" & {Type} & "] " & {Title}`. Consommé par l'auto 🔥 Hot vote (seuil ≥ 5 votes) |
| `BloquantSubject` | Formula | **V6** : `"🚨 Bug BLOQUANT : " & {Title}`. Consommé par l'auto 🚨 Bug bloquant signalé |
| `Archivé` | Checkbox | exclusion des vues admin filtrées, marqueur manuel ou automatique (TTL 30j sur `done`) |

### Table `Votes`
| Champ | Type | Notes |
|---|---|---|
| `Reference` | Single line text | **Primary** (laissé vide, on n'utilise pas le primary field ici) |
| `Feedback` | Link → Feedbacks | single record |
| `User` | Link → Users | single record |
| `FeedbackId` | Single line text | **dupliqué pour le filtre** (cf. ⚠️ ci-dessous) |
| `UserId` | Single line text | idem |
| `CreatedAt` | dateTime | |

⚠️ **Pourquoi les champs texte `FeedbackId` / `UserId` en double des liens ?**
Airtable's `filterByFormula` ne sait pas filtrer un linked record par son ID — `ARRAYJOIN({Feedback})` retourne le **primary field** des records liés (le titre du feedback), pas leur ID. Pour vérifier vite l'existence d'un vote `(feedback, user)`, on a dénormalisé les IDs en texte plat. Petit coût en stockage, gros gain en simplicité de requête.

### Table `Notifications`
| Champ | Type | Notes |
|---|---|---|
| `Reference` | Single line text | **Primary** (laissé vide) |
| `Recipient` | Link → Users | destinataire de la notification |
| `Feedback` | Link → Feedbacks | feedback concerné |
| `Status` | Single line text | type d'évènement (ex. changement de statut) |
| `RecipientId` / `FeedbackId` | Single line text | mêmes raisons de dénormalisation que sur `Votes` |
| `CreatedAt` / `UpdatedAt` | dateTime | |

### Table `Comments`
| Champ | Type | Notes |
|---|---|---|
| `Reference` | Single line text | **Primary** (laissé vide) |
| `Feedback` | Link → Feedbacks | feedback commenté |
| `Author` | Link → Users | auteur du commentaire |
| `Body` | Long text | contenu du commentaire |
| `FeedbackId` / `AuthorId` | Single line text | mêmes raisons de dénormalisation que sur `Votes` |
| `CreatedAt` | dateTime | |

### Table `CahierTests`
| Champ | Type | Notes |
|---|---|---|
| `Code` | Single line text | **Primary** (ex. `TEST-006`), utilisé pour citer la source dans les réponses de l'agent |
| `Campagne` | Single line text | filtré sur la campagne active (`Pulse V1` en dur pour ce MVP — voir [Roadmap](#roadmap-v2--v3)) |
| `Zone` | Single line text | regroupement d'affichage sur `/campagne` |
| `Scenario` | Long text | ce que le testeur doit essayer |
| `ResultatAttendu` | Long text | comportement attendu, indexé dans Qdrant pour le RAG |
| `Priorite` | Single select | `haute` / `moyenne` / `basse`, nullable |
| `Actif` | Checkbox | exclut un item du cahier sans le supprimer |

> Les tables techniques `Monitoring`, `JeuDeTest` et `Evaluation` (écrites/lues par n8n, pas par l'app Next.js) sont documentées dans [Automatisations n8n](#automatisations-n8n).

---

## Automatisations Airtable

Pulse utilise les **Automatisations natives d'Airtable** pour piloter les alertes admin, en complément du backend Next.js. Cette couche tourne **côté Airtable**, sans toucher au code applicatif. Elle est désactivable d'un toggle si la base est synchronisée vers une autre prod.

### Pourquoi pas tout faire dans le code Next.js ?

Le code applicatif gère déjà l'envoi d'emails transactionnels destinés aux **utilisateurs finaux** (vérification, reset password) via Resend. Mais les alertes admin internes (nouveau feedback, hot vote, lead bloqué) n'ont pas vocation à passer par le code applicatif :

- Elles n'ont **aucun impact UX** côté utilisateur — c'est de la plomberie ops.
- Elles changent souvent (seuil de votes, destinataire, format) — les piloter en Airtable évite un déploiement à chaque ajustement.
- Elles peuvent être **désactivées sans toucher au code** (audit, RGPD, vacances admin).

Chemin court assumé : trigger Airtable → email, zéro intermédiaire.

### Champs utilitaires sur `Feedbacks`

Pour rendre les emails **réutilisables et cohérents**, on dérive deux champs `Formula` à partir des données du record. Les automatisations consomment ces champs au lieu de re-templater à chaque fois.

#### `EmailSubject` (Formula)

```airtable
"🆕 [" & {Type} & "] " & {Title}
```

Génère un objet du type `🆕 [bug] Pagination casse à partir de 50 feedbacks`. L'emoji rend l'email reconnaissable dans une boîte chargée, le type entre crochets accélère le scan visuel.

#### `BodyTemplate` (Formula)

```airtable
"Titre : " & {Title} & "
Type : " & {Type} & "
Statut : " & {Status} & "
Votes : " & {VoteCount} & "

Description :
" & {Description}
```

Génère un corps multi-lignes structuré, prêt à l'envoi sans mise en forme supplémentaire dans l'automatisation.

#### Pourquoi des Formula plutôt que du templating dans l'automatisation ?

- **Single source of truth** : le format de l'email est défini **une fois**. Toute automatisation qui consomme `{EmailSubject}` ou `{BodyTemplate}` récupère automatiquement la dernière version.
- **DRY** : N automatisations (alerte création, alerte 10 votes, alerte status change…) réutilisent les mêmes champs sans dupliquer le templating.
- **Test gratuit** : les champs sont visibles dans la table, on voit le rendu sur tous les records sans lancer une automatisation.

Même principe que les relations entre tables : on évite la duplication, on centralise.

### Automatisation `Alerte nouveau feedback`

| Élément | Configuration |
|---|---|
| **Déclencheur** | `When a record is created` → table `Feedbacks` |
| **Action** | `Send email` |
| **Destinataire** | adresse admin (configurée en dur dans l'action) |
| **Objet** | `{EmailSubject}` |
| **Corps** | `{BodyTemplate}` |

**Comportement** : à chaque nouveau feedback créé (via UI Airtable, formulaire Airtable, ou `POST /api/feedbacks` côté app), l'admin reçoit un email formaté dans la seconde, avec titre, type, votes, description complète.

### Quotas et limites

| Limite | Valeur | Notes |
|---|---|---|
| Emails / jour | 100 par destinataire vérifié (plan Free) | Largement suffisant au volume Pulse |
| Runs d'automatisation / mois | 100 sur Free, 1 000 sur Team | À surveiller si on multiplie les automatisations |
| Délai de déclenchement | ~30 s à 2 min | Pas du temps réel — acceptable pour des alertes admin |

### Automatisation `🔥 Hot vote alert` (V6)

| Élément | Configuration |
|---|---|
| **Déclencheur** | `Record matches conditions` → table `Feedbacks` · `VoteCount ≥ 5` |
| **Action** | `Send email` |
| **Destinataire** | adresse admin |
| **Objet** | `{HotVoteSubject}` (formule : `"🔥 Hot vote : [" & {Type} & "] " & {Title}`) |
| **Corps** | `{BodyTemplate}` (réutilisé) |

**Comportement** : quand un feedback franchit le seuil de 5 votes, l'admin reçoit instantanément une alerte. Sert à attraper les sujets qui décollent pour décider rapidement s'ils partent au backlog. Seuil ajustable depuis l'UI Airtable sans toucher au code.

### Automatisation `🚨 Bug bloquant signalé` (V6)

| Élément | Configuration |
|---|---|
| **Déclencheur** | `Record matches conditions` → table `Feedbacks` · `Type = bug` ET `Criticality = bloquant` |
| **Action** | `Send email` |
| **Destinataire** | adresse admin |
| **Objet** | `{BloquantSubject}` (formule : `"🚨 Bug BLOQUANT : " & {Title}`) |
| **Corps** | `{BodyTemplate}` (réutilisé) |

**Comportement** : se déclenche à la création d'un nouveau bug bloquant **OU** sur un override admin qui bascule un bug existant en bloquant. Boucle parfaite avec le tile KPI "Bloquants" et la liste "Top bugs bloquants à traiter" sur le dashboard.

### Roadmap automations restantes

| Automatisation | Déclencheur | Action |
|---|---|---|
| **Email à l'auteur sur changement de statut** | `Record updated` → champ surveillé `Status` | `Find record` dans `Users` (matcher l'email du `Creator`) puis `Send email` |
| **Auto-archive `done` après 30 jours** | `At a scheduled time` (cron) → records où `Status = done` ET `CreatedAt < today - 30d` ET `Archivé = false` | `Update record` → `Archivé = true` |

### Limitations connues

- **Pas de retry visible** : si l'envoi de l'email échoue (quota dépassé, adresse invalide), Airtable retry silencieusement 2-3 fois puis abandonne. L'onglet `Historique` de l'automatisation log le statut, mais aucun monitoring centralisé (pas remonté à Sentry).
- **Pas de versioning** : modifier la formule d'`EmailSubject` impacte **rétroactivement** tous les calculs dans toutes les vues qui l'affichent. Aucun historique des formules précédentes.
- **Pas exportable en code** : les automatisations Airtable ne sont pas versionnables dans Git. Cette section du README est le seul moyen de garder une trace.
- **Couplage destinataire** : l'email admin est en dur dans l'action. Pour un usage multi-admin, extraire dans une table `Settings`, ou basculer vers un `Find users where Role = admin` puis email à chacun.

---

## Automatisations n8n

En plus des automatisations natives Airtable ci-dessus, une instance **n8n** (VPS personnel) porte tout ce qui touche à l'IA : classification, agent conversationnel, RAG, qualité. Chaque workflow business est lié à un **Error Workflow** centralisé.

### Pourquoi n8n plutôt que du code Next.js ?

Les automatisations Airtable suffisent pour de la plomberie simple (email déclenché sur un changement de champ). Dès qu'il faut enchaîner plusieurs appels à un modèle de langage, gérer un garde-fou, interroger une base vectorielle et boucler sur un jeu de test, une orchestration visuelle dédiée devient plus lisible et plus rapide à ajuster qu'un enchaînement de fonctions Next.js — sans redéploiement à chaque changement de prompt ou de seuil.

### Digest hebdo IA
Tous les lundis à 9h, synthèse de la semaine (nouveaux feedbacks, votes, statuts) par Claude Sonnet, envoyée par email.

### Classification automatique
À la création d'un feedback (Airtable Trigger), Claude Haiku (température 0, sortie JSON stricte) propose `Type` et `Criticality`. Ne touche jamais à la criticité si `CriticalityLockedByAdmin` est coché — un admin garde toujours la main sur ses propres arbitrages.

### Compagnon de test
Agent conversationnel derrière le widget `/campagne` et `/submit`, orchestré en plusieurs sous-workflows :
- **Orchestrateur** (Chat Trigger, webhook, protégé par Basic Auth) : normalise l'entrée (identité/rôle **toujours** fournis par `/api/compagnon`, jamais reconstruits depuis le message), puis passe la main au garde-fou.
- **Garde-fou** (Claude Haiku, JSON strict) : classe chaque message en 4 catégories — `legitime`, `hors_sujet`, `injection`, `hors_perimetre_role` — et bloque tout ce qui n'est pas légitime avant même d'appeler l'agent principal (protège la sécurité et le coût).
- **Agent** (Claude Sonnet, mémoire glissante 10 messages) : dispose de 2 outils, chacun un sous-workflow RAG sur Qdrant — `guide_de_test` (cherche dans le cahier de test actif) et `recherche_doublons` (cherche un feedback similaire existant, seuil de similarité 0.45, propose de voter pour l'existant plutôt que d'en créer un nouveau).
- Chaque appel est tracé dans la table `Monitoring`.

### Indexation Qdrant
Workflow séparé qui vectorise le cahier de test actif (embeddings Cohere `embed-multilingual-v3.0`, 1024 dimensions) et l'upsert dans Qdrant. Appelle Cohere et Qdrant en HTTP direct plutôt que via les nœuds natifs n8n dédiés — voir [ADR](#décisions-techniques-mini-adrs).

### Pipeline d'évaluation qualité
Rejoue les 8 cas de la table `JeuDeTest` (un par catégorie attendue : nominal, doublon, hors sujet, injection, hors périmètre rôle, information absente, etc.) contre l'agent réel en production, puis fait noter chaque réponse par un juge Claude Haiku sur 3 critères (Pertinence, Sécurité, Clarté), stockés dans `Evaluation`. Baseline actuelle : **4.96/5** sur 8/8 cas. La calibration humaine (comparer le jugement du juge IA au sien sur un échantillon) reste à faire — champ `Annotation_humaine` prévu mais pas encore rempli.

### Error Workflow
Un seul point d'entrée pour toutes les erreurs des 7 workflows business : alerte email + ligne "Échec" dans `Monitoring`, avec le message d'erreur. Chaque nœud modèle a un retry (2 tentatives, 5 secondes d'écart) et un timeout de 120 secondes.

### Tables techniques (écrites/lues par n8n)

| Table | Rôle |
|---|---|
| `Monitoring` | une ligne par exécution majeure (workflow, statut, durée, date, message d'erreur) |
| `JeuDeTest` | les 8 cas de test de référence, écrits avant la première évaluation |
| `Evaluation` | résultats détaillés de chaque run du pipeline de qualité |

### Limitations connues (n8n)
- **Traçabilité seulement partielle en Git** : contrairement au code Next.js, les workflows n8n ne sont pas versionnés automatiquement — toute modification se fait dans l'UI n8n, sans diff ni historique Git.
- **Pas de couverture E2E/CI** : `/campagne` et `/api/compagnon` ne sont testés qu'à la main, aucun test Playwright ne les couvre aujourd'hui.
- **Calibration humaine du juge non faite** (voir ci-dessus).

---

## Structure du code

```
src/
├── app/
│   ├── page.tsx                  # / (landing si déconnecté, redirect /feedbacks si connecté)
│   ├── login/                    # /login (page = Suspense + LoginForm client)
│   ├── signup/                   # /signup
│   ├── feedbacks/                # /feedbacks (server) + FeedbacksList (client) avec filtres
│   ├── feedback/[id]/            # /feedback/:id (server) + FeedbackActions (client)
│   ├── submit/                   # /submit (form client)
│   ├── admin/                    # /admin (server, gated par role) + AdminDeleteButton (client)
│   ├── api/
│   │   ├── auth/{signup,login,logout}/route.ts
│   │   ├── me/route.ts
│   │   └── feedbacks/
│   │       ├── route.ts                # GET (list, auth required), POST (create)
│   │       ├── [id]/route.ts           # GET, PATCH, DELETE (avec checks ownership/role)
│   │       └── [id]/vote/route.ts      # POST (anti-double-vote), GET (hasVoted)
│   ├── layout.tsx                # Header + Toaster + container
│   └── globals.css               # design tokens Tailwind v4 @theme
├── components/
│   ├── Header.tsx                # logo + nav contextuelle (admin link si role=admin)
│   ├── FeedbackCard.tsx          # cellule cliquable de la liste
│   ├── TypeBadge.tsx             # badge coloré par type
│   └── LogoutButton.tsx          # client (POST /api/auth/logout)
├── lib/
│   ├── airtable.ts               # SEUL module qui parle à Airtable
│   ├── auth.ts                   # bcrypt + JWT + getCurrentUser + cookie helpers
│   ├── schemas.ts                # Zod (signup, login, createFeedback, updateFeedback)
│   └── format.ts                 # formatDate, truncate
└── proxy.ts                       # Next.js 16 middleware (renommé) - gate par cookie
```

**Convention de nommage** : Server Component = `page.tsx` direct, Client Component = fichier dédié `XxxForm.tsx` / `XxxActions.tsx` co-localisé.

---

## Décisions techniques (mini-ADRs)

### ADR-1 : Pourquoi Airtable plutôt que Postgres ?
**Pour le projet de formation :**
- ✅ Pas de migration SQL à gérer
- ✅ UI native pour debug rapide (renommer un feedback à la main)
- ✅ Plan gratuit suffisant (1 500 records/base, 5 req/s)

**À reconsidérer à scale :**
- ❌ Pas de transaction atomique → race condition possible sur `VoteCount` (2 votes simultanés peuvent perdre une incrémentation)
- ❌ Rate limit 5 req/s ne tient pas au-delà d'une équipe
- ❌ Pas de Row-Level Security native — toute la sécu repose sur les API routes

### ADR-2 : Pourquoi JWT custom plutôt que NextAuth ?
- C'est un projet de **formation**. Exposer la mécanique (`bcrypt.hash`, `jwt.sign`, cookie `httpOnly`) est pédagogique. NextAuth aurait masqué tout ça derrière une abstraction.
- Trade-off : pas d'OAuth GitHub/Google prêt à l'emploi, pas de password reset out-of-the-box.

### ADR-3 : Pourquoi un champ `FeedbackId` (texte) en plus du link `Feedback` sur Votes ?
Voir [Schéma Airtable](#table-votes). Détaillé ci-dessus : `filterByFormula` ne sait pas matcher sur un linked record ID, donc on dénormalise.

### ADR-4 : Pourquoi `proxy.ts` plutôt que `middleware.ts` ?
Next.js 16 a déprécié le nom `middleware.ts` au profit de `proxy.ts` (renommage uniquement). La fonction exportée s'appelle désormais `proxy()` et non `middleware()`. Aucun changement de signature.

### ADR-5 : Pourquoi `force-dynamic` partout au lieu d'`ISR` ?
Pulse est un outil interne de petite équipe — la fraîcheur instantanée des votes prime sur la perf. `force-dynamic` simplifie aussi le mental model (pas de cache à invalider). À reconsidérer V3 quand on aura SWR côté client + cache HTTP côté Edge.

### ADR-6 : Pourquoi pas de `revalidatePath` après mutation ?
Toutes les pages qui consomment des feedbacks sont déjà `dynamic = "force-dynamic"`. Un `router.refresh()` côté client suffit pour faire re-render le Server Component avec la data fraîche.

### ADR-7 : Sécurité des mots de passe — bcrypt cost 10
Standard 2025. cost 12 serait plus sûr mais ralentit le signup à ~250ms sur les serverless functions Vercel. Trade-off accepté pour cette V1.

### ADR-8 : Pourquoi appeler Cohere et Qdrant en HTTP direct plutôt que les nœuds natifs n8n ?
Le nœud natif d'insertion Qdrant de n8n a un vrai bug d'écriture (`Not existing vector name error`), confirmé indépendant de Qdrant et de Cohere (les deux testés sains individuellement via des appels directs). Contournement : le workflow d'indexation appelle Cohere (`POST /v2/embed`) et Qdrant (`PUT /collections/.../points`) en HTTP direct. La lecture, elle, reste sur le nœud natif Qdrant, qui fonctionne correctement — à condition que la collection soit créée avec un vecteur nommé chaîne vide plutôt que sans nom.

### ADR-9 : Pourquoi séparer les couleurs du bloc `@theme inline` ?
`@theme inline` indique à Tailwind v4 de figer la valeur résolue d'une variable au moment de la compilation, plutôt que de générer une référence `var(...)` vivante dans les classes utilitaires. Utile pour les polices (`--font-sans: var(--font-geist-sans)`, une indirection vers une variable injectée par Next.js), mais catastrophique pour les couleurs : ça empêchait `[data-theme="dark"]` de s'appliquer sur `bg-*`/`text-*`, puisque la valeur claire était déjà figée en dur dans le CSS généré. Fix : polices dans leur bloc `@theme inline`, couleurs et radii dans un bloc `@theme` classique juste à côté.

---

## Roadmap V2 / V3

Organisée par effort × impact. Les tiers sont indépendants — vous pouvez piocher.

### 🟢 Tier 1 — Quick wins déjà livrés (cf. [Fonctionnalités V1.5](#quick-wins-ajoutés-v15-))

### 🟢 Tier 1 bis — Déjà livré V6 (cf. [Évolutions V6](#v6-))

- Criticité bugs (bloquant/majeur/mineur) + admin override (picker inline + page détail) + dashboard "Bloquants"
- Alerte 🚨 Bug bloquant (Airtable Automation)
- Alerte 🔥 Hot vote ≥ 5 votes (Airtable Automation)
- Export CSV admin
- Soft delete (DeletedAt)
- a11y CI automatisé (axe-core/playwright sur 4 pages publiques)

### 🟡 Tier 2 — V2 (1-3 jours par feature)

| Feature | Description | Pourquoi |
|---|---|---|
| **Recherche full-text** | Input avec debounce, filtre `?q=...` côté API via `SEARCH({Title}, q)` Airtable | Demandé par tous les seed users (top des votes !) |
| **Tags / catégories** | Champ `multipleSelects` Airtable, multi-filtre combiné avec type | Pour équipes multi-produits |
| **Pagination cursor** | `?cursor=...` + bouton "Charger plus" | Au-delà de 100 feedbacks |
| **Optimistic vote** | Update UI **avant** la réponse API, rollback si 409 | Réactivité perçue |
| **Filtre criticité sur `/admin?tab=list`** | Sélecteur "bloquant uniquement" pour triage rapide | Compagnon naturel du tile KPI Bloquants |

### 🔴 Tier 3 — V3 / refonte (1+ semaine par feature)

| Feature | Pourquoi | Compromis |
|---|---|---|
| **Migration → Postgres** (Supabase / Neon) | Transactions atomiques, RLS, foreign keys, scalabilité | Apprentissage Prisma/Drizzle, perte de l'UI Airtable |
| **NextAuth.js** | OAuth GitHub/Google, sessions DB révocables, password reset out-of-the-box | Couche d'abstraction supplémentaire à comprendre |
| **Notifications email** | Vote reçu, status change envoyés par email (en plus de la bannière in-app actuelle) | Resend + queue (Inngest ou Vercel Cron) |
| **i18n FR/EN** | Élargir l'audience | next-intl + refactor strings |
| **Mobile redesign** | Cards trop denses sur smartphone | 1-2 jours UX + tests sur vrais devices |

---

## Limitations connues

1. **Cohérence éventuelle sur `VoteCount`** — les 2 requêtes Airtable (`createVote` + `incrementVoteCount`) ne sont pas atomiques. Si la 2ᵉ échoue après la 1ʳᵉ, le compteur diverge. Acceptable au volume actuel (~10 utilisateurs), à durcir avec une vraie DB transactionnelle.
2. **Token JWT non révocable** — un cookie compromis reste valide jusqu'à expiration (7 jours). V3 : sessions DB ou tokens courts + refresh.
3. ~~Pas de password reset / email verification~~ — **livré depuis V2** (voir §Fonctionnalités) : vérification d'email à l'inscription et reset password par token expirant sont en place.
4. ~~Aucun test automatisé~~ — **livré depuis V2/V6** : 14 tests E2E Playwright + CI GitHub Actions (typecheck/lint/build sur chaque push, a11y systématique, suite E2E complète gated derrière `E2E_ENABLED`). Limite réelle actuelle : la suite E2E ne tourne pas par défaut en CI (variable désactivée) — voir §Tests E2E en CI.
5. **Performance Airtable** — 5 req/s par base. La page liste fait 2 requêtes (feedbacks + users batch). Tient jusqu'à ~50 utilisateurs simultanés grand max.
6. **Cookie sameSite=lax** — un site malveillant peut déclencher des `GET` cross-origin avec le cookie, mais pas des `POST` (CSRF safe par convention HTTP). Suffisant pour cette V1.
7. **Pas de versionning des feedbacks** — éditer un feedback écrase l'ancien contenu sans historique.
8. **Anti-doublon non automatique au clic sur "Soumettre le feedback"** — le Compagnon de test (voir [Automatisations n8n](#automatisations-n8n)) sait détecter un feedback similaire et propose de voter pour lui plutôt que d'en créer un nouveau, mais seulement si le testeur ouvre le chat et décrit son problème *avant* de remplir le formulaire. Le bouton "Soumettre le feedback" (accessible depuis `/submit`, `/campagne` et "+ Nouveau feedback" sur `/feedbacks` — un seul et même formulaire) ne fait aucune vérification lui-même. Choix de scope assumé (MVP) plutôt que bug : l'automatiser ajouterait un appel réseau bloquant sur le chemin de soumission et un nouveau cas à couvrir dans le jeu de test, pour un mécanisme déjà démontré et fonctionnel via le chat.
9. **Calibration humaine du juge de qualité non faite** — voir [Automatisations n8n](#automatisations-n8n).
10. **`/campagne` et le Compagnon de test hors couverture E2E/CI** — testés manuellement seulement à ce jour.

---

## Crédits

Mon projet final du titre **Product Builder No-Code** ([La Capsule](https://www.lacapsule.academy/)), 2026.

Brief original : centraliser et prioriser le feedback produit, en illustrant les 12 principes du cours "Construire une application solide" (séparation données/UI, sécurité côté serveur, naming, scalabilité…).

Build : [@VincentG32](https://github.com/VincentG32) avec assistance Claude Code.

---

<sub>Made with 🤍 in Paris.</sub>

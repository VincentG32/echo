# 🔄 Handoff — Reprise de conversation

> **Pour recharger le contexte dans une nouvelle session, demande à Claude de lire ce fichier en premier.**

Dernière mise à jour : fin de session, à reprendre ici.

---

## 🎯 PROCHAINES QUESTIONS — où on s'est arrêtés

On était en train de mettre en place le **workflow N8N #1 (Digest hebdo + IA)** pour la branche `la-capsule` (version La Capsule du projet). Je viens de présenter le cadrage produit / business du workflow, j'attends 2 réponses :

1. **Compte N8N** : tu en as déjà un ? Sinon il faut en créer un (plan Free suffit largement pour ce besoin).
2. **Clé API IA** : tu as déjà une clé OpenAI OU Anthropic ? Sinon on doit créer un compte sur l'un des deux (gpt-4o-mini chez OpenAI ~$0.15 par run / claude-haiku chez Anthropic ~similaire).

Une fois ces 2 réponses, on enchaîne sur le setup pas-à-pas du workflow (planification cron lundi 9h → fetch Airtable → prompt IA → email).

---

## 📝 Le cadrage produit du Digest hebdo (à pitcher au jury)

**Problème** : un PM/CP qui utilise Pulse en équipe passe 30-45 min chaque lundi à lire les 40+ feedbacks de la semaine, identifier les patterns et préparer son arbitrage. Plus le risque de rater un signal faible.

**Solution** : email automatique tous les lundis 9h avec une note de synthèse en 1 page structurée comme un brief de pilotage produit, avec 5 sections :

| Section | Question PM | Source |
|---|---|---|
| 🔥 Sujets qui montent | "Sur quoi se concentre l'énergie utilisateurs ?" | Top 3 feedbacks qui ont pris le plus de votes / 7 jours |
| 🚨 Nouveaux critiques | "Quels feux dois-je éteindre vite ?" | Bugs bloquant/majeur créés ou reclassés cette semaine |
| 🔍 Patterns détectés | "Y a-t-il un fil rouge entre plusieurs signaux ?" | L'IA regroupe les feedbacks similaires sémantiquement |
| 🎯 Recommandations | "Sur quoi je commit dans le sprint ?" | L'IA propose 3-5 actions concrètes avec rationnel |
| ⏱️ Stalled items | "Où mon équipe est bloquée sans le dire ?" | Feedbacks coincés > 7 jours dans le même statut |

**Pitch jury** : économise ~1h/semaine de PM (équivalent ~300€/mois d'opportunité), réduit risque de manquer un signal faible (3 bugs décrits différemment pointant le même problème sous-jacent), coût marginal dérisoire (~quelques centimes / semaine).

---

## 🏗 État du projet — vue d'ensemble

### 2 branches sur le même repo `github.com/VincentG32/pulse`

| Branche | Vercel URL | Airtable Base ID | Usage |
|---|---|---|---|
| `main` | `pulse-one-brown.vercel.app` | `appoFJlZhuoTaCx7g` (Pulse Base) | Pulse Pro — version commerciale future, continue d'évoluer |
| `la-capsule` | `pulse-capsule.vercel.app` | `appz7kMg6tYVsjQbp` (Pulse Base - Capsule) | Pulse Capsule — projet final formation La Capsule |

**Important** : avant chaque commit, l'utilisateur doit dire **sur quelle version** on bosse. Je commit toujours sur la bonne branche, jamais sur les deux à la fois.

### Comptes de démo (existent dans les 2 bases car dupliquées après création)

| Email | Mot de passe | Role |
|---|---|---|
| `demo-admin@pulse.app` | `pulse-demo-admin` | admin |
| `demo-user@pulse.app` | `pulse-demo-user` | user |
| `demo-dev@pulse.app` | `pulse-demo-dev` | dev |

Plus le compte historique `alice@test.com` (admin) dont on n'a pas le mot de passe.

---

## 🆕 Ce qui a été livré en V6 (sur les 2 branches)

- **Criticité bugs** (bloquant/majeur/mineur) obligatoire à la création quand `type=bug`
- **Admin override criticité** sur 2 surfaces : page détail (3 boutons toggle) + inline picker sur `/admin?tab=list` (popover)
- **Bloquants sur dashboard** : 5e tile KPI rouge + liste "Top bugs bloquants à traiter"
- **🔥 Hot vote alert** (Airtable Automation, ≥ 5 votes)
- **🚨 Bug bloquant alert** (Airtable Automation, type=bug ∧ criticality=bloquant)
- **Export CSV admin** (`/api/admin/export`)
- **Soft delete** (champ `DeletedAt`, filter sur tous les reads)
- **a11y CI** (axe-core sur 4 pages publiques à chaque PR/push)
- **Palette teal** `#0F766E` (light) / `#14B8A6` (dark) après un détour par rouge

## 🆕 Ce qui a été fait spécifiquement sur `la-capsule` (vs main)

- **Suppression du dashboard métrique de l'app** : `/admin` ne montre plus que la liste de modération
- Onglet "Vue d'ensemble" supprimé (AdminOverview, AdminTabs, AnalyticsCharts virés du code, recharts désinstallé)
- Titre passé de "Dashboard Admin" → "Admin"
- Les metrics doivent être reproduites dans **une interface Airtable** dédiée (à monter après N8N)

---

## 📅 Roadmap envisagée par version

### Pulse Pro (`main`) — version commerciale
**Priorité 1** : import CSV/fichier de stories → génération auto d'un cahier de tests → exécution guidée → création de tickets bugs directement depuis le test
**Suite** : reste de la roadmap V2/V3 du README (recherche full-text, tags, pagination cursor, optimistic vote, filtre criticité)

### Pulse Capsule (`la-capsule`) — projet final formation
Brief La Capsule = stack imposée **Webflow + Airtable + N8N + IA**
- ✅ Dashboard métrique sorti de l'app (déjà fait)
- 🔄 **EN COURS** : Workflow N8N #1 (Digest hebdo + IA)
- 📋 À faire ensuite (à confirmer par le user) :
  - Interface Airtable pour les metrics (remplace le dashboard supprimé)
  - Landing Webflow (pattern marketing externe : `pulse-app.fr` Webflow + `app.pulse-app.fr` Vercel)
  - Chatbot IA dans `/submit` (assistant de formulation des feedbacks)
  - Workflows N8N additionnels (parmi les 4 candidats)

### 4 candidats workflows N8N qu'on avait proposés
1. **Digest hebdo + IA** (en cours — démarre ici)
2. Notification multi-canal sur Bug Bloquant (Slack + Discord + email)
3. Auto-classification IA des nouveaux feedbacks (Type + Criticité depuis Title+Description)
4. Sync feedbacks → Notion / Linear sur statut `in_progress`

---

## 🛠 Stack technique en place

- **Next.js 16** App Router + Server Components + TypeScript strict
- **Tailwind v4** (`@theme inline` dans `globals.css`)
- **Airtable** + automatisations natives (déjà 3 actives : nouveau feedback, hot vote, bug bloquant — dupliquées dans la base Capsule)
- **JWT custom + bcryptjs** pour l'auth
- **Resend** pour les emails transactionnels (vérification + reset password)
- **Upstash Redis** pour rate limiting per-IP
- **Sentry + Vercel Analytics** pour monitoring
- **GitHub Actions CI** : typecheck + lint + build + a11y (axe-core)
- **Playwright** pour E2E (10 tests, gated derrière `E2E_ENABLED=true` car nécessite base Airtable de test)

## 🗂 Conventions du projet

- Commits scopés, messages descriptifs (en anglais avec rationnel produit)
- Co-Authored-By: Claude à la fin des messages de commit
- Build local avant commit : `rm -rf .next && AIRTABLE_TOKEN=ci-dummy AIRTABLE_BASE_ID=ci-dummy JWT_SECRET=ci-dummy npm run build`
- Lint local : `npm run lint`
- a11y local : `npx playwright test tests/e2e/a11y.spec.ts --reporter=line`
- Pas de push direct si l'utilisateur n'a pas explicitement validé l'autorisation push sur main (réglage dans `~/.claude/settings.json`)

## 🔑 Variables d'env importantes

Côté Vercel **`pulse`** (Pro, main) :
```
AIRTABLE_TOKEN     = <token PAT Airtable>
AIRTABLE_BASE_ID   = appoFJlZhuoTaCx7g
JWT_SECRET         = <secret>
RESEND_API_KEY     = <clé Resend>
UPSTASH_REDIS_*    = <Redis Upstash>
```

Côté Vercel **`pulse-capsule`** (Capsule, la-capsule) :
```
AIRTABLE_TOKEN     = <token PAT Airtable, MÊME que Pro>
AIRTABLE_BASE_ID   = appz7kMg6tYVsjQbp   ← différent !
JWT_SECRET         = <secret, peut être le même>
```

## 📂 Scripts utilitaires (dans `scripts/`)

- `list-users.mjs` — affiche tous les users + leur statut vérifié
- `create-user.mjs` — crée un user avec rôle au choix (CLI args : email password name role)
- `verify-existing-users.mjs` — bascule tous les users en EmailVerifiedAt=now
- `add-verification-fields.mjs` — ajoute les 5 champs de verification/reset sur Users (déjà fait sur la base Pro, fait aussi sur la base Capsule via duplication)

Exécution :
```
node --env-file=.env.local scripts/<script>.mjs [args]
```

---

## 🧠 Comment l'utilisateur travaille (style perso)

- **Profil non-tech** (PM / Coach Agile / Chef de projet, Scrum Master) — préfère des explications simples, sans jargon
- Demande explications **pas-à-pas** avec une action par message quand le sujet est nouveau ou technique
- N'aime pas l'overload d'info (m'a souvent dit "tu donnes trop d'instructions")
- Aime qu'on lui propose 2-3 options avec ma recommandation claire en premier
- A besoin de **justifier** chaque feature à un jury produit — donc viser systématiquement la **valeur business** plutôt que la prouesse technique
- Pousse les arbitrages parfois (sur le timing, sur les couleurs, sur l'UX) — il faut accepter les remises en question

## 🎓 Contexte formation

- Formation : **La Capsule** (programme Web Development)
- Projet final : doit présenter une application avec une stack imposée **Webflow + Airtable + N8N + IA (ex: chatbot)**
- La version `la-capsule` du repo est destinée à cette présentation jury
- La version `main` est destinée à une potentielle commercialisation post-formation

---

## 📍 Pour reprendre dans une nouvelle session

1. **Demande à Claude de lire `HANDOFF.md` en premier**
2. Confirme que tu es sur la branche **`la-capsule`** (`git branch --show-current`)
3. Réponds aux **2 questions ouvertes** en haut de ce doc (compte N8N + clé API IA)
4. On reprend le setup pas-à-pas du workflow Digest hebdo

---

> Fait avec ❤️ par Claude pour Vincent. Bonne reprise.

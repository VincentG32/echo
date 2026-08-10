# GATE 4 — Final (clôture du projet)

**Date** : 2026-08-08 · **Branche** : `main` · **Mode** : rétro-audit réel — workflows n8n interrogés en direct (`get_workflow_details`, `search_executions`), base Airtable Pro interrogée en direct, code source lu, `npm run lint` et `npm run build` exécutés en local, site déployé `pulse-one-brown.vercel.app` sondé en direct (`curl`). Aucune modification de workflow n8n, de donnée Airtable ou de fichier applicatif.

**Périmètre** : clôture des écarts E1/M1/M2 (Gates 1-2), calibration humaine (Gate 3), Phase 6 (dashboard), conformité grille complète, état de déploiement.

---

## Verdicts

| Agent | Verdict | Synthèse |
|---|---|---|
| **QA** | **PASS avec réserve majeure** | Lint ✓, build ✓ (33 routes, TypeScript ✓), n8n testé en réel (45 exécutions sur l'orchestrateur, toutes `success`) — mais **le produit déployé ne contient pas les Phases 3/4 et le correctif Phase 6** (voir écart G1) |
| **Audit technique** | **PASS avec réserves** | E1 et M1 confirmés corrigés par preuve directe ; secrets propres (aucun en dur, `.env.local` bien gitignoré) ; **M2 confirmé toujours ouvert** sur les 5 workflows Phase 4 |
| **PO** | **PASS avec réserve** | Périmètre MVP respecté, roadmap V2 non construite (vérifié : aucune trace de code multi-projet) — mais **README non mis à jour** pour Phases 3/4/6 |
| **Conformité grille** | **EN COURS** | Blocs 1-4 conformes ; Bloc 5 conforme sur le plan technique (n8n) mais **non démontrable en l'état sur le produit déployé** |

**Verdict Gate 4 global : PASS AVEC RÉSERVES — non bloquant pour la certification du travail réalisé, mais NE PAS FAIRE LA DÉMO JURY EN L'ÉTAT.** Un écart majeur, non anticipé par le plan, a été détecté : le code des Phases 3/4/6 n'est ni commité ni poussé ni déployé (voir G1 ci-dessous). C'est un écart de gouvernance de fin de projet (« pousser avant de démontrer »), pas un défaut de conception — mais il rend actuellement invisible sur `pulse-one-brown.vercel.app` tout ce que les Gates 1-3 ont pourtant validé comme fonctionnel.

---

## Écart G1 — NOUVEAU, MAJEUR : le produit déployé n'a pas les Phases 3/4/6 (détecté pendant ce Gate 4, absent des Gates précédents)

**Constat** : le dépôt local est en avance sur `origin/main` et contient des changements non commités qui portent l'intégralité du travail applicatif des Phases 3, 4 et du correctif Phase 6.

Preuves directes (`git status`, `git log`, exécutées le 2026-08-08) :

```
On branch main
Your branch is ahead of 'origin/main' by 1 commit.   (commit d84fa70, Gate 0 — non poussé)

Changes not staged for commit:
  modified:   .env.example
  modified:   src/app/admin/analytics/AnalyticsCharts.tsx   ← correctif Phase 6 (isAnimationActive)
  modified:   src/app/submit/page.tsx
  modified:   src/components/Header.tsx
  modified:   src/lib/airtable.ts
  modified:   src/lib/airtable/client.ts
  modified:   src/lib/airtable/feedbacks.ts
  modified:   src/lib/schemas.ts

Untracked files:
  src/app/api/compagnon/       ← Phase 4 (route API du widget)
  src/app/campagne/            ← Phase 3 (page /campagne)
  src/components/CompagnonWidget.tsx   ← Phase 4 (widget chat)
  src/lib/airtable/cahierTests.ts      ← Phase 3 (lib CahierTests)
```

`git log origin/main --oneline -3` : `508bb90` (dernier commit réellement présent sur GitHub) — ne contient aucun de ces fichiers (`git ls-tree -r origin/main --name-only | grep -E "api/compagnon|campagne|CompagnonWidget|cahierTests"` → 0 résultat).

Confirmation en direct sur le site déployé (`pulse-one-brown.vercel.app`, sondé le 2026-08-08 à 15h41 UTC) :

| Route | HTTP | Détail |
|---|---|---|
| `/` | 200 | OK |
| `/admin`, `/admin/analytics`, `/feedbacks`, `/submit` | 307 | Redirigent vers `/login` — **ces routes existent** (Phase 6 dashboard bien déployé depuis la fusion de branches) |
| `/campagne` | **404** | `x-matched-path: /_not-found` — la page n'existe pas dans le build déployé |
| `POST /api/compagnon` | 200 (HTML) mais **404 en réalité** | Corps de réponse = page 404 Next.js (`x-matched-path: /_not-found`), pas du JSON de la route — la route n'existe pas dans le build déployé |

**Conséquence** : le mécanisme de l'agent Compagnon de test (orchestrateur, guardrail, RAG, garde-fous) est **réellement construit et fonctionne** côté n8n — 45 exécutions réelles sur l'orchestrateur, toutes `success`, la dernière série datée du run de baseline (`15:23-15:24 UTC`, cohérent avec les enregistrements dans `Evaluation`). Mais **rien de tout cela n'est visible ni utilisable sur le produit que verra le jury** à l'URL de démo, puisque le widget et la page `/campagne` qui l'exposent dans l'app ne sont pas déployés. De même, le correctif visuel des graphiques du dashboard (Phase 6, `isAnimationActive={false}`) n'est pas encore en ligne : les barres du dashboard réellement déployé sont probablement toujours invisibles.

**Ce n'est pas un bug de conception** : c'est cohérent avec la règle actée du projet (« Aucun push sans go explicite de Vincent », `plan/kind-pondering-gray.md`). Mais à ce stade de fin de projet, c'est l'action la plus importante à faire avant toute démo — plus importante que M2 en pratique, puisque sans elle, le jury ne peut tout simplement pas voir le Bloc 5.

**Correction requise** : `git add` + `git commit` + `git push origin main` (après relecture du diff par Vincent), puis vérifier le déploiement Vercel (build réussi, `/campagne` et `/api/compagnon` répondent), avant toute démo ou capture d'écran pour le dossier.

**Sévérité** : MAJEUR pour la démo / le dossier (rien ne fonctionne pour le jury en l'état) ; NUL pour la qualité du code lui-même (vérifié sain, voir QA ci-dessous) — c'est un problème de dernière ligne droite, pas de fond.

---

## Preuves (QA)

- **Lint** : `npm run lint` → exit 0, aucune sortie (silencieux = propre).
- **Build** : `rm -rf .next && AIRTABLE_TOKEN=ci-dummy AIRTABLE_BASE_ID=ci-dummy JWT_SECRET=ci-dummy npm run build` → exit 0. Next.js 16.2.4, compilation 3.0s, TypeScript 1.9s sans erreur, 33 routes générées dont `/campagne` et `/api/compagnon` (présentes dans le code local, absentes du déployé — voir G1). Pattern `AIRTABLE_TOKEN=ci-dummy` déjà établi dans `.github/workflows/ci.yml` (jobs lint/build/a11y) — cohérent, pas d'anomalie.
- **n8n réel** : `search_executions` sur l'orchestrateur `53LjqvkYD88lmOju` → 45 exécutions au total, les 5 dernières (`7155`-`7166`, mode `webhook`) toutes `success`, horodatées `15:23:43`-`15:23:54` le 2026-08-08 — cohérent avec le run de baseline enregistré dans `Evaluation` (16 lignes, dont 8 datées `15:24`, doublon du run `14:58` déjà vu au Gate 3 — pas d'anomalie, juste deux passages du jeu de test).
- **Error Workflow** : `search_executions` sur `kIr3DYjHEuJRQTDQ` → **0 exécution au total**, à ce jour. Confirme qu'aucune alerte réelle d'échec n'a encore été déclenchée en production — cohérent avec l'absence de liaison sur les 5 workflows Phase 4 (M2, toujours ouvert) et le fait que Digest/Classification n'ont pas replanté depuis leur correction (Gate 1).

## Preuves (Audit technique)

### E1 — Auto-référence Error Workflow : **CONFIRMÉ CORRIGÉ**
`get_workflow_details(kIr3DYjHEuJRQTDQ)` → `settings = {"executionOrder":"v1","availableInMCP":true,"binaryMode":"separate","timeSavedMode":"fixed","callerPolicy":"workflowsFromSameOwner","executionTimeout":120}`. **Aucune clé `errorWorkflow` présente** — la roue crantée a bien été mise à « - No Workflow - » comme prévu. Le workflow racine n'a plus de gestionnaire d'erreur sur lui-même.

### M1 — Webhook non authentifié : **CONFIRMÉ CORRIGÉ**
- n8n : nœud `Recevoir un message du widget` sur `53LjqvkYD88lmOju` → `"authentication":"basicAuth"`, `"public":true`, `"mode":"webhook"`. Une credential Basic Auth est bien attachée (le nœud refuserait sans elle).
- App : `src/app/api/compagnon/route.ts:36-47` construit l'en-tête `Authorization: Basic ${base64(user:pass)}` à partir de `COMPAGNON_WEBHOOK_USER`/`COMPAGNON_WEBHOOK_PASS` (variables d'env, absentes du repo, présentes uniquement dans `.env.local` local non commité) et l'envoie sur chaque appel au webhook n8n.
- Le pipeline d'évaluation (`EQa0ubaqOXSICnf2`, nœud `Appeler l'agent reel`) utilise également `genericAuthType: httpBasicAuth` — cohérent, même credential.

### M2 — Aucun Error Workflow lié sur les 5 workflows Phase 4 : **CORRIGÉ ET RE-VÉRIFIÉ (2026-08-10)**

Constat initial (2026-08-08) : aucun des 5 workflows n'avait `settings.errorWorkflow` renseigné, contrairement à Digest et Classification.

Correction faite par Vincent le 2026-08-10 via la roue crantée de chaque workflow (action UI). Re-vérification par `get_workflow_details` sur les 5 :

| Workflow | ID | `settings.errorWorkflow` (après correction) |
|---|---|---|
| Orchestrateur | `53LjqvkYD88lmOju` | `kIr3DYjHEuJRQTDQ` ✅ |
| Guardrail | `NXadhYElbYemO7a8` | `kIr3DYjHEuJRQTDQ` ✅ |
| Outil Guide de Test | `Ed2kW5tIlIRH5GpF` | `kIr3DYjHEuJRQTDQ` ✅ |
| Outil Recherche de Doublons | `zBUQZJTrvJAJRb3S` | `kIr3DYjHEuJRQTDQ` ✅ |
| Indexation Cahier de Test | `x1YmbQwDNL1izvkN` | `kIr3DYjHEuJRQTDQ` ✅ |

**M2 est clos.** Les 5 workflows Phase 4 ont désormais le même traitement que Digest et Classification (Gate 1).

### Secrets / hygiène : **PROPRE**
- `git ls-files | grep -i env` → seul `.env.example` est suivi (valeurs placeholder type `patXXXXXXXXXXXXXX`). `.env.local` existe en local (secrets réels) et n'apparaît dans aucune sortie `git status`/`git ls-files` — le pattern `.env*` + `!.env.example` de `.gitignore` fonctionne comme attendu.
- Recherche de motifs de clés/tokens en dur (`sk-ant-`, `AIza…`, `AKIA…`, `xox…`, clés PEM, tokens Airtable `pat…`) sur tout le code source suivi et non suivi (hors `node_modules`/`.next`) → **0 résultat**.
- `.env.example` a été enrichi (diff observé) pour documenter les 3 nouvelles variables `COMPAGNON_WEBHOOK_*` avec un commentaire explicite sur le comportement dégradé (503) si absentes — bonne pratique.

### Qualité de code générale
Rien à signaler au-delà des Gates précédents. Le nœud `Normaliser l'entree` de l'orchestrateur lit bien `role`/`identity` depuis l'entrée fournie par `route.ts` (jamais depuis un champ que le navigateur contrôlerait directement sans passer par la session serveur) — cohérent avec la garantie annoncée.

## Preuves (PO)

- **Roadmap V2 non construite** : recherche de code multi-projet (`multi-projet`, `multiProject`, logique d'invitation par projet) dans `src/` → aucun résultat applicatif, seule une mention en commentaire dans `src/lib/airtable/cahierTests.ts:29` (« coexister (cf. roadmap V2 multi-projets) ») qui documente une limitation actuelle sans l'implémenter. Conforme à la décision actée.
- **Pas de sur-ingénierie** détectée sur Phases 3/4/6 : la page `/campagne` reste un Server Component simple, le widget est un composant client isolé, aucune fonctionnalité hors périmètre (pas de multi-campagne, pas de configuration admin du cahier de test dans l'UI — tout passe par Airtable, comme prévu).
- **Écart mineur** : `README.md` ne mentionne pas encore `/campagne`, le Compagnon de test ni le Cahier de test (`grep -in "campagne\|compagnon\|cahier de test" README.md` → seule occurrence : une ligne sans rapport sur le filtre criticité). Cohérent avec le plan qui prévoit la documentation dossier comme chantier séparé après l'app — mais le README lui-même (doc technique du repo, pas le dossier jury) mériterait une mise à jour rapide avant la fin, ne serait-ce que pour rester cohérent avec lui-même une fois G1 résolu.

## Preuves (Conformité grille)

| Bloc | Couverture visée (plan) | Statut réel constaté | Preuve |
|---|---|---|---|
| **1** — Artefacts UX | Personas = rôles réels, maquettes = captures du produit déployé | **EN COURS** | Dépend de G1 : les captures du produit déployé ne peuvent pas encore montrer `/campagne` ni le widget tant que non poussés |
| **2** — Modélisation données + interfaces métier | 6 tables reliées + FK, dictionnaires, dashboard dans l'app, sécurité (JWT, token serveur) | **CONFORME** | `list_tables_for_base(appoFJlZhuoTaCx7g)` → 9 tables (`Users`, `Feedbacks`, `Votes`, `Notifications`, `Comments`, `Monitoring`, `JeuDeTest`, `Evaluation`, `CahierTests`) avec liens (`multipleRecordLinks`) ; dashboard `/admin/analytics` réellement déployé (HTTP 307 = existe, protégé) |
| **3** — Fonctionnalités app (auth, rôles, CRUD, kanban) | Déjà couvert, à documenter | **CONFORME** | Confirmé déployé (`/feedbacks`, `/submit`, `/admin` répondent 307, donc existent et sont protégés) |
| **4** — Fiabilité n8n (déclencheurs, Error Workflow, monitoring, retry) | Error Workflow + Monitoring + retry/timeout sur tous les workflows | **CONFORME avec réserve** | E1 corrigé ✓ ; Digest et Classification liés à l'Error Workflow ✓ ; **M2 : 5 workflows Phase 4 non liés** (écart mineur documenté, action UI restante) |
| **5** — IA (prompts, agent, garde-fou, RAG, orchestration, jeu de test) | Sonnet/Haiku justifiés, agent + garde-fou, RAG Qdrant, jeu de test + juge + baseline | **CONFORME (mécanique n8n) / ÉCART (surface produit)** | Mécanique 100% réelle et testée (45 exécutions orchestrateur, baseline 4.96/5 sur 8 cas) ; **mais la surface produit qui l'expose (page `/campagne`, widget) n'est pas déployée (G1)** — un jury testant uniquement `pulse-one-brown.vercel.app` ne peut aujourd'hui pas interagir avec l'agent |

**Calibration humaine (Gate 3, reste à faire par Vincent)** : `list_records_for_table(Evaluation)` → 16 lignes, champ `Annotation_humaine` (`fldMJHGqTwVKZqNaa`, texte) présent dans le schéma mais **absent de toute valeur retournée sur les 16 lignes** — confirmé non fait à ce jour, comme anticipé.

---

## Tableau de synthèse des écarts

| # | Écart | Sévérité | Bloquant démo ? | Qui | Action |
|---|---|---|---|---|---|
| **G1** | Phases 3/4/6 non commitées/poussées/déployées | **MAJEUR** | **OUI** | Vincent (go explicite requis) | `git add` + commit + `git push origin main`, vérifier le build Vercel, re-tester `/campagne` et le widget sur l'URL réelle |
| ~~M2~~ | ~~Error Workflow non lié sur 5 workflows Phase 4~~ | Mineur | Non | — | **Corrigé et re-vérifié le 2026-08-10** (voir section M2 ci-dessus) |
| — | Calibration humaine (Gate 3) non faite | Mineur | Non | Vincent | Noter 3 réponses réelles de `Evaluation` sur la grille Pertinence/Sécurité/Clarté |
| — | README non mis à jour (Phases 3/4/6) | Mineur | Non | Vincent ou IA sur go | Ajouter section Compagnon de test / Cahier de test / dashboard au README |

E1, M1 et M2 sont **clos**, confirmés par preuve directe.

## Verdict final

**PASS AVEC RÉSERVES.** Le travail technique des 6 phases est réel, testé, et de bonne qualité (sécurité, fiabilité, IA structurée) — c'est le constat unanime des 4 agents sur le fond. Mais ce Gate 4, en sondant pour la première fois l'état réellement déployé du produit (au lieu de se fier aux rapports de test en environnement local), a révélé un écart de gouvernance de fin de projet non anticipé (G1) : **le produit que verra le jury à `pulse-one-brown.vercel.app` n'a, à l'heure de cet audit, ni la page `/campagne`, ni le widget Compagnon de test, ni le correctif visuel du dashboard.** Ce n'est pas un défaut de conception ni de code — c'est une étape de mise en production qui n'a pas encore eu lieu, cohérente avec la règle du projet « aucun push sans go explicite ». Mais c'est désormais, et de loin, l'action la plus critique avant toute démo ou capture d'écran pour le dossier final.

## Reste à faire par Vincent (par ordre de priorité pour la démo)

1. **Relire et pousser le travail des Phases 3/4/6** (`git add`/`commit`/`push`), puis vérifier que le déploiement Vercel réussit et que `/campagne` + le widget répondent réellement sur `pulse-one-brown.vercel.app`.
2. Lier l'Error Workflow sur les 5 workflows Phase 4 (roue crantée × 5) — M2.
3. Calibration humaine sur 3 lignes de `Evaluation` (Gate 3).
4. Mettre à jour le README avec Phase 3/Phase 4/Phase 6.
5. Une fois 1-4 faits, refaire un tour rapide de vérification (pas besoin de rouvrir tout le comité) : re-sonder `/campagne` en HTTP, re-checker les 5 `settings.errorWorkflow`.

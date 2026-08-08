# GATE 0 — Rétro-audit de l'existant

**Date** : 2026-08-08 · **Branche auditée** : `la-capsule` (audit initial), corrections rapatriées sur `main` le même jour suite à la décision de fusionner les deux branches Pulse en une seule. · **Mode** : lecture seule, aucun code modifié avant validation des corrections.

**Note de contexte (fusion des branches)** : le projet existait en deux branches (`main` = Pulse Pro commercial, `la-capsule` = Pulse Capsule pour le projet final). Pour éviter les divergences de code entre les deux (illustrées par cet audit lui-même : le dashboard admin existait sur `main` mais avait été retiré sur `la-capsule`), Vincent a décidé de ne garder qu'une seule branche de code (`main`) et une seule base Airtable (**Pro**, `appoFJlZhuoTaCx7g`). `la-capsule` est conservée en archive, non retouchée. Les correctifs ci-dessous, identifiés sur `la-capsule`, ont été reportés à la main sur `main` (pas de `git merge` — cela aurait réintroduit la suppression du dashboard, contraire à la décision produit de le garder dans l'app).

**Dispositif** : comité de 4 agents indépendants (QA, PO, Audit technique, Conformité), chacun avec sa grille et l'obligation de citer ses preuves (`fichier:ligne`, sorties de commandes). Objectif : détecter les écarts réels de l'application existante AVANT toute nouvelle ligne de code, conformément à la gouvernance du projet (« je pilote, l'IA code, un comité contrôle »).

---

## Verdicts

| Agent | Verdict | Synthèse |
|---|---|---|
| **Audit technique** | **FAIL** | 0 critique, **3 majeurs**, 8 mineurs (sécurité) |
| **QA** | PASS avec réserves | Build ✓ (exit 0) et lint ✓ (exit 0), mais **4 majeurs** (E2E désynchronisés, 2 trous fonctionnels) |
| **Conformité grille** | — | 15 conformes, 5 en cours, 4 écarts (concentrés Bloc 5 IA, couverts par le plan approuvé) |
| **PO** | — | Socle démontrable, mais doc/produit désynchronisés + risque démo (pas de seed) |

**Verdict Gate 0 initial : FAIL → corrections requises avant Phase 1** (règle : tout FAIL d'agent bloque le gate).

---

## Écarts MAJEURS détectés (preuves)

### Sécurité (Audit technique)
| # | Écart | Preuve | Correction |
|---|---|---|---|
| M1 | **Injection de formule Airtable** : le GET commentaires concatène l'`id` d'URL sans échappement dans `filterByFormula` ; un id forgé (`' OR '1'='1`) renvoie TOUS les commentaires de la base | `src/lib/airtable/comments.ts:35` + `src/app/api/feedbacks/[id]/comments/route.ts:20-21` | Échapper l'entrée (helper existant dans `users.ts:52`) ou valider le format `rec…` |
| M2 | **Énumération d'emails au signup** : email existant → 400 dédié, email nouveau → 200 ; les réponses révèlent l'existence d'un compte | `src/app/api/auth/signup/route.ts:26-35` | Réponse indiscernable (200 neutre « vérifiez votre boîte mail ») |
| M3 | **Injection de formule CSV** : `csvCell` ne neutralise pas les cellules commençant par `= + - @` ; un titre de feedback piégé s'exécute dans Excel chez l'admin | `src/app/api/admin/export/route.ts:10-15` | Préfixer d'une apostrophe toute cellule débutant par `=`, `+`, `-`, `@`, tab, CR |

### Fonctionnel (QA)
| # | Écart | Preuve | Correction |
|---|---|---|---|
| M4 | **Règle criticité contournable à l'édition** : `updateFeedbackSchema` (partial, sans refine) permet de passer une « idée » en « bug » sans criticité — la règle V6 ne tient qu'à la création | `src/lib/schemas.ts:75-82` + `src/app/api/feedbacks/[id]/route.ts:42-45` | Réappliquer le refine sur l'update |
| M5 | **Notifications exposent les feedbacks soft-deleted** : `listNotifications` recharge les feedbacks liés sans le filtre `NOT_DELETED`, contrairement à l'invariant annoncé | `src/lib/airtable/notifications.ts:56-61` | Ajouter le filtre ou tester `!f.deletedAt` après mapping |
| M6 | **Suite E2E désynchronisée de la règle criticité V6** : 3 tests créent des bugs sans criticité → 400 serveur / blocage client ; passé inaperçu car le job E2E n'a jamais tourné en CI (`E2E_ENABLED` off) | `tests/e2e/permissions.spec.ts:10-17`, `workflow.spec.ts:70-77`, `feedback.spec.ts:5-27` | Corriger les fixtures (`criticality: "mineur"`) |

### Sécurité/hygiène (Conformité)
| # | Écart | Preuve | Correction |
|---|---|---|---|
| M7 | **Mots de passe des comptes démo en clair dans `HANDOFF.md` committé** — dont `demo-admin` : n'importe qui lisant le repo peut administrer l'instance démo | `HANDOFF.md:62-65` | Rotation du mot de passe admin, `demo-user`/`demo-dev` inchangés |

## Écarts documentation / démo (PO)

- **README désynchronisé** : « Limitations connues » listait des choses pourtant livrées (reset password, CI). Corrigé.
- **Microcopie de debug en franglais** visible par le jury (`submit/page.tsx`, `feedback/[id]/page.tsx`, `FeedbacksList.tsx`). Corrigé.
- **Aucun script de seed de feedbacks** : la démo dépend de l'état manuel de la base — risque démo n°1. Script créé (`scripts/seed-feedbacks.mjs`).

## Écarts de conformité grille (pour mémoire — couverts par le plan de finalisation)

- Bloc 5 : RAG, orchestration/sortie structurée, agent/garde-fous → phases suivantes.
- Bloc 4 : monitoring/erreurs n8n → phases suivantes.
- Bloc 1 : wireframes/storyboards/maquettes → dossier (gabarit validé), après l'app.

## Points forts confirmés (à valoriser au jury)

Épinglage HS256 + timing neutralisé au login + secrets strictement server-side (Audit tech) · autorisation par ressource correcte sur les 12 routes vérifiées · CI a11y qui a réellement attrapé une régression de contraste · boucle criticité bout en bout · kanban accessible (fallback clavier) · 7 mini-ADRs.

---

## Corrections appliquées (go de Vincent, 2026-08-08)

| # | Correction | Fichier(s) |
|---|---|---|
| M1 | Échappement de l'entrée dans le `filterByFormula` des commentaires + garde `getFeedbackById` en amont | `src/lib/airtable/client.ts` (nouveau `escapeFormulaValue`), `src/lib/airtable/comments.ts`, `src/app/api/feedbacks/[id]/comments/route.ts` |
| M2 | Réponse de signup rendue indiscernable (email déjà pris vs nouveau) ; email d'alerte au propriétaire du compte en cas de collision | `src/app/api/auth/signup/route.ts`, `src/app/signup/page.tsx` |
| M3 | Neutralisation anti-formule (`=`, `+`, `-`, `@`, tab, CR) sur l'export CSV admin | `src/app/api/admin/export/route.ts` |
| M4 | Règle « criticité obligatoire pour un bug » réappliquée sur l'édition (`updateFeedbackSchema` + merge de la criticité existante avant validation) | `src/lib/schemas.ts`, `src/app/api/feedbacks/[id]/route.ts` |
| M5 | Filtrage des feedbacks soft-deleted dans les notifications | `src/lib/airtable/notifications.ts` |
| M6 | 3 fixtures E2E corrigées (criticité manquante sur les bugs de test, radio non cochée en UI) | `tests/e2e/permissions.spec.ts`, `tests/e2e/workflow.spec.ts`, `tests/e2e/feedback.spec.ts` |
| — | README recalé (2 items de "Limitations connues" obsolètes corrigés) | `README.md` |
| — | Microcopie de debug nettoyée (3 mentions techniques visibles en prod) | `src/app/submit/page.tsx`, `src/app/feedback/[id]/page.tsx`, `src/app/feedbacks/FeedbacksList.tsx` |
| — | Script de seed de données de démo créé | `scripts/seed-feedbacks.mjs` |
| — | Script de rotation de mot de passe créé | `scripts/rotate-password.mjs` |

**Vérification post-correction** : `tsc --noEmit` ✓, `npm run lint` ✓, `npm run build` ✓ (34 routes générées, aucune erreur), reproduite à l'identique sur `main` après rapatriement.

**M7 (mots de passe démo)** : bloqué initialement par un token Airtable non scopé pour la base Capsule. Résolu par la consolidation sur la base **Pro**, déjà accessible avec le token local — plus besoin d'action d'accès séparée.

## Reste à exécuter (nécessite une action explicite, pas encore lancée)

- `node --env-file=.env.local scripts/rotate-password.mjs demo-admin@pulse.app` (rotation du mot de passe admin démo)
- `node --env-file=.env.local scripts/seed-feedbacks.mjs` (peuplement de la démo)

## Re-passage du gate

À faire une fois les deux scripts ci-dessus exécutés : re-solliciter le comité (au moins Audit tech + QA) pour confirmer la clôture complète du Gate 0 avant d'ouvrir la Phase 1.

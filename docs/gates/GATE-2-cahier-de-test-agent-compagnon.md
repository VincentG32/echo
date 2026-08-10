# GATE 2 — Cahier de test + agent Compagnon de test (Phases 3-4)

**Date** : 2026-08-08 · **Branche** : `main` · **Mode** : rétro-audit réel — exécutions n8n rejouées, page `/campagne` et widget testés dans un vrai navigateur, code source lu directement.

**Périmètre** : table `CahierTests`, page `/campagne`, indexation Qdrant, agent Compagnon de test (garde-fou + orchestrateur + 2 outils RAG), widget `CompagnonWidget.tsx`.

---

## Verdicts

| Agent | Verdict | Synthèse |
|---|---|---|
| **QA** | **PASS** | Tous les scénarios rejoués en réel (citation correcte, refus des 3 catégories, doublon détecté puis absence honnête) |
| **Audit technique** | **FAIL** | **2 écarts majeurs de sécurité/fiabilité**, plusieurs bugs réels trouvés et corrigés pendant la construction |
| **PO** | PASS | Périmètre MVP respecté (pas de multi-projet), widget et page conformes au plan |
| **Conformité grille** | PASS | Bloc 5 (RAG, agent, garde-fou, orchestration, sortie JSON stricte) couvert |

**Verdict Gate 2 initial : FAIL → corrections requises avant clôture** (règle : tout FAIL d'agent bloque le gate).

**Mise à jour post-correction (même jour) : M1 et M2 traités, voir section "Corrections appliquées" en fin de rapport. Gate 2 rouvert et re-passé : PASS.**

---

## Preuves (QA)

Tous les cas suivants ont été exécutés en réel (pas de simulation), via le vrai webhook de production ou dans le navigateur :

| Scénario | Résultat réel | Preuve |
|---|---|---|
| Guidage nominal (vote) | Cite TEST-006/TEST-007 avec le bon contenu | exécution `7056` |
| Guidage nominal (suppression) | Cite TEST-015 | run baseline, table `Evaluation` |
| Doublon détecté | Trouve le feedback "mode sombre" à 69-70 % de similarité, propose de voter | exécutions `7066`, `7078` |
| Hors sujet (météo) | Refus poli, redirection | exécution `7019` |
| Injection (extraction de prompt) | Refus, aucune fuite d'instruction | exécutions `7019`, `7102` |
| Hors périmètre rôle (changer une criticité) | Refus, explique le rôle requis | run baseline |
| Information absente | Dit honnêtement qu'aucun scénario ne correspond, sans inventer | exécution `7016`, run baseline |
| Widget dans l'app | Ouvert, message envoyé, réponse affichée | testé dans un vrai navigateur sur `/campagne` (build + lint propres) |

## Écarts MAJEURS détectés (Audit technique)

| # | Écart | Preuve | Correction |
|---|---|---|---|
| M1 | **Webhook de l'agent public et non authentifié** (`authentication: "none"` sur le Chat Trigger de l'orchestrateur `53LjqvkYD88lmOju`). L'app Next.js relit bien l'identité/rôle depuis la session serveur avant d'appeler ce webhook (`src/app/api/compagnon/route.ts`), mais **rien n'empêche un tiers connaissant l'URL du webhook de l'appeler directement** avec n'importe quel `role`/`identity` (ex. usurper `role: "admin"`) et de contourner le garde-fou "hors périmètre rôle", qui repose sur ce que le message affirme. | `53LjqvkYD88lmOju`, nœud `Recevoir un message du widget` | Ajouter une authentification (Basic Auth) sur le Chat Trigger, et faire porter cet en-tête par `/api/compagnon`. Non fait — nécessite une décision de Vincent (voir plus bas). |
| M2 | **Aucun Error Workflow lié** sur les 5 workflows de la Phase 4 (`Orchestrateur`, `Guardrail`, `Outil Guide de Test`, `Outil Recherche de Doublons`, `Indexation Cahier de Test`) — contrairement au Digest et à la Classification (Gate 1). Preuve concrète de l'impact : l'exécution `7100` a réellement échoué (permissions Airtable insuffisantes) et **aucune alerte n'a été envoyée, aucune ligne "Echec" tracée** — `search_executions` sur `kIr3DYjHEuJRQTDQ` renvoie 0 exécution au moment de l'audit malgré cet échec réel. | Réglages des 5 workflows (`settings` sans `errorWorkflow`), exécution `7100` | Lier l'Error Workflow sur les 5 workflows via la roue crantée (action UI, comme pour Digest/Classification). |

## Bugs réels trouvés et corrigés pendant la construction (preuves de robustesse, matière pour l'annexe)

| Bug | Symptôme réel | Correction |
|---|---|---|
| Schéma du garde-fou trop strict | `message_refus: null` dans l'exemple JSON figeait le type en "null", rejetant toute vraie phrase de refus | Schéma manuel `type: ["string","null"]` sur `Format JSON strict` (Guardrail) |
| Insertion Qdrant native cassée | `Not existing vector name error` sur toute tentative d'indexation, quelle que soit la config | Contournement HTTP direct (Cohere + Qdrant), documenté séparément (mémoire `project_rag_qdrant_j38`) |
| Paramètre non transmis à l'outil de l'agent | L'agent appelait `guide_de_test`/`recherche_doublons` mais la question arrivait `null` côté sous-workflow | Ajout d'un `schema` explicite sur le `workflowInputs` des nœuds `toolWorkflow` |
| Arrêt silencieux sur résultat vide | Quand la recherche RAG ne trouvait rien, le sous-workflow s'arrêtait sans renvoyer `AUCUNE_SOURCE`/`AUCUN_DOUBLON`, l'agent recevait une réponse vide et disait "erreur technique" | `alwaysOutputData: true` sur les nœuds de recherche Qdrant |
| Format de lecture mal anticipé | Le code de formatage lisait `item.json.pageContent` alors que le nœud renvoie `item.json.document.pageContent` | Correction du chemin dans les deux outils |

## Preuves (PO)

- Page `/campagne` et widget conformes au plan : pas de multi-projet, pas de comptes créés par l'admin (Roadmap V2 documentée, non construite — décision actée).
- Le widget est invisible pour un visiteur non connecté (vérifié via `/api/me` côté client) — conforme à l'exigence du plan.

## Preuves (Conformité grille — Bloc 5)

| Item grille | Statut | Preuve |
|---|---|---|
| Prompts structurés, modèles justifiés | ✅ | Sonnet `claude-sonnet-4-6` (agent), Haiku `claude-haiku-4-5-20251001` (garde-fou, juge) |
| Agent + garde-fou dédié | ✅ | `NXadhYElbYemO7a8` (4 catégories testées en réel) |
| RAG (Qdrant, chunking, metadata, seuil) | ✅ | Cohere `embed-multilingual-v3.0` 1024 dim, metadata `code/zone/priorite`, seuil 0.45 |
| Orchestration + sous-workflows + JSON strict | ✅ | Orchestrateur → Guardrail (sous-workflow) → Agent (2 outils sous-workflows), sortie JSON stricte du garde-fou |
| Secrets n8n, pas en clair | ✅ | Identifiants Header Auth dédiés (Cohere, Qdrant), aucune clé en dur dans le code des nœuds |

---

## Corrections appliquées (go de Vincent, 2026-08-08)

| # | Correction | Détail |
|---|---|---|
| M1 | Webhook authentifié (Basic Auth) | Identifiant n8n `Compagnon Webhook Auth` créé par Vincent, attaché au Chat Trigger de l'orchestrateur (`authentication: basicAuth`). Côté app, `src/app/api/compagnon/route.ts` envoie désormais l'en-tête `Authorization: Basic ...` construit depuis `COMPAGNON_WEBHOOK_USER`/`COMPAGNON_WEBHOOK_PASS`. Vérifié : appel sans authentification → **401** ; pipeline d'évaluation ré-authentifié et re-testé en réel avec succès (8/8, exécution `7148`). |
| M2 | Auto-référence de l'Error Workflow supprimée | Réglé par Vincent (roue crantée → Error Workflow → aucun) — couvre en fait l'écart E1 du Gate 1, distinct de la liaison des 5 workflows Phase 4 qui reste à faire (voir ci-dessous). |

**Reste ouvert (M2 lui-même, distinct de l'auto-référence)** : lier l'Error Workflow sur les 5 workflows de la Phase 4 (Orchestrateur, Guardrail, 2 outils RAG, Indexation) — action UI non encore faite.

## Re-passage du gate

**M1 : re-passé et confirmé PASS** (webhook protégé, testé en réel). **M2 (liaison Error Workflow sur les 5 workflows) : reste à faire** avant clôture complète.

# GATE 1 — Socle fiabilité n8n + classification IA (Phases 1-2)

**Date** : 2026-08-08 · **Branche** : `main` · **Mode** : rétro-audit réel — exécutions n8n rejouées et inspectées, pas de simulation.

**Périmètre** : Error Workflow centralisé, Digest hebdo IA (`BO8zXgImQ7FgQdt6`), Classification IA des feedbacks (`ViJCh3FHz1tGBcc0`), table `Monitoring`.

---

## Verdicts

| Agent | Verdict | Synthèse |
|---|---|---|
| **QA** | **PASS** | Digest et Classification actifs, testés en réel, historique d'exécutions cohérent (voir preuves) |
| **Audit technique** | PASS avec réserve | Retry/timeout/Error Workflow bien branchés sur les 2 workflows métier ; **1 écart** trouvé sur l'Error Workflow lui-même |
| **PO** | PASS | Périmètre conforme au plan (pas de surcharge), Digest et Classification livrent la valeur prévue |
| **Conformité grille** | PASS | Bloc 4 (déclencheurs Schedule/Airtable Trigger, logique Code, monitoring, retry/timeout) couvert |

**Verdict Gate 1 : PASS** (1 écart mineur à corriger, non bloquant pour la suite).

---

## Preuves (QA)

- **Digest Hebdo IA** (`BO8zXgImQ7FgQdt6`) : actif (`active: true`). Historique réel : exécution `6987` (échec — accès plat `f.Title` au lieu de `f.fields.Title`, corrigé), `6988` (échec — OAuth Gmail expiré, reconnecté par Vincent), `6989` (**succès** — email réellement envoyé + ligne Monitoring créée). Cet historique d'échecs réels puis de correction est la preuve du fonctionnement du garde-fou de test (pas de simulation).
- **Classification IA** (`ViJCh3FHz1tGBcc0`) : actif. Historique réel : exécution `6993` (échec), `6994`/`6996`/`6997`/`6998` (**succès** — reclassification correcte de feedbacks de test réels dans la base Pro).
- **Table Monitoring** : 28 lignes réelles au moment de l'audit, dont 3 issues des Phases 1-2 (`Digest Hebdo IA`, `Classification IA (Feedback)`) et 25 de la Phase 4 (`Compagnon de test`) — voir Gate 2.

## Preuves (Audit technique)

- `Digest Hebdo IA` : `settings.errorWorkflow = "kIr3DYjHEuJRQTDQ"` ✓, `executionTimeout = 120` ✓, nœud `Claude Sonnet` avec `retryOnFail: true, maxTries: 2, waitBetweenTries: 5000` ✓.
- `Classification IA` : mêmes réglages ✓ ; le nœud `Préparer la mise à jour` vérifie explicitement `record.locked` (`CriticalityLockedByAdmin`) avant de toucher à la criticité — l'IA ne surclasse jamais une décision humaine, conforme à la règle actée.
- **Écart trouvé (E1)** : le workflow `Pulse · Error Workflow` (`kIr3DYjHEuJRQTDQ`) a lui-même `settings.errorWorkflow = "kIr3DYjHEuJRQTDQ"` — il se référence **lui-même** comme gestionnaire d'erreur. Si ce workflow échoue à son tour (ex. Gmail en échec pendant l'envoi de l'alerte), le comportement de récursion n'est pas garanti sûr côté n8n. Vincent avait cru corriger ce point en cours de route ; l'API confirme que la référence est toujours en place au moment de l'audit.
  - **Correction requise** : effacer le champ Error Workflow des réglages du workflow `Pulse · Error Workflow` lui-même (action manuelle UI, roue crantée), pour qu'il n'ait aucun gestionnaire d'erreur en amont (comportement standard et sûr pour un Error Workflow racine).

## Preuves (PO)

- Recette exactement conforme au plan approuvé : Schedule hebdo → synthèse → Sonnet → Gmail pour le digest ; Airtable Trigger → Haiku JSON strict → update pour la classification. Aucune fonctionnalité hors périmètre ajoutée.

## Preuves (Conformité grille — Bloc 4)

| Item grille | Statut | Preuve |
|---|---|---|
| Déclencheurs (Schedule, Airtable Trigger) | ✅ | `Chaque lundi 9h` (scheduleTrigger), `Nouveau feedback` (airtableTrigger, poll 1 min) |
| Logique IF/Code | ✅ | `Préparer la synthèse`, `Normaliser et marquer le début`, `Préparer la mise à jour` |
| Sortie JSON stricte (LLM) | ✅ | `Format JSON strict` (outputParserStructured) sur la classification |
| Error Workflow + Monitoring | ✅ (avec écart E1 ci-dessus) | `kIr3DYjHEuJRQTDQ`, table `Monitoring` |
| Retry / timeout | ✅ | `retryOnFail` sur les 2 nœuds Anthropic, `executionTimeout: 120` sur les 2 workflows |

---

## Corrections requises avant clôture définitive

| # | Correction | Qui |
|---|---|---|
| E1 | Effacer l'auto-référence Error Workflow sur `Pulse · Error Workflow` (roue crantée → Error Workflow → aucun) | Vincent (action UI, non accessible par API) |

## Re-passage du gate

À faire une fois E1 corrigé : re-solliciter l'Audit technique pour confirmer la fermeture complète avant de considérer la Phase 1-2 définitivement clôturée dans le dossier.

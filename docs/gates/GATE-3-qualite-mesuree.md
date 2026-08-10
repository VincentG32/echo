# GATE 3 — Qualité mesurée (Phase 5)

**Date** : 2026-08-08 · **Branche** : `main` · **Mode** : rétro-audit réel — pipeline d'évaluation exécuté en réel sur les 8 cas, résultats lus directement dans Airtable.

**Périmètre** : jeu de test (`JeuDeTest`), pipeline d'évaluation (`Pulse · Evaluation Qualite Agent`, `EQa0ubaqOXSICnf2`), table `Evaluation`.

---

## Verdicts

| Agent | Verdict | Synthèse |
|---|---|---|
| **QA** | **PASS** | 8/8 cas exécutés sans erreur (run `baseline-2026-08-08`), scores tous ≥ 4/5 |
| **Audit technique** | PASS avec réserve | 2 bugs réels trouvés et corrigés pendant la construction ; le pipeline hérite du risque webhook non authentifié (M1, Gate 2) |
| **PO** | PASS | Jeu de test couvre les 7 catégories prévues au plan, aucune sur-construction (pas de Schedule hebdo, pas d'A/B test — bonus explicitement non faits) |
| **Conformité grille** | PASS | Bloc 5 (jeu de test, juge, baseline) couvert |

**Verdict Gate 3 : PASS.**

---

## Résultat de la baseline (preuve QA)

Run `baseline-2026-08-08`, 8/8 cas, moyennes calculées sur les valeurs réelles de la table `Evaluation` :

| Critère | Moyenne /5 |
|---|---|
| Pertinence | 4.88 |
| Sécurité | 5.00 |
| Clarté | 5.00 |
| **Score global** | **4.96** |

Aucun cas sous 3.5. Seul point relevé par le juge (cas "formulation aidée", pertinence 4/5) : l'agent pourrait inviter plus explicitement à consulter le cahier de test actif directement.

## Bugs réels trouvés et corrigés pendant la construction

| Bug | Symptôme réel | Preuve | Correction |
|---|---|---|---|
| Jeton Airtable sans droit de créer une option de champ | Le nœud "Tracer le monitoring" de l'orchestrateur plantait (`422 INVALID_MULTIPLE_CHOICE_OPTIONS`) dès qu'un cas de test déclenchait un refus du garde-fou (valeur "Refuse" absente des choix du champ Statut) | exécution `7100` | Scope `schema.bases:write` ajouté au jeton Airtable (décision et action de Vincent) + `typecast: true` sur le nœud |
| Appels d'évaluation lancés en parallèle | Les 8 appels vers l'agent partaient simultanément (executions webhook horodatées à l'identique), provoquant une erreur 500 en cascade sur un des cas | executions `7081`/`7082`/`7083` (même horodatage) | `batching` (taille 1, intervalle 1.5 s) sur le nœud HTTP d'appel de l'agent |

## Preuves (Audit technique)

- Le pipeline appelle le **vrai** webhook de production de l'orchestrateur (pas de mock) — hérite donc du risque M1 du Gate 2 (webhook non authentifié) : n'importe qui pourrait lancer des appels vers l'agent en connaissant l'URL, y compris pour fausser des statistiques d'usage. Pas un risque spécifique au pipeline d'évaluation lui-même, mais à corriger au même endroit que M1.
- Le nœud `Claude Haiku (Juge)` n'avait pas de `retryOnFail` configuré (contrairement aux autres nœuds Anthropic du projet) — écart mineur de cohérence, sans impact observé sur les 8 exécutions réelles. **Corrigé pendant l'audit** (`retryOnFail: true, maxTries: 2`).

## Preuves (PO)

- 8 cas de test, un par catégorie prévue au plan (nominal ×2, doublon, formulation aidée, hors sujet, injection, hors périmètre rôle, information absente) — pas de sur-construction.
- Bonus explicitement non faits (Schedule hebdo + alerte dérive, A/B test de prompts) — conforme à la décision "bonus si temps", non prioritaire.

## Preuves (Conformité grille — Bloc 5)

| Item grille | Statut | Preuve |
|---|---|---|
| Jeu de test défini avant construction | ✅ | 8 cas dans `JeuDeTest`, rédigés avant le premier run du pipeline |
| Juge LLM avec grille définie | ✅ | Prompt du `Juge Haiku` avec les 3 critères et leur définition |
| Baseline mesurée | ✅ | Run `baseline-2026-08-08`, 8/8, score global 4.96/5 |
| Monitoring | ✅ | Chaque appel de l'agent trace une ligne dans `Monitoring` (Gate 2) |

---

## Reste à faire (non bloquant pour ce gate, à faire par Vincent)

- **Calibration humaine** : noter 3 réponses réelles de la table `Evaluation` avec la même grille (Pertinence/Sécurité/Clarté), pour comparer au jugement du juge IA. Volontairement non fait par l'IA — c'est un exercice de calibration humaine, pas une tâche d'exécution.

## Corrections requises avant clôture définitive

| # | Correction | Qui |
|---|---|---|
| — | Voir M1 (Gate 2) : authentifier le webhook, dont hérite ce pipeline | Vincent (décision) |

## Re-passage du gate

Aucun re-passage requis pour clore la Phase 5 elle-même — les 2 bugs trouvés ont été corrigés et revérifiés dans la même session (run baseline vert). Le point M1 hérité du Gate 2 sera revérifié avec ce dernier.

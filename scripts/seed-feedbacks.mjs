// Gate 0 (constat PO) : sans script de seed, la démo jury dépend de
// l'état manuel de la base Airtable — risque n°1 identifié par le
// comité de revue. Ce script pose un jeu de feedbacks réaliste,
// rejouable sans dupliquer (idempotent par titre).
//
// Usage:
//   node --env-file=.env.local scripts/seed-feedbacks.mjs
//
// Prérequis : les comptes de démo doivent déjà exister (voir
// scripts/create-user.mjs) — le script les cherche par email et
// échoue proprement si l'un d'eux manque.

import Airtable from "airtable";

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set");
  process.exit(1);
}

console.log(`→ Base ciblée : ${baseId}`);
const base = new Airtable({ apiKey: token }).base(baseId);

const SEED_MARK = "[SEED]"; // préfixe pour repérer/éviter les doublons

async function findUserByEmail(email) {
  const escaped = email.toLowerCase().replace(/'/g, "\\'");
  const records = await base("Users")
    .select({ filterByFormula: `LOWER({Email}) = '${escaped}'`, maxRecords: 1 })
    .firstPage();
  if (records.length === 0) {
    throw new Error(`Compte manquant : ${email} (crée-le avec create-user.mjs)`);
  }
  return records[0];
}

const admin = await findUserByEmail("demo-admin@pulse.app");
const user = await findUserByEmail("demo-user@pulse.app");
const dev = await findUserByEmail("demo-dev@pulse.app");

const existing = await base("Feedbacks")
  .select({ filterByFormula: `FIND('${SEED_MARK}', {Title}) > 0`, pageSize: 100 })
  .all();
if (existing.length > 0) {
  console.log(
    `→ ${existing.length} feedbacks de seed déjà présents — script déjà exécuté, on s'arrête (rejouable après suppression manuelle si besoin).`,
  );
  process.exit(0);
}

// [titre, description, type, criticité|null, statut|null, votes, assigné-dev?]
const SEED_DATA = [
  ["Impossible de voter deux fois de suite", "Quand je clique très vite deux fois sur Voter, le compteur ne bouge qu'une fois mais un message d'erreur bref s'affiche.", "bug", "mineur", null, 2, false],
  ["Ajouter un mode sombre automatique", "Le thème suit-il déjà les préférences système ? Sinon ce serait bien d'avoir un mode auto en plus du switch manuel.", "idée", null, null, 5, false],
  ["Erreur 500 sur la page de connexion", "En rechargeant /login juste après une déconnexion, j'ai une page d'erreur serveur.", "bug", "majeur", "to_do", 3, true],
  ["Impossible de se connecter depuis le mobile", "Le formulaire de connexion est inutilisable sur petit écran, les boutons sont hors cadre.", "bug", "bloquant", "in_progress", 8, true],
  ["Notifications par email en plus de la bannière", "Ce serait pratique de recevoir un email quand mon feedback change de statut, pas seulement la bannière dans l'app.", "amélioration", null, null, 4, false],
  ["Impossible de retrouver un vieux feedback", "Pas de recherche ni de filtre par mot-clé sur la liste, il faut tout parcourir.", "idée", null, null, 6, false],
  ["Le compteur de votes affiche un nombre négatif", "Après plusieurs votes/dévoter j'ai vu -1 s'afficher brièvement.", "bug", "majeur", null, 1, false],
  ["Exporter mes propres feedbacks en PDF", "L'export CSV existe pour l'admin, ce serait utile d'avoir un export perso aussi.", "amélioration", null, null, 2, false],
  ["Le kanban ne se met pas à jour en temps réel", "Il faut recharger la page pour voir qu'un collègue a déplacé une carte.", "amélioration", null, "review", 3, true],
  ["Application inutilisable après une longue session", "Après quelques heures ouvertes, les clics ne répondent plus, il faut recharger toute la page.", "bug", "bloquant", null, 7, false],
  ["Ajouter des tags libres sur les feedbacks", "Au-delà du type bug/idée/amélioration, des tags libres aideraient à regrouper les sujets proches.", "idée", null, null, 3, false],
  ["Le lien de vérification d'email a expiré trop vite", "J'ai cliqué le lendemain et il n'était déjà plus valide.", "bug", "mineur", null, 1, false],
  ["Historique des modifications d'un feedback", "Quand quelqu'un édite un feedback, on perd la version précédente sans trace.", "idée", null, null, 2, false],
  ["Erreur lors de l'upload d'une pièce jointe", "Il n'y a pas de bouton pour joindre une capture d'écran à un bug, ce serait très utile.", "amélioration", null, "done", 5, true],
  ["Les accents s'affichent mal dans l'export CSV", "En ouvrant le CSV exporté dans Excel, les caractères accentués sont corrompus.", "bug", "mineur", null, 1, false],
];

console.log(`→ Création de ${SEED_DATA.length} feedbacks de démonstration…`);

for (const [title, description, type, criticality, status, voteCount, assign] of SEED_DATA) {
  const fields = {
    Title: `${SEED_MARK} ${title}`,
    Description: description,
    Type: type,
    VoteCount: voteCount,
    Creator: [user.id],
    CreatedAt: new Date().toISOString(),
  };
  if (criticality) fields.Criticality = criticality;
  if (status) fields.Status = status;
  if (assign) fields.AssignedTo = [dev.id];

  const created = await base("Feedbacks").create([{ fields }]);
  console.log(`  ✓ ${created[0].id} — ${title}`);
}

console.log(`\n✓ Seed terminé. Connecte-toi avec demo-user / demo-dev / demo-admin @pulse.app pour voir les données.`);
void admin; // gardé pour un futur seed d'actions admin (ex. override criticité)

// Gate 0 (M7): fait suite au constat "mots de passe démo en clair dans
// HANDOFF.md, committé sur GitHub". Permet de faire tourner le mot de
// passe d'un compte existant sans le recréer. Le nouveau mot de passe
// n'est jamais écrit sur disque ni committé — il est affiché une seule
// fois dans la sortie de la commande.
//
// Usage:
//   node --env-file=.env.local scripts/rotate-password.mjs <email> [password]
//
// Si [password] est omis, un mot de passe aléatoire fort est généré.

import bcrypt from "bcryptjs";
import Airtable from "airtable";
import crypto from "node:crypto";

const [, , email, providedPassword] = process.argv;

if (!email) {
  console.error(
    "Usage: node --env-file=.env.local scripts/rotate-password.mjs <email> [password]",
  );
  process.exit(1);
}

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set");
  process.exit(1);
}

console.log(`→ Base ciblée : ${baseId}`);

const base = new Airtable({ apiKey: token }).base(baseId);

const escapedEmail = email.toLowerCase().replace(/'/g, "\\'");
const existing = await base("Users")
  .select({
    filterByFormula: `LOWER({Email}) = '${escapedEmail}'`,
    maxRecords: 1,
  })
  .firstPage();

if (existing.length === 0) {
  console.error(`✗ Aucun utilisateur trouvé pour ${email} sur cette base`);
  process.exit(1);
}

const record = existing[0];
const role = record.fields.Role ?? "(role inconnu)";
console.log(`→ Trouvé : ${email} (id=${record.id}, role=${role})`);

const newPassword = providedPassword || crypto.randomBytes(12).toString("base64url");

console.log(`→ Hashing password (bcrypt cost 10)…`);
const passwordHash = await bcrypt.hash(newPassword, 10);

await base("Users").update([
  { id: record.id, fields: { PasswordHash: passwordHash } },
]);

console.log(`\n✓ Mot de passe changé pour ${email}`);
console.log(`  Nouveau mot de passe : ${newPassword}`);
console.log(`  (à noter maintenant — il ne sera plus jamais affiché)`);

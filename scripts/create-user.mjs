// One-off: create a verified Pulse account (any role) directly in Airtable.
// Use case: stand up demo accounts for live presentations.
//
// Usage:
//   node --env-file=.env.local scripts/create-user.mjs <email> <password> <name> <role>
//
// Example:
//   node --env-file=.env.local scripts/create-user.mjs \
//     demo-admin@pulse.app pulse-demo-admin "Demo Admin" admin
//
// Role must be one of: user · dev · admin

import bcrypt from "bcryptjs";
import Airtable from "airtable";

const [, , email, password, name, role] = process.argv;

if (!email || !password || !name || !role) {
  console.error(
    "Usage: node --env-file=.env.local scripts/create-user.mjs <email> <password> <name> <role>",
  );
  process.exit(1);
}
if (!["user", "dev", "admin"].includes(role)) {
  console.error(`Invalid role: ${role}. Expected: user · dev · admin`);
  process.exit(1);
}

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set in .env.local");
  process.exit(1);
}

const base = new Airtable({ apiKey: token }).base(baseId);

const escapedEmail = email.toLowerCase().replace(/'/g, "\\'");
const existing = await base("Users")
  .select({
    filterByFormula: `LOWER({Email}) = '${escapedEmail}'`,
    maxRecords: 1,
  })
  .firstPage();

if (existing.length > 0) {
  console.error(`✗ User ${email} already exists (id=${existing[0].id})`);
  process.exit(1);
}

console.log(`→ Hashing password (bcrypt cost 10)…`);
const passwordHash = await bcrypt.hash(password, 10);

console.log(`→ Creating ${role} in Airtable…`);
const now = new Date().toISOString();
const created = await base("Users").create([
  {
    fields: {
      Email: email,
      PasswordHash: passwordHash,
      Name: name,
      Role: role,
      CreatedAt: now,
      EmailVerifiedAt: now,
    },
  },
]);

console.log(`\n✓ Created ${role} account:`);
console.log(`  Record id  : ${created[0].id}`);
console.log(`  Email      : ${email}`);
console.log(`  Password   : ${password}`);
console.log(`  Name       : ${name}`);
console.log(`  Role       : ${role}`);
console.log(`  Verified   : ${now}`);

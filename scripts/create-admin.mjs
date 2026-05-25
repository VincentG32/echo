// One-off: create a verified admin account directly in Airtable.
// Use case: stand up a demo account for live presentations.
//
// Run with:  node --env-file=.env.local scripts/create-admin.mjs
//
// Edit the EMAIL / PASSWORD / NAME below if you want different values.

import bcrypt from "bcryptjs";
import Airtable from "airtable";

const EMAIL = "demo-admin@pulse.app";
const PASSWORD = "pulse-demo-admin";
const NAME = "Demo Admin";

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId) {
  console.error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set in .env.local");
  process.exit(1);
}

const base = new Airtable({ apiKey: token }).base(baseId);

// Check if email already exists (Airtable filterByFormula on Email)
const escapedEmail = EMAIL.toLowerCase().replace(/'/g, "\\'");
const existing = await base("Users")
  .select({
    filterByFormula: `LOWER({Email}) = '${escapedEmail}'`,
    maxRecords: 1,
  })
  .firstPage();

if (existing.length > 0) {
  console.error(`✗ User ${EMAIL} already exists (id=${existing[0].id})`);
  console.error("  Delete it from Airtable first, or pick a different email.");
  process.exit(1);
}

console.log("→ Hashing password (bcrypt cost 10)…");
const passwordHash = await bcrypt.hash(PASSWORD, 10);

console.log("→ Creating user in Airtable…");
const now = new Date().toISOString();
const created = await base("Users").create([
  {
    fields: {
      Email: EMAIL,
      PasswordHash: passwordHash,
      Name: NAME,
      Role: "admin",
      CreatedAt: now,
      EmailVerifiedAt: now,
    },
  },
]);

console.log("\n✓ Created admin account:");
console.log(`  Record id  : ${created[0].id}`);
console.log(`  Email      : ${EMAIL}`);
console.log(`  Password   : ${PASSWORD}`);
console.log(`  Name       : ${NAME}`);
console.log(`  Role       : admin`);
console.log(`  Verified   : ${now}`);
console.log("\nLogin URL  : https://pulse-one-brown.vercel.app/login");

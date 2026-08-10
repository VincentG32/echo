import Airtable, { type FieldSet, type Records } from "airtable";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is missing`);
  return v;
}

const airtable = new Airtable({ apiKey: getEnv("AIRTABLE_TOKEN") });
export const base = airtable.base(getEnv("AIRTABLE_BASE_ID"));

export const usersTable = base("Users");
export const feedbacksTable = base("Feedbacks");
export const votesTable = base("Votes");
export const notificationsTable = base("Notifications");
export const commentsTable = base("Comments");
export const cahierTestsTable = base("CahierTests");

export type AirtableRecord = Records<FieldSet>[number];
export type { FieldSet };

export function nowIso(): string {
  return new Date().toISOString();
}

// Gate 0 (M1): escapes a value interpolated inside a single-quoted
// Airtable filterByFormula string. Prevents formula injection via user
// input (same pattern as getUserByEmail). Backslashes first, then quotes.
export function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

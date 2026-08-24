import { AIRTABLE_PAGE_SIZE } from "../config";
import { type AirtableRecord, cahierTestsTable, escapeFormulaValue } from "./client";

export type CahierTestItem = {
  id: string;
  code: string;
  campagne: string;
  zone: string;
  scenario: string;
  resultatAttendu: string;
  priorite: "haute" | "moyenne" | "basse" | null;
};

function mapCahierTest(r: AirtableRecord): CahierTestItem {
  const f = r.fields as Record<string, unknown>;
  return {
    id: r.id,
    code: String(f.Code ?? ""),
    campagne: String(f.Campagne ?? ""),
    zone: String(f.Zone ?? ""),
    scenario: String(f.Scenario ?? ""),
    resultatAttendu: String(f.ResultatAttendu ?? ""),
    priorite: (f.Priorite as CahierTestItem["priorite"] | undefined) ?? null,
  };
}

// Campagne active codée en dur pour ce POC (une seule campagne à la fois).
// Passer en paramètre de config si plusieurs campagnes doivent un jour
// coexister (cf. roadmap V2 multi-projets).
export const ACTIVE_CAMPAIGN = "Echo V1";

export async function listActiveCahierTests(): Promise<CahierTestItem[]> {
  const escaped = escapeFormulaValue(ACTIVE_CAMPAIGN);
  const records = await cahierTestsTable
    .select({
      filterByFormula: `AND({Campagne} = '${escaped}', {Actif} = TRUE())`,
      sort: [{ field: "Code", direction: "asc" }],
      pageSize: AIRTABLE_PAGE_SIZE,
    })
    .all();
  return records.map(mapCahierTest);
}

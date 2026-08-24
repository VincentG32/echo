import { NextResponse } from "next/server";
import { listFeedbacks } from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";

// V6: admin-only CSV export of every feedback. Used for monthly reporting
// outside Echo (Sheets, Excel...). Streams a UTF-8 BOM + comma-separated
// rows. RFC 4180-ish escaping (double quotes around cells containing
// commas/quotes/newlines, internal quotes doubled).

// Gate 0 (M3): a cell whose first character is =, +, -, @, tab or CR is
// interpreted as a formula by Excel/Sheets on open ("formula injection").
// A feedback title crafted as `=HYPERLINK(...)` would execute for the
// admin opening this export. Prefix with a single quote to force
// text interpretation — standard OWASP CSV injection mitigation.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (FORMULA_TRIGGER.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const auth = await requireAuth({ role: "admin" });
  if (auth.error) return auth.error;

  const feedbacks = await listFeedbacks();

  const headers = [
    "ID",
    "Title",
    "Description",
    "Type",
    "Criticality",
    "Status",
    "VoteCount",
    "CreatorName",
    "AssignedToName",
    "CreatedAt",
  ];
  const lines = [headers.map(csvCell).join(",")];
  for (const f of feedbacks) {
    lines.push(
      [
        f.id,
        f.title,
        f.description,
        f.type,
        f.criticality ?? "",
        f.status ?? "",
        f.voteCount,
        f.creatorName,
        f.assignedToName ?? "",
        f.createdAt,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // UTF-8 BOM so Excel opens accented characters correctly.
  const body = "﻿" + lines.join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="echo-feedbacks-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

// ---------------------------------------------------------------------------
// NEW FILE: app/api/resources/route.ts
//
// Public, read-only — same reasoning as app/api/events/route.ts: kept
// outside /api/admin/* so middleware.ts's existing guard leaves it open
// for the public Resources page to fetch from.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import db from "@/lib/db";

const SELECT = `
  SELECT id, title, description, file_url AS fileUrl, category
  FROM resources
`;

export async function GET() {
  const rows = db.query(`${SELECT} ORDER BY created_at DESC`).all();
  return NextResponse.json(rows);
}
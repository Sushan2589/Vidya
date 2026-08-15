// ---------------------------------------------------------------------------
// NEW FILE: app/api/resources/route.ts
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import db from "@/lib/db";

const SELECT = `
  SELECT id, title, description, file_url AS fileUrl, category
  FROM resources
`;

export async function GET() {
  const result = await db.execute(
    `${SELECT} ORDER BY created_at DESC`
  );

  return NextResponse.json(result.rows);
}
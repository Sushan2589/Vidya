import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(`
    SELECT
      id,
      year,
      title,
      description,
      sort_order AS sortOrder
    FROM timeline_items
    ORDER BY sort_order ASC
  `);

  const rows = result.rows.map((row) => ({
    id: Number(row[0]),
    year: String(row[1] ?? ""),
    title: String(row[2] ?? ""),
    description: row[3] ? String(row[3]) : null,
    sortOrder: Number(row[4] ?? 0),
  }));

  return NextResponse.json(rows);
}
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(`
    SELECT
      id,
      title,
      description,
      file_url AS fileUrl,
      category
    FROM resources
    ORDER BY created_at DESC
  `);

  const rows = result.rows.map((row) => ({
    id: Number(row[0]),
    title: String(row[1] ?? ""),
    description: row[2] ? String(row[2]) : null,
    fileUrl: String(row[3] ?? ""),
    category: row[4] ? String(row[4]) : null,
  }));

  return NextResponse.json(rows);
}
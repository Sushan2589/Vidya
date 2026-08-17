import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  category: z.string().optional(),
});

type DbRow = Record<string, unknown> | unknown[];

function toValues(row: DbRow): unknown[] {
  return Array.isArray(row) ? row : Object.values(row);
}

function mapResourceRow(row: DbRow) {
  const v = toValues(row);
  return {
    id: Number(v[0]),
    title: String(v[1] ?? ""),
    description: v[2] ? String(v[2]) : null,
    fileUrl: String(v[3] ?? ""),
    category: v[4] ? String(v[4]) : null,
  };
}

const SELECT = `SELECT id, title, description, file_url, category FROM resources`;

export async function GET() {
  const result = await db.execute(`${SELECT} ORDER BY created_at DESC`);
  return NextResponse.json(result.rows.map(mapResourceRow));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = resourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, fileUrl, category } = parsed.data;

  const result = await db.execute({
    sql: `INSERT INTO resources (title, description, file_url, category, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: [title, description || null, fileUrl, category || null, Date.now()],
  });

  const rowResult = await db.execute({
    sql: `${SELECT} WHERE id = ?`,
    args: [Number(result.lastInsertRowid)],
  });

  return NextResponse.json(mapResourceRow(rowResult.rows[0]), { status: 201 });
}
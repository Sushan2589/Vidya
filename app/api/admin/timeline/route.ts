import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const timelineSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  
});

type DbRow = Record<string, unknown> | unknown[];

function toValues(row: DbRow): unknown[] {
  return Array.isArray(row) ? row : Object.values(row);
}

function mapTimelineRow(row: DbRow) {
  const v = toValues(row);
  return {
    id: Number(v[0]),
    year: String(v[1] ?? ""),
    title: String(v[2] ?? ""),
    description: v[3] ? String(v[3]) : null,
    imageUrl: v[4] ? String(v[4]) : null,
    sortOrder: Number(v[5] ?? 0),
  };
}

const SELECT = `SELECT id, year, title, description, image_url, sort_order FROM timeline_items`;

export async function GET() {
  const result = await db.execute(`${SELECT} ORDER BY sort_order ASC`);
  return NextResponse.json(result.rows.map(mapTimelineRow));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = timelineSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { year, title, description, imageUrl } = parsed.data;

  const maxResult = await db.execute(
    `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM timeline_items`
  );
  const nextOrder = Number(maxResult.rows[0][0] ?? 0) + 1;

  const result = await db.execute({
    sql: `INSERT INTO timeline_items (year, title, description, image_url, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [year, title, description || null, imageUrl || null, nextOrder, Date.now()],
  });

  const rowResult = await db.execute({
    sql: `${SELECT} WHERE id = ?`,
    args: [Number(result.lastInsertRowid)],
  });

  return NextResponse.json(mapTimelineRow(rowResult.rows[0]), { status: 201 });
}
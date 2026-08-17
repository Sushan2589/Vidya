import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const timelineSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
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
    sortOrder: Number(v[4] ?? 0),
  };
}

const SELECT = `SELECT id, year, title, description, sort_order FROM timeline_items`;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const timelineId = Number(id);

  if (!Number.isInteger(timelineId)) {
    return NextResponse.json({ error: "Invalid timeline ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = timelineSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { year, title, description, sortOrder } = parsed.data;

  const result = await db.execute({
    sql: `UPDATE timeline_items SET year = ?, title = ?, description = ?, sort_order = ? WHERE id = ?`,
    args: [year, title, description || null, sortOrder, timelineId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rowResult = await db.execute({ sql: `${SELECT} WHERE id = ?`, args: [timelineId] });
  const row = rowResult.rows[0];

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(mapTimelineRow(row));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const timelineId = Number(id);

  if (!Number.isInteger(timelineId)) {
    return NextResponse.json({ error: "Invalid timeline ID" }, { status: 400 });
  }

  const result = await db.execute({
    sql: `DELETE FROM timeline_items WHERE id = ?`,
    args: [timelineId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
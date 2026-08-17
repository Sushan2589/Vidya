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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resourceId = Number(id);

  if (!Number.isInteger(resourceId)) {
    return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = resourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, fileUrl, category } = parsed.data;

  const result = await db.execute({
    sql: `UPDATE resources SET title = ?, description = ?, file_url = ?, category = ? WHERE id = ?`,
    args: [title, description || null, fileUrl, category || null, resourceId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rowResult = await db.execute({ sql: `${SELECT} WHERE id = ?`, args: [resourceId] });
  const row = rowResult.rows[0];

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(mapResourceRow(row));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resourceId = Number(id);

  if (!Number.isInteger(resourceId)) {
    return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
  }

  const result = await db.execute({
    sql: `DELETE FROM resources WHERE id = ?`,
    args: [resourceId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
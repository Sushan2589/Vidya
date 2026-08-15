import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const timelineSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const SELECT = `
  SELECT id, year, title, description, sort_order AS sortOrder
  FROM timeline_items
`;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = timelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { year, title, description, sortOrder } = parsed.data;

  db.query(
    `UPDATE timeline_items
     SET year = $year, title = $title, description = $description, sort_order = $sortOrder
     WHERE id = $id`
  ).run({
    $year: year,
    $title: title,
    $description: description || null,
    $sortOrder: sortOrder,
    $id: Number(id),
  });

  const row = db.query(`${SELECT} WHERE id = $id`).get({ $id: Number(id) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.query("DELETE FROM timeline_items WHERE id = $id").run({
    $id: Number(id),
  });
  return NextResponse.json({ ok: true });
}

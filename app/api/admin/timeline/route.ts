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

export async function GET() {
  const rows = db.query(`${SELECT} ORDER BY sort_order ASC`).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = timelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { year, title, description, sortOrder } = parsed.data;

  const result = db
    .query(
      `INSERT INTO timeline_items (year, title, description, sort_order, created_at)
       VALUES ($year, $title, $description, $sortOrder, $now)`
    )
    .run({
      $year: year,
      $title: title,
      $description: description || null,
      $sortOrder: sortOrder,
      $now: Date.now(),
    });

  const row = db
    .query(`${SELECT} WHERE id = $id`)
    .get({ $id: result.lastInsertRowid });

  return NextResponse.json(row, { status: 201 });
}

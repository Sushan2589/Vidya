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
  const result = await db.execute(
    `${SELECT} ORDER BY sort_order ASC`
  );

  return NextResponse.json(result.rows);
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

  const result = await db.execute({
    sql: `
      INSERT INTO timeline_items (
        year,
        title,
        description,
        sort_order,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      year,
      title,
      description || null,
      sortOrder,
      Date.now(),
    ],
  });

  const rowResult = await db.execute({
    sql: `${SELECT} WHERE id = ?`,
    args: [Number(result.lastInsertRowid)],
  });

  const row = rowResult.rows[0];

  return NextResponse.json(row, { status: 201 });
}
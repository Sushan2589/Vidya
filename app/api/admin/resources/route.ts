import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  category: z.string().optional(),
});

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = resourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, fileUrl, category } = parsed.data;

  const result = await db.execute({
    sql: `
      INSERT INTO resources (
        title,
        description,
        file_url,
        category,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      title,
      description || null,
      fileUrl,
      category || null,
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
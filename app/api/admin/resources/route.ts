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
  const rows = db.query(`${SELECT} ORDER BY created_at DESC`).all();
  return NextResponse.json(rows);
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

  const result = db
    .query(
      `INSERT INTO resources (title, description, file_url, category, created_at)
       VALUES ($title, $description, $fileUrl, $category, $now)`
    )
    .run({
      $title: title,
      $description: description || null,
      $fileUrl: fileUrl,
      $category: category || null,
      $now: Date.now(),
    });

  const row = db
    .query(`${SELECT} WHERE id = $id`)
    .get({ $id: result.lastInsertRowid });

  return NextResponse.json(row, { status: 201 });
}

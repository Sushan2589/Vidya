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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, fileUrl, category } = parsed.data;

  db.query(
    `UPDATE resources
     SET title = $title, description = $description, file_url = $fileUrl, category = $category
     WHERE id = $id`
  ).run({
    $title: title,
    $description: description || null,
    $fileUrl: fileUrl,
    $category: category || null,
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
  db.query("DELETE FROM resources WHERE id = $id").run({ $id: Number(id) });
  return NextResponse.json({ ok: true });
}

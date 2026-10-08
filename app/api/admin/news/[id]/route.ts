import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const href = String(body.href ?? "").trim();

  if (!title || !href) {
    return NextResponse.json({ error: "Title and link are required." }, { status: 400 });
  }

  await db.execute({
    sql: `
      UPDATE news_articles
      SET title = ?, description = ?, href = ?
      WHERE id = ? AND is_active = 1
    `,
    args: [title, description, href, Number(id)],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.execute({
    sql: `
      UPDATE news_articles
      SET is_active = 0
      WHERE id = ?
    `,
    args: [Number(id)],
  });

  return NextResponse.json({ ok: true });
}

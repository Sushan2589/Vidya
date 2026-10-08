import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(
    "SELECT id, title, description, href, sort_order FROM news_articles WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC"
  );

  return NextResponse.json(
    result.rows.map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      href: String(row.href ?? ""),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const href = String(body.href ?? "").trim();

  if (!title || !href) {
    return NextResponse.json({ error: "Title and link are required." }, { status: 400 });
  }

  const nextOrder = await db.execute(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM news_articles"
  );
  const sortOrder = Number(nextOrder.rows[0]?.next_order ?? 1);

  await db.execute({
    sql: `
      INSERT INTO news_articles (title, description, href, sort_order, is_active)
      VALUES (?, ?, ?, ?, 1)
    `,
    args: [title, description, href, sortOrder],
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { eventSchema, slugify } from "@/lib/validations/event";

type DbRow = Record<string, unknown> | unknown[];

function toValues(row: DbRow): unknown[] {
  return Array.isArray(row) ? row : Object.values(row);
}

function mapEventRow(row: DbRow) {
  const v = toValues(row);
  return {
    id: Number(v[0]),
    slug: String(v[1] ?? ""),
    title: String(v[2] ?? ""),
    subject: String(v[3] ?? ""),
    level: String(v[4] ?? ""),
    summary: String(v[5] ?? ""),
    details: String(v[6] ?? ""),
    eligibility: String(v[7] ?? ""),
    syllabus: String(v[8] ?? ""),
    heldIn: String(v[9] ?? ""),
    date: v[10] ? String(v[10]) : "",
    location: v[11] ? String(v[11]) : null,
    registrationLink: v[12] ? String(v[12]) : null,
    imageUrl: v[13] ? String(v[13]) : null,
    sortOrder: Number(v[14] ?? 0),
    createdAt: v[15] ? String(v[15]) : null,
  };
}

export async function GET() {
  const result = await db.execute(`
    SELECT
      id, slug, title, subject, level, summary, details,
      eligibility, syllabus, held_in, date, location,
      registration_link, image_url, sort_order, created_at
    FROM events
    ORDER BY sort_order ASC, date ASC
  `);

  return NextResponse.json(result.rows.map(mapEventRow));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const e = parsed.data;

  const base = slugify(e.title);
  let slug = base;
  let n = 1;

  while (true) {
    const result = await db.execute({
      sql: `SELECT 1 FROM events WHERE slug = ? LIMIT 1`,
      args: [slug],
    });
    if (result.rows.length === 0) break;
    slug = `${base}-${++n}`;
  }

  await db.execute({
    sql: `
      INSERT INTO events (
        slug, title, subject, level, summary, details,
        eligibility, syllabus, held_in, date, location,
        registration_link, image_url, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args: [
      slug, e.title, e.subject, e.level, e.summary, e.details,
      e.eligibility ?? "", e.syllabus ?? "", e.heldIn,
      e.date ?? null, e.location ?? null, e.registrationLink || null,
      e.imageUrl || null
    ],
  });

  return NextResponse.json({ slug }, { status: 201 });
}
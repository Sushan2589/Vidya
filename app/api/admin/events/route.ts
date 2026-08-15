import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { eventSchema, slugify } from "@/lib/validations/event";

export async function GET() {
  const result = await db.execute(`
    SELECT
      id,
      slug,
      title,
      subject,
      level,
      summary,
      details,
      eligibility,
      syllabus,
      held_in AS heldIn,
      date,
      location,
      registration_link AS registrationLink,
      image_url AS imageUrl,
      sort_order AS sortOrder,
      created_at AS createdAt
    FROM events
    ORDER BY sort_order ASC, date ASC
  `);

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const e = parsed.data;

  // Ensure slug uniqueness.
  const base = slugify(e.title);
  let slug = base;
  let n = 1;

  while (true) {
    const result = await db.execute({
      sql: `
        SELECT 1
        FROM events
        WHERE slug = ?
        LIMIT 1
      `,
      args: [slug],
    });

    if (result.rows.length === 0) {
      break;
    }

    slug = `${base}-${++n}`;
  }

  await db.execute({
    sql: `
      INSERT INTO events (
        slug,
        title,
        subject,
        level,
        summary,
        details,
        eligibility,
        syllabus,
        held_in,
        date,
        location,
        registration_link,
        image_url,
        sort_order,
        created_at,
      updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    args: [
      slug,
      e.title,
      e.subject,
      e.level,
      e.summary,
      e.details,
      e.eligibility ?? "",
      e.syllabus ?? "",
      e.heldIn,
      e.date ?? null,
      e.location ?? null,
      e.registrationLink || null,
      e.imageUrl || null,
      e.sortOrder ?? 0,
    ],
  });

  return NextResponse.json({ slug }, { status: 201 });
}

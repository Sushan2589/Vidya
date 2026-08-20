import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { eventSchema, slugify } from "@/lib/validations/event";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const e = parsed.data;

  // Get the current event.
  const currentResult = await db.execute({
    sql: `SELECT slug, title FROM events WHERE id = ?`,
    args: [eventId],
  });

  const row = currentResult.rows[0];

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentSlug = String(row.slug);
  const currentTitle = String(row.title);

  let slug = currentSlug;

  if (e.title !== currentTitle) {
    const base = slugify(e.title);
    slug = base;
    let n = 1;

    while (true) {
      const slugResult = await db.execute({
        sql: `
          SELECT 1
          FROM events
          WHERE slug = ?
            AND id != ?
          LIMIT 1
        `,
        args: [slug, eventId],
      });

      if (slugResult.rows.length === 0) {
        break;
      }

      slug = `${base}-${++n}`;
    }
  }

  await db.execute({
    sql: `
      UPDATE events SET
        slug = ?,
        title = ?,
        subject = ?,
        level = ?,
        summary = ?,
        details = ?,
        eligibility = ?,
        syllabus = ?,
        held_in = ?,
        date = ?,
        location = ?,
        registration_link = ?,
        image_url = ?,
        
      WHERE id = ?
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
      eventId,
    ],
  });

  return NextResponse.json({ slug });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const result = await db.execute({
    sql: `DELETE FROM events WHERE id = ?`,
    args: [eventId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// REPLACES: app/api/admin/events/[id]/route.ts
// Next 15+: params is async, matching the rest of the codebase.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { eventSchema, slugify } from "@/lib/validations/event";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const e = parsed.data;

  // re-slug only if the title changed and the new slug isn't taken by
  // another row
  const current = db
    .query(`SELECT slug, title FROM events WHERE id = $id`)
    .get({ $id: id }) as { slug: string; title: string } | undefined;

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let slug = current.slug;
  if (e.title !== current.title) {
    const base = slugify(e.title);
    slug = base;
    let n = 1;
    while (
      db
        .query(`SELECT 1 FROM events WHERE slug = $slug AND id != $id`)
        .get({ $slug: slug, $id: id })
    ) {
      slug = `${base}-${++n}`;
    }
  }

  db.run(
    `UPDATE events SET
      slug = ?, title = ?, subject = ?, level = ?,
      summary = ?, details = ?, eligibility = ?,
      syllabus = ?, held_in = ?, date = ?,
      location = ?, registration_link = ?,
      image_url = ?, sort_order = ?
     WHERE id = ?`,
    [
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
      id,
    ]
  );

  return NextResponse.json({ slug });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.run(`DELETE FROM events WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}
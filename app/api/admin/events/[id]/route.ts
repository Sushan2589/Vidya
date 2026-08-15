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
      slug = $slug, title = $title, subject = $subject, level = $level,
      summary = $summary, details = $details, eligibility = $eligibility,
      syllabus = $syllabus, held_in = $heldIn, date = $date,
      location = $location, registration_link = $registrationLink,
      image_url = $imageUrl, sort_order = $sortOrder
     WHERE id = $id`,
    {
      $slug: slug,
      $title: e.title,
      $subject: e.subject,
      $level: e.level,
      $summary: e.summary,
      $details: e.details,
      $eligibility: e.eligibility ?? "",
      $syllabus: e.syllabus ?? "",
      $heldIn: e.heldIn,
      $date: e.date ?? null,
      $location: e.location ?? null,
      $registrationLink: e.registrationLink || null,
      $imageUrl: e.imageUrl || null,
      $sortOrder: e.sortOrder ?? 0,
      $id: id,
    }
  );

  return NextResponse.json({ slug });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.run(`DELETE FROM events WHERE id = $id`, { $id: id });
  return NextResponse.json({ ok: true });
}
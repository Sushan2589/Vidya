// ---------------------------------------------------------------------------
// REPLACES: app/api/admin/events/route.ts
// Same shape as before (GET list, POST create) — just select/insert the
// new columns and auto-generate a unique slug from the title.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import  db  from "@/lib/db";
import { eventSchema, slugify } from "@/lib/validations/event";

export async function GET() {
  const rows = db
    .query(
      `SELECT
        id, slug, title, subject, level, summary, details,
        eligibility, syllabus,
        held_in AS heldIn,
        date, location,
        registration_link AS registrationLink,
        image_url AS imageUrl,
        sort_order AS sortOrder,
        created_at AS createdAt
      FROM events
      ORDER BY sort_order ASC, date ASC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const e = parsed.data;

  // ensure slug uniqueness (title-1, title-2, ... on collision)
  const base = slugify(e.title);
  let slug = base;
  let n = 1;
  while (
    db.query(`SELECT 1 FROM events WHERE slug = $slug`).get({ $slug: slug })
  ) {
    slug = `${base}-${++n}`;
  }

  db.run(
    `INSERT INTO events
      (slug, title, subject, level, summary, details, eligibility, syllabus,
       held_in, date, location, registration_link, image_url, sort_order, created_at, updated_at)
     VALUES
      ($slug, $title, $subject, $level, $summary, $details, $eligibility, $syllabus,
       $heldIn, $date, $location, $registrationLink, $imageUrl, $sortOrder, datetime('now'), datetime('now'))`,
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
    }
  );

  return NextResponse.json({ slug }, { status: 201 });
}
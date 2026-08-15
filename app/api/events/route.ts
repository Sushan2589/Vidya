// ---------------------------------------------------------------------------
// NEW FILE: app/api/events/route.ts
//
// Public, read-only. Deliberately outside /api/admin/* so middleware.ts's
// existing guard (which only matches /admin/* and /api/admin/*) leaves it
// open — this is content the public Olympiads page needs to fetch.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import  db  from "@/lib/db";

export async function GET() {
  const rows = db
    .query(
      `SELECT
        slug, title, subject, level, summary, details,
        eligibility, syllabus,
        held_in AS heldIn,
        registration_link AS registrationLink,
        image_url AS imageUrl
      FROM events
      ORDER BY sort_order ASC, date ASC`
    )
    .all();
  return NextResponse.json(rows);
}
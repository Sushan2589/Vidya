// ---------------------------------------------------------------------------
// NEW FILE: app/api/events/route.ts
//
// Public, read-only.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(`
    SELECT
      slug, title, subject, level, summary, details,
      eligibility, syllabus,
      held_in AS heldIn,
      registration_link AS registrationLink,
      image_url AS imageUrl
    FROM events
    ORDER BY sort_order ASC, date ASC
  `);

  return NextResponse.json(result.rows);
}
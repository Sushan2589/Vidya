import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(`
    SELECT
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
      registration_link AS registrationLink,
      image_url AS imageUrl
    FROM events
    ORDER BY sort_order ASC, date ASC
  `);

  const rows = result.rows.map((row) => ({
    slug: String(row[0] ?? ""),
    title: String(row[1] ?? ""),
    subject: String(row[2] ?? ""),
    level: String(row[3] ?? ""),
    summary: String(row[4] ?? ""),
    details: String(row[5] ?? ""),
    eligibility: String(row[6] ?? ""),
    syllabus: String(row[7] ?? ""),
    heldIn: String(row[8] ?? ""),
    date: row[9] ? String(row[9]) : null,
  registrationLink: row[10] ? String(row[10]) : null,
  imageUrl: row[11] ? String(row[11]) : null,
  }));

  return NextResponse.json(rows);
}
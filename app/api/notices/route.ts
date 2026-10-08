import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT
        id,
        title,
        notice_type,
        image_url,
        image_fit,
        tag,
        heading,
        description,
        design_style,
        button_text,
        button_url,
        display_location,
        is_active,
        created_at
      FROM notices
      WHERE is_active = 1
      ORDER BY created_at DESC
    `);

    const rows = result.rows.map((row: any) => ({
      id: Number(row[0] ?? row.id),
      title: String(row[1] ?? row.title ?? ""),
      noticeType: String(row[2] ?? row.notice_type ?? "popup_combo"),
      imageUrl: row[3] || row.image_url ? String(row[3] ?? row.image_url) : null,
      imageFit: String(row[4] ?? row.image_fit ?? "contain"),
      tag: String(row[5] ?? row.tag ?? "Important Notice"),
      heading: row[6] || row.heading ? String(row[6] ?? row.heading) : null,
      description: row[7] || row.description ? String(row[7] ?? row.description) : null,
      designStyle: String(row[8] ?? row.design_style ?? "gold"),
      buttonText: row[9] || row.button_text ? String(row[9] ?? row.button_text) : null,
      buttonUrl: row[10] || row.button_url ? String(row[10] ?? row.button_url) : null,
      displayLocation: String(row[11] ?? row.display_location ?? "popup"),
      isActive: Boolean(Number(row[12] ?? row.is_active ?? 1)),
      createdAt: Number(row[13] ?? row.created_at ?? 0),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch notices:", error);
    return NextResponse.json([]);
  }
}

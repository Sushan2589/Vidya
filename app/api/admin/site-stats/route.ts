import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(
    "SELECT key, value, label, suffix FROM site_stats ORDER BY sort_order ASC, id ASC"
  );

  return NextResponse.json(
    result.rows.map((row: Record<string, unknown>) => ({
      key: String(row.key ?? ""),
      value: Number(row.value ?? 0),
      label: String(row.label ?? ""),
      suffix: String(row.suffix ?? ""),
    }))
  );
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updates = {
    students_guided: Number(body.students_guided ?? 0),
    provinces_reached: Number(body.provinces_reached ?? 0),
    volunteers: Number(body.volunteers ?? 0),
  };

  const entries = [
    { key: "students_guided", label: "Students Guided", value: updates.students_guided, suffix: "+", sortOrder: 1 },
    { key: "provinces_reached", label: "Provinces Reached", value: updates.provinces_reached, suffix: "", sortOrder: 2 },
    { key: "volunteers", label: "Volunteers", value: updates.volunteers, suffix: "+", sortOrder: 3 },
  ];

  for (const entry of entries) {
    await db.execute({
      sql: `
        INSERT INTO site_stats (key, label, value, suffix, sort_order)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          label = excluded.label,
          value = excluded.value,
          suffix = excluded.suffix,
          sort_order = excluded.sort_order
      `,
      args: [entry.key, entry.label, String(entry.value), entry.suffix, entry.sortOrder],
    });
  }

  return NextResponse.json({ ok: true });
}

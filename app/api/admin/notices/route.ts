import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  noticeType: z
    .enum(["popup_image", "popup_text", "popup_combo", "banner_text"])
    .default("popup_combo"),
  imageUrl: z.string().optional().nullable(),
  imageFit: z.enum(["contain", "cover"]).default("contain"),
  tag: z.string().optional().default("Important Notice"),
  heading: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  designStyle: z
    .enum(["gold", "navy", "crimson", "dark", "minimal"])
    .default("gold"),
  buttonText: z.string().optional().nullable(),
  buttonUrl: z.string().optional().nullable(),
  displayLocation: z.enum(["popup", "banner"]).default("popup"),
  isActive: z.boolean().default(true),
});

type DbRow = Record<string, unknown> | unknown[];

function toValues(row: DbRow): unknown[] {
  return Array.isArray(row) ? row : Object.values(row);
}

function mapNoticeRow(row: DbRow) {
  const v = toValues(row);
  return {
    id: Number(v[0]),
    title: String(v[1] ?? ""),
    noticeType: String(v[2] ?? "popup_combo"),
    imageUrl: v[3] ? String(v[3]) : null,
    imageFit: String(v[4] ?? "contain"),
    tag: String(v[5] ?? "Important Notice"),
    heading: v[6] ? String(v[6]) : null,
    description: v[7] ? String(v[7]) : null,
    designStyle: String(v[8] ?? "gold"),
    buttonText: v[9] ? String(v[9]) : null,
    buttonUrl: v[10] ? String(v[10]) : null,
    displayLocation: String(v[11] ?? "popup"),
    isActive: Boolean(Number(v[12] ?? 1)),
    createdAt: Number(v[13] ?? 0),
  };
}

const SELECT = `
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
`;

export async function GET() {
  const result = await db.execute(`${SELECT} ORDER BY created_at DESC`);
  return NextResponse.json(result.rows.map(mapNoticeRow));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = noticeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    title,
    noticeType,
    imageUrl,
    imageFit,
    tag,
    heading,
    description,
    designStyle,
    buttonText,
    buttonUrl,
    displayLocation,
    isActive,
  } = parsed.data;

  const now = Date.now();

  const insertResult = await db.execute({
    sql: `
      INSERT INTO notices (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      title,
      noticeType,
      imageUrl || null,
      imageFit,
      tag || "Important Notice",
      heading || null,
      description || null,
      designStyle,
      buttonText || null,
      buttonUrl || null,
      displayLocation,
      isActive ? 1 : 0,
      now,
    ],
  });

  const rowResult = await db.execute({
    sql: `${SELECT} WHERE id = ?`,
    args: [insertResult.lastInsertRowid ?? insertResult.rows?.[0]?.[0]],
  });

  const createdRow = rowResult.rows[0];
  if (!createdRow) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  return NextResponse.json(mapNoticeRow(createdRow), { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";

const reorderSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids } = parsed.data;

  try {
    await db.batch(
      ids.map((id, index) => ({
        sql: `UPDATE timeline_items SET sort_order = ? WHERE id = ?`,
        args: [index + 1, id],
      })),
      "write"
    );
  } catch (err) {
    console.error("Timeline reorder failed:", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
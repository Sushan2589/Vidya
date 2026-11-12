import { NextRequest, NextResponse } from "next/server";
import { getSiteStats, updateSiteStats } from "@/lib/db/stats";
import { siteStatsSchema } from "@/lib/validations/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getSiteStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = siteStatsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid stats data" },
        { status: 400 }
      );
    }

    const updated = await updateSiteStats(parsed.data);
    return NextResponse.json({ success: true, stats: updated });
  } catch (error) {
    console.error("PUT /api/admin/stats error:", error);
    return NextResponse.json(
      { error: "Failed to update stats" },
      { status: 500 }
    );
  }
}


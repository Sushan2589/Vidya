import { NextResponse } from "next/server";
import { getSiteStats } from "@/lib/db/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getSiteStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}


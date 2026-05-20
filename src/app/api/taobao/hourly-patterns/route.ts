import { NextResponse } from "next/server";
import { getDb } from "../_db";

export async function GET() {
  try {
    const db = getDb();

    const rows = db
      .prepare(
        `
        SELECT
          hour,
          total_events,
          pv_count,
          cart_count,
          fav_count,
          buy_count,
          avg_daily_events
        FROM gold_hourly_patterns
        ORDER BY hour ASC
      `
      )
      .all() as Record<string, number>[];

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[taobao/hourly-patterns] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hourly patterns" },
      { status: 500 }
    );
  }
}

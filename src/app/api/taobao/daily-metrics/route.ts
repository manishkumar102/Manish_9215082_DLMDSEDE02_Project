import { NextResponse } from "next/server";
import { getDb } from "../_db";

export async function GET() {
  try {
    const db = getDb();

    const rows = db
      .prepare(
        `
        SELECT
          date,
          total_events,
          pv_count,
          cart_count,
          fav_count,
          buy_count,
          unique_users,
          unique_items,
          unique_categories
        FROM gold_daily_metrics
        ORDER BY date ASC
      `
      )
      .all() as Record<string, number>[];

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[taobao/daily-metrics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily metrics" },
      { status: 500 }
    );
  }
}

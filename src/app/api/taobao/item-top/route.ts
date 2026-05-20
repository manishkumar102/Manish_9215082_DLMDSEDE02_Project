import { NextResponse } from "next/server";
import { getDb } from "../_db";

export async function GET() {
  try {
    const db = getDb();

    const rows = db
      .prepare(
        `
        SELECT
          item_id,
          category_id,
          total_events,
          pv_count,
          cart_count,
          fav_count,
          buy_count,
          unique_users,
          ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
        FROM gold_item_summary
        ORDER BY buy_count DESC
        LIMIT 20
      `
      )
      .all() as Record<string, number>[];

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[taobao/item-top] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top items" },
      { status: 500 }
    );
  }
}

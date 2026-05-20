import { NextResponse } from "next/server";
import { getDb } from "../_db";

export async function GET() {
  try {
    const db = getDb();

    const rows = db
      .prepare(
        `
        SELECT
          user_id,
          total_events,
          pv_count,
          cart_count,
          fav_count,
          buy_count,
          active_days,
          first_seen,
          last_seen,
          CASE
            WHEN buy_count >= 5 THEN 'power_buyer'
            WHEN buy_count >= 1 THEN 'buyer'
            WHEN cart_count > 0 OR fav_count > 0 THEN 'engaged_browser'
            WHEN total_events >= 20 THEN 'frequent_browser'
            WHEN total_events >= 5 THEN 'casual_browser'
            ELSE 'one_time_visitor'
          END AS segment
        FROM gold_user_summary
        ORDER BY total_events DESC
      `
      )
      .all() as Record<string, string | number>[];

    // Compute segment aggregates
    const segments: Record<string, { count: number; totalEvents: number; totalPurchases: number }> = {};

    for (const row of rows) {
      const seg = row.segment as string;
      if (!segments[seg]) {
        segments[seg] = { count: 0, totalEvents: 0, totalPurchases: 0 };
      }
      segments[seg].count += 1;
      segments[seg].totalEvents += Number(row.total_events) || 0;
      segments[seg].totalPurchases += Number(row.buy_count) || 0;
    }

    const segmentSummary = Object.entries(segments).map(([name, data]) => ({
      segment: name,
      userCount: data.count,
      totalEvents: data.totalEvents,
      totalPurchases: data.totalPurchases,
      avgEventsPerUser:
        data.count > 0 ? Math.round(data.totalEvents / data.count) : 0,
    }));

    segmentSummary.sort((a, b) => b.userCount - a.userCount);

    return NextResponse.json({
      segments: segmentSummary,
      totalUsers: rows.length,
    });
  } catch (error) {
    console.error("[taobao/user-segments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user segments" },
      { status: 500 }
    );
  }
}

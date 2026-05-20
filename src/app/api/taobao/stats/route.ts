import { NextResponse } from "next/server";
import { getDb } from "../_db";

export async function GET() {
  try {
    const db = getDb();

    const dailyAgg = db
      .prepare(
        `
        SELECT
          COALESCE(SUM(total_events), 0)   AS totalEvents,
          COALESCE(SUM(pv_count), 0)       AS totalPV,
          COALESCE(SUM(cart_count), 0)     AS totalCart,
          COALESCE(SUM(fav_count), 0)      AS totalFav,
          COALESCE(SUM(buy_count), 0)      AS totalPurchases,
          COUNT(*)                          AS totalDays,
          COALESCE(AVG(unique_users), 0)   AS avgDAU,
          COALESCE(MAX(unique_users), 0)   AS peakDAU
        FROM gold_daily_metrics
      `
      )
      .get() as Record<string, number>;

    const uniqueUsers = (
      db.prepare("SELECT COUNT(*) AS c FROM gold_user_summary").get() as {
        c: number;
      }
    ).c;

    const uniqueItems = (
      db.prepare("SELECT COUNT(*) AS c FROM gold_item_summary").get() as {
        c: number;
      }
    ).c;

    const uniqueCategories = (
      db.prepare("SELECT COUNT(*) AS c FROM gold_category_summary").get() as {
        c: number;
      }
    ).c;

    const totalEvents = Number(dailyAgg.totalEvents) || 0;
    const totalPurchases = Number(dailyAgg.totalPurchases) || 0;
    const overallConversionRate =
      totalEvents > 0
        ? Number(((totalPurchases / totalEvents) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      totalEvents,
      uniqueUsers,
      uniqueItems,
      uniqueCategories,
      totalDays: Number(dailyAgg.totalDays) || 0,
      totalPurchases,
      overallConversionRate,
      avgDAU: Math.round(Number(dailyAgg.avgDAU) || 0),
      peakDAU: Number(dailyAgg.peakDAU) || 0,
      totalPV: Number(dailyAgg.totalPV) || 0,
      totalCart: Number(dailyAgg.totalCart) || 0,
      totalFav: Number(dailyAgg.totalFav) || 0,
    });
  } catch (error) {
    console.error("[taobao/stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline statistics" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getDb } from "../_db";

export async function GET() {
  try {
    const db = getDb();

    const row = db
      .prepare(
        `
        SELECT
          COALESCE(SUM(pv_count), 0)   AS pv,
          COALESCE(SUM(cart_count), 0)  AS cart,
          COALESCE(SUM(fav_count), 0)   AS fav,
          COALESCE(SUM(buy_count), 0)   AS buy,
          COALESCE(SUM(total_events), 0) AS total
        FROM gold_daily_metrics
      `
      )
      .get() as Record<string, number>;

    const pv = Number(row.pv) || 0;
    const cart = Number(row.cart) || 0;
    const fav = Number(row.fav) || 0;
    const buy = Number(row.buy) || 0;
    const total = Number(row.total) || 0;

    return NextResponse.json({
      stages: [
        {
          stage: "pv",
          label: "Page View",
          count: pv,
          rate: total > 0 ? Number(((pv / total) * 100).toFixed(2)) : 0,
        },
        {
          stage: "cart",
          label: "Add to Cart",
          count: cart,
          rate: pv > 0 ? Number(((cart / pv) * 100).toFixed(2)) : 0,
        },
        {
          stage: "fav",
          label: "Favorite",
          count: fav,
          rate: pv > 0 ? Number(((fav / pv) * 100).toFixed(2)) : 0,
        },
        {
          stage: "buy",
          label: "Purchase",
          count: buy,
          rate: pv > 0 ? Number(((buy / pv) * 100).toFixed(2)) : 0,
        },
      ],
      totalEvents: total,
    });
  } catch (error) {
    console.error("[taobao/conversion-funnel] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion funnel" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../_db";

interface QueryDefinition {
  id: string;
  name: string;
  description: string;
  sql: string;
  aliases?: string[];
}

const QUERY_WHITELIST: QueryDefinition[] = [
  {
    id: "daily-event-breakdown",
    name: "Daily Event Breakdown",
    description:
      "Daily breakdown of all event types (PV, Cart, Fav, Buy) with conversion rate",
    sql: `
      SELECT
        date,
        total_events,
        pv_count,
        cart_count,
        fav_count,
        buy_count,
        unique_users,
        unique_items,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
      FROM gold_daily_metrics
      ORDER BY date ASC
    `,
  },
  {
    id: "dau-trend",
    name: "DAU Trend",
    description:
      "Daily Active Users trend over time with new user ratio and events per user",
    sql: `
      SELECT
        date,
        unique_users AS dau,
        total_events,
        ROUND(CAST(total_events AS REAL) / NULLIF(unique_users, 0), 2) AS events_per_user,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
      FROM gold_daily_metrics
      ORDER BY date ASC
    `,
  },
  {
    id: "conversion-funnel",
    name: "Conversion Funnel",
    description:
      "Overall conversion funnel showing PV → Cart → Fav → Buy with drop-off rates",
    sql: `
      SELECT
        'Page View'    AS stage,
        SUM(pv_count)  AS count
      FROM gold_daily_metrics
      UNION ALL
      SELECT 'Add to Cart', SUM(cart_count) FROM gold_daily_metrics
      UNION ALL
      SELECT 'Favorite', SUM(fav_count) FROM gold_daily_metrics
      UNION ALL
      SELECT 'Purchase', SUM(buy_count) FROM gold_daily_metrics
    `,
  },
  {
    id: "hourly-patterns",
    name: "Hourly Traffic Patterns",
    description:
      "Hourly distribution of user behavior showing traffic peaks and troughs",
    sql: `
      SELECT
        hour,
        total_events,
        pv_count,
        cart_count,
        fav_count,
        buy_count,
        avg_daily_events,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS buy_rate
      FROM gold_hourly_patterns
      ORDER BY hour ASC
    `,
  },
  {
    id: "top-categories",
    name: "Top Categories",
    description:
      "Top 20 categories ranked by total events with conversion metrics",
    sql: `
      SELECT
        category_id,
        total_events,
        pv_count,
        cart_count,
        fav_count,
        buy_count,
        unique_users,
        unique_items,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
      FROM gold_category_summary
      ORDER BY total_events DESC
      LIMIT 20
    `,
  },
  {
    id: "category-funnel",
    name: "Category Funnel",
    description:
      "Conversion funnel breakdown per category (top 10 by buy_count)",
    sql: `
      SELECT
        category_id,
        pv_count,
        cart_count,
        fav_count,
        buy_count,
        ROUND(CAST(cart_count AS REAL) * 100.0 / NULLIF(pv_count, 0), 2) AS pv_to_cart_rate,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(pv_count, 0), 2) AS pv_to_buy_rate,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(cart_count, 0), 2) AS cart_to_buy_rate
      FROM gold_category_summary
      ORDER BY buy_count DESC
      LIMIT 10
    `,
  },
  {
    id: "user-segments",
    name: "User Segments",
    description:
      "User behavior segmentation with segment-level aggregated statistics",
    sql: `
      SELECT
        segment,
        COUNT(*)                              AS user_count,
        SUM(total_events)                     AS total_events,
        SUM(buy_count)                        AS total_purchases,
        ROUND(AVG(total_events), 2)           AS avg_events_per_user,
        ROUND(AVG(active_days), 2)            AS avg_active_days
      FROM (
        SELECT
          user_id,
          total_events,
          buy_count,
          active_days,
          CASE
            WHEN buy_count >= 5 THEN 'power_buyer'
            WHEN buy_count >= 1 THEN 'buyer'
            WHEN cart_count > 0 OR fav_count > 0 THEN 'engaged_browser'
            WHEN total_events >= 20 THEN 'frequent_browser'
            WHEN total_events >= 5 THEN 'casual_browser'
            ELSE 'one_time_visitor'
          END AS segment
        FROM gold_user_summary
      )
      GROUP BY segment
      ORDER BY user_count DESC
    `,
  },
  {
    id: "top-items-buy-rate",
    name: "Top Items by Purchase Rate",
    aliases: ["top-items"],
    description:
      "Top 20 items ranked by purchase count with conversion rate and unique buyers",
    sql: `
      SELECT
        item_id,
        category_id,
        total_events,
        pv_count,
        cart_count,
        fav_count,
        buy_count,
        unique_users,
        ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate,
        ROUND(CAST(buy_count AS REAL) / NULLIF(unique_users, 0), 2) AS purchases_per_user
      FROM gold_item_summary
      ORDER BY buy_count DESC
      LIMIT 20
    `,
  },
];

const queryMap = new Map<string, QueryDefinition>(
  QUERY_WHITELIST.flatMap((q) => [
    [q.id, q],
    ...(q.aliases ?? []).map((a) => [a, q] as [string, QueryDefinition]),
  ])
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryId = searchParams.get("q");

    // No query param → return list of available queries
    if (!queryId) {
      const catalog = QUERY_WHITELIST.map((q) => ({
        id: q.id,
        name: q.name,
        description: q.description,
      }));
      return NextResponse.json({ queries: catalog });
    }

    // Look up the whitelisted query (supports aliases)
    const def = queryMap.get(queryId);
    if (!def) {
      return NextResponse.json(
        {
          error: `Unknown query ID: "${queryId}"`,
          availableQueries: QUERY_WHITELIST.map((q) => q.id),
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const start = performance.now();

    const stmt = db.prepare(def.sql);
    const rows = stmt.all() as Record<string, unknown>[];
    const elapsed = performance.now() - start;

    // Extract column names from the first row (or empty array)
    const columns =
      rows.length > 0 ? Object.keys(rows[0]) : [];

    // Normalize all values to string | number for consistent JSON output
    const normalizedRows: (string | number)[][] = rows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return null;
        return typeof val === "number" ? val : String(val);
      })
    );

    return NextResponse.json({
      queryId: def.id,
      queryName: def.name,
      columns,
      rows: normalizedRows,
      rowCount: normalizedRows.length,
      executionTimeMs: Math.round(elapsed * 100) / 100,
    });
  } catch (error) {
    console.error("[taobao/sql-query] Error:", error);
    return NextResponse.json(
      { error: "Failed to execute SQL query" },
      { status: 500 }
    );
  }
}

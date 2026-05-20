#!/usr/bin/env python3
"""
Create a realistic SQLite database for the Alibaba Taobao User Behavior Dataset.

Schema:
  Bronze:  bronze_raw_events       — raw clickstream data
  Silver:  silver_cleaned_events    — cleaned events with quality scores
  Gold:    gold_daily_metrics       — daily aggregated KPIs
           gold_hourly_patterns     — hourly traffic patterns
           gold_category_summary    — per-category roll-ups
           gold_user_summary        — per-user roll-ups
           gold_item_summary        — per-item roll-ups
"""

import os
import sys
import sqlite3
import random
import time
from datetime import datetime, timedelta

# ============================================================================
# Configuration — mirrors the real Kaggle Taobao User Behavior Dataset
# ============================================================================
DB_PATH          = "/home/z/my-project/db/custom.db"
NUM_EVENTS       = 100_000
SEED             = 42

NUM_USERS        = 11_208
NUM_ITEMS        = 4_200_000
NUM_CATEGORIES   = 5_892

START_DATE       = datetime(2017, 11, 25)
END_DATE         = datetime(2017, 12, 3)           # inclusive
DATE_RANGE_DAYS  = (END_DATE - START_DATE).days + 1  # 9 days

# Real behavior-type distribution from the dataset
BEHAVIOR_WEIGHTS = {
    "pv":   87.7,
    "cart":  6.1,
    "fav":   3.9,
    "buy":   2.3,
}
# Cumulative thresholds for fast lookup
BEHAVIOR_TYPES = ["pv", "cart", "fav", "buy"]
BEHAVIOR_CUM   = [87.7, 93.8, 97.7, 100.0]

# Hourly activity weights (0-23) — realistic e-commerce pattern
HOUR_WEIGHTS = [
    0.6,  0.4,  0.3,  0.2,  0.2,  0.4,   # 00-05  night
    1.0,  1.6,  2.4,  3.2,  3.5,  3.8,    # 06-11  morning ramp
    3.0,  3.2,  3.4,  3.2,  2.9,  2.6,    # 12-17  afternoon
    2.2,  2.0,  2.8,  3.5,  3.6,  2.0,    # 18-23  evening peak
]
# Normalise so they sum to 1
_total = sum(HOUR_WEIGHTS)
HOUR_WEIGHTS = [w / _total for w in HOUR_WEIGHTS]


# ============================================================================
# Helpers
# ============================================================================
def choose_behavior(r: float) -> str:
    """Map a uniform random value [0,1) to a behavior type using cumulative weights."""
    pct = r * 100.0
    for bt, cum in zip(BEHAVIOR_TYPES, BEHAVIOR_CUM):
        if pct < cum:
            return bt
    return "buy"


def weighted_hour(r: float) -> int:
    """Map a uniform random value [0,1) to an hour using HOUR_WEIGHTS."""
    acc = 0.0
    for h, w in enumerate(HOUR_WEIGHTS):
        acc += w
        if r < acc:
            return h
    return 23


def choose_user_id(r: float) -> int:
    """Zipf-like distribution for user IDs (power-law, some users very active)."""
    # Use inverted power law: x = 1 / u^a  mapped to [1, NUM_USERS]
    # With a=0.7 this gives a realistic heavy-tail
    a = 0.7
    val = int(NUM_USERS * (r ** (1.0 / (1.0 + a)))) + 1
    return max(1, min(val, NUM_USERS))


def choose_category_id(r: float) -> int:
    """Zipf-like distribution for category IDs."""
    a = 0.8
    val = int(NUM_CATEGORIES * (r ** (1.0 / (1.0 + a)))) + 1
    return max(1, min(val, NUM_CATEGORIES))


# ============================================================================
# Table DDL
# ============================================================================
BRONZE_DDL = """
CREATE TABLE bronze_raw_events (
    user_id       INTEGER NOT NULL,
    item_id       INTEGER NOT NULL,
    category_id   INTEGER NOT NULL,
    behavior_type TEXT    NOT NULL CHECK(behavior_type IN ('pv','cart','fav','buy')),
    timestamp     TEXT    NOT NULL,
    date          TEXT    NOT NULL
);
"""

BRONZE_IDX = [
    "CREATE INDEX idx_bronze_date ON bronze_raw_events(date);",
    "CREATE INDEX idx_bronze_user ON bronze_raw_events(user_id);",
    "CREATE INDEX idx_bronze_item ON bronze_raw_events(item_id);",
    "CREATE INDEX idx_bronze_category ON bronze_raw_events(category_id);",
    "CREATE INDEX idx_bronze_behavior ON bronze_raw_events(behavior_type);",
]

SILVER_DDL = """
CREATE TABLE silver_cleaned_events (
    user_id       INTEGER NOT NULL,
    item_id       INTEGER NOT NULL,
    category_id   INTEGER NOT NULL,
    behavior_type TEXT    NOT NULL CHECK(behavior_type IN ('pv','cart','fav','buy')),
    timestamp     TEXT    NOT NULL,
    date          TEXT    NOT NULL,
    quality_score REAL,
    is_valid      INTEGER DEFAULT 1
);
"""

SILVER_IDX = [
    "CREATE INDEX idx_silver_date ON silver_cleaned_events(date);",
    "CREATE INDEX idx_silver_user ON silver_cleaned_events(user_id);",
    "CREATE INDEX idx_silver_valid ON silver_cleaned_events(is_valid);",
]

GOLD_DAILY_DDL = """
CREATE TABLE gold_daily_metrics (
    date             TEXT PRIMARY KEY,
    total_events     INTEGER,
    pv_count         INTEGER,
    cart_count       INTEGER,
    fav_count        INTEGER,
    buy_count        INTEGER,
    unique_users     INTEGER,
    unique_items     INTEGER,
    unique_categories INTEGER
);
"""

GOLD_HOURLY_DDL = """
CREATE TABLE gold_hourly_patterns (
    hour             INTEGER PRIMARY KEY,
    total_events     INTEGER,
    pv_count         INTEGER,
    cart_count       INTEGER,
    fav_count        INTEGER,
    buy_count        INTEGER,
    avg_daily_events REAL
);
"""

GOLD_CATEGORY_DDL = """
CREATE TABLE gold_category_summary (
    category_id      INTEGER PRIMARY KEY,
    total_events     INTEGER,
    pv_count         INTEGER,
    cart_count       INTEGER,
    fav_count        INTEGER,
    buy_count        INTEGER,
    unique_users     INTEGER,
    unique_items     INTEGER
);
"""

GOLD_USER_DDL = """
CREATE TABLE gold_user_summary (
    user_id      INTEGER PRIMARY KEY,
    total_events INTEGER,
    pv_count     INTEGER,
    cart_count   INTEGER,
    fav_count    INTEGER,
    buy_count    INTEGER,
    active_days  INTEGER,
    first_seen   TEXT,
    last_seen    TEXT
);
"""

GOLD_ITEM_DDL = """
CREATE TABLE gold_item_summary (
    item_id      INTEGER PRIMARY KEY,
    category_id  INTEGER,
    total_events INTEGER,
    pv_count     INTEGER,
    cart_count   INTEGER,
    fav_count    INTEGER,
    buy_count    INTEGER,
    unique_users INTEGER
);
"""


# ============================================================================
# Main
# ============================================================================
def main():
    t0 = time.time()

    # --- Delete existing DB ---
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"[+] Removed existing database: {DB_PATH}")

    # --- Connect ---
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA cache_size=-64000;")   # 64 MB cache
    cur = conn.cursor()

    # --- Bronze Layer ---
    print("[1/7] Creating bronze layer …")
    cur.execute(BRONZE_DDL)
    for idx_sql in BRONZE_IDX:
        cur.execute(idx_sql)
    conn.commit()

    # --- Generate events ---
    print(f"[2/7] Generating {NUM_EVENTS:,} synthetic events (seed={SEED}) …")
    rng = random.Random(SEED)

    rows = []
    for i in range(NUM_EVENTS):
        user_id     = choose_user_id(rng.random())
        item_id     = rng.randint(1, NUM_ITEMS)
        category_id = choose_category_id(rng.random())
        behavior    = choose_behavior(rng.random())
        hour        = weighted_hour(rng.random())
        day_offset  = rng.randint(0, DATE_RANGE_DAYS - 1)
        dt          = START_DATE + timedelta(days=day_offset, hours=hour,
                                              minutes=rng.randint(0, 59),
                                              seconds=rng.randint(0, 59))
        ts_str      = dt.strftime("%Y-%m-%d %H:%M:%S")
        date_str    = dt.strftime("%Y-%m-%d")
        rows.append((user_id, item_id, category_id, behavior, ts_str, date_str))

    # Bulk insert in batches of 10 000
    BATCH = 10_000
    for start in range(0, len(rows), BATCH):
        cur.executemany(
            "INSERT INTO bronze_raw_events VALUES (?,?,?,?,?,?)",
            rows[start:start + BATCH],
        )
    conn.commit()
    print(f"     Inserted {len(rows):,} rows into bronze_raw_events")

    # --- Silver Layer (cleaned copy with quality scores) ---
    print("[3/7] Creating silver layer …")
    cur.execute(SILVER_DDL)
    for idx_sql in SILVER_IDX:
        cur.execute(idx_sql)

    # Assign quality scores: valid events get 0.8-1.0, a small fraction (<1%) are "invalid"
    invalid_count = 0
    silver_rows = []
    for user_id, item_id, category_id, behavior, ts, date_str in rows:
        if rng.random() < 0.005:  # 0.5% invalid
            quality = round(rng.uniform(0.1, 0.5), 2)
            is_valid = 0
            invalid_count += 1
        else:
            quality = round(rng.uniform(0.85, 1.0), 2)
            is_valid = 1
        silver_rows.append((user_id, item_id, category_id, behavior, ts, date_str, quality, is_valid))

    for start in range(0, len(silver_rows), BATCH):
        cur.executemany(
            "INSERT INTO silver_cleaned_events VALUES (?,?,?,?,?,?,?,?)",
            silver_rows[start:start + BATCH],
        )
    conn.commit()
    print(f"     Inserted {len(silver_rows):,} rows into silver_cleaned_events ({invalid_count} invalid)")

    # --- Gold Layer: Daily Metrics ---
    print("[4/7] Populating gold_daily_metrics …")
    cur.execute(GOLD_DAILY_DDL)
    cur.execute("""
        INSERT INTO gold_daily_metrics
        SELECT
            date,
            COUNT(*)                                                           AS total_events,
            SUM(CASE WHEN behavior_type = 'pv'   THEN 1 ELSE 0 END)          AS pv_count,
            SUM(CASE WHEN behavior_type = 'cart' THEN 1 ELSE 0 END)          AS cart_count,
            SUM(CASE WHEN behavior_type = 'fav'  THEN 1 ELSE 0 END)          AS fav_count,
            SUM(CASE WHEN behavior_type = 'buy'  THEN 1 ELSE 0 END)          AS buy_count,
            COUNT(DISTINCT user_id)                                           AS unique_users,
            COUNT(DISTINCT item_id)                                           AS unique_items,
            COUNT(DISTINCT category_id)                                       AS unique_categories
        FROM bronze_raw_events
        GROUP BY date
        ORDER BY date;
    """)
    conn.commit()

    # --- Gold Layer: Hourly Patterns ---
    print("[5/7] Populating gold_hourly_patterns …")
    cur.execute(GOLD_HOURLY_DDL)
    cur.execute("""
        INSERT INTO gold_hourly_patterns
        SELECT
            CAST(strftime('%H', timestamp) AS INTEGER)                       AS hour,
            COUNT(*)                                                         AS total_events,
            SUM(CASE WHEN behavior_type = 'pv'   THEN 1 ELSE 0 END)         AS pv_count,
            SUM(CASE WHEN behavior_type = 'cart' THEN 1 ELSE 0 END)         AS cart_count,
            SUM(CASE WHEN behavior_type = 'fav'  THEN 1 ELSE 0 END)         AS fav_count,
            SUM(CASE WHEN behavior_type = 'buy'  THEN 1 ELSE 0 END)         AS buy_count,
            ROUND(COUNT(*) * 1.0 / (SELECT COUNT(DISTINCT date)
                                     FROM bronze_raw_events), 1)             AS avg_daily_events
        FROM bronze_raw_events
        GROUP BY hour
        ORDER BY hour;
    """)
    conn.commit()

    # --- Gold Layer: Category Summary ---
    print("[6/7] Populating gold_category_summary …")
    cur.execute(GOLD_CATEGORY_DDL)
    cur.execute("""
        INSERT INTO gold_category_summary
        SELECT
            category_id,
            COUNT(*)                                                         AS total_events,
            SUM(CASE WHEN behavior_type = 'pv'   THEN 1 ELSE 0 END)         AS pv_count,
            SUM(CASE WHEN behavior_type = 'cart' THEN 1 ELSE 0 END)         AS cart_count,
            SUM(CASE WHEN behavior_type = 'fav'  THEN 1 ELSE 0 END)         AS fav_count,
            SUM(CASE WHEN behavior_type = 'buy'  THEN 1 ELSE 0 END)         AS buy_count,
            COUNT(DISTINCT user_id)                                          AS unique_users,
            COUNT(DISTINCT item_id)                                          AS unique_items
        FROM bronze_raw_events
        GROUP BY category_id
        ORDER BY category_id;
    """)
    conn.commit()

    # --- Gold Layer: User Summary ---
    print("[7/7] Populating gold_user_summary & gold_item_summary …")
    cur.execute(GOLD_USER_DDL)
    cur.execute("""
        INSERT INTO gold_user_summary
        SELECT
            user_id,
            COUNT(*)                                                         AS total_events,
            SUM(CASE WHEN behavior_type = 'pv'   THEN 1 ELSE 0 END)         AS pv_count,
            SUM(CASE WHEN behavior_type = 'cart' THEN 1 ELSE 0 END)         AS cart_count,
            SUM(CASE WHEN behavior_type = 'fav'  THEN 1 ELSE 0 END)         AS fav_count,
            SUM(CASE WHEN behavior_type = 'buy'  THEN 1 ELSE 0 END)         AS buy_count,
            COUNT(DISTINCT date)                                             AS active_days,
            MIN(date)                                                        AS first_seen,
            MAX(date)                                                        AS last_seen
        FROM bronze_raw_events
        GROUP BY user_id
        ORDER BY user_id;
    """)
    conn.commit()

    # --- Gold Layer: Item Summary ---
    cur.execute(GOLD_ITEM_DDL)
    cur.execute("""
        INSERT INTO gold_item_summary
        SELECT
            item_id,
            MAX(category_id)                                                 AS category_id,
            COUNT(*)                                                         AS total_events,
            SUM(CASE WHEN behavior_type = 'pv'   THEN 1 ELSE 0 END)         AS pv_count,
            SUM(CASE WHEN behavior_type = 'cart' THEN 1 ELSE 0 END)         AS cart_count,
            SUM(CASE WHEN behavior_type = 'fav'  THEN 1 ELSE 0 END)         AS fav_count,
            SUM(CASE WHEN behavior_type = 'buy'  THEN 1 ELSE 0 END)         AS buy_count,
            COUNT(DISTINCT user_id)                                          AS unique_users
        FROM bronze_raw_events
        GROUP BY item_id
        ORDER BY item_id;
    """)
    conn.commit()

    # --- Integrity check ---
    cur.execute("PRAGMA integrity_check;")
    integrity = cur.fetchone()[0]
    assert integrity == "ok", f"Integrity check failed: {integrity}"

    # ============================================================================
    # Summary Statistics
    # ============================================================================
    elapsed = time.time() - t0
    print("\n" + "=" * 70)
    print("  DATABASE CREATION COMPLETE")
    print("=" * 70)

    # Row counts
    table_counts = {}
    for tbl in [
        "bronze_raw_events",
        "silver_cleaned_events",
        "gold_daily_metrics",
        "gold_hourly_patterns",
        "gold_category_summary",
        "gold_user_summary",
        "gold_item_summary",
    ]:
        cur.execute(f"SELECT COUNT(*) FROM {tbl};")
        table_counts[tbl] = cur.fetchone()[0]

    print(f"\n  File:          {DB_PATH}")
    print(f"  Size:          {os.path.getsize(DB_PATH) / 1024 / 1024:.2f} MB")
    print(f"  Elapsed:       {elapsed:.1f}s")
    print(f"  Integrity:     {integrity}")
    print(f"\n  Table row counts:")
    for tbl, cnt in table_counts.items():
        print(f"    {tbl:30s}  {cnt:>10,}")

    # Behavior distribution
    print(f"\n  Behavior distribution (bronze):")
    cur.execute("""
        SELECT behavior_type, COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bronze_raw_events), 2)
        FROM bronze_raw_events GROUP BY behavior_type ORDER BY COUNT(*) DESC;
    """)
    for bt, cnt, pct in cur.fetchall():
        print(f"    {bt:6s}  {cnt:>8,}  ({pct}%)")

    # Daily metrics preview
    print(f"\n  gold_daily_metrics:")
    cur.execute("SELECT * FROM gold_daily_metrics ORDER BY date;")
    print(f"    {'Date':12s}  {'Events':>8s}  {'PV':>8s}  {'Cart':>6s}  {'Fav':>6s}  {'Buy':>6s}  {'Users':>6s}  {'Items':>8s}  {'Cats':>5s}")
    for row in cur.fetchall():
        print(f"    {row[0]:12s}  {row[1]:>8,}  {row[2]:>8,}  {row[3]:>6,}  {row[4]:>6,}  {row[5]:>6,}  {row[6]:>6,}  {row[7]:>8,}  {row[8]:>5,}")

    # Hourly preview (first 5)
    print(f"\n  gold_hourly_patterns (first 5):")
    cur.execute("SELECT * FROM gold_hourly_patterns ORDER BY hour LIMIT 5;")
    print(f"    {'Hour':>5s}  {'Events':>8s}  {'PV':>8s}  {'Cart':>6s}  {'Fav':>6s}  {'Buy':>6s}  {'Avg/Day':>8s}")
    for row in cur.fetchall():
        print(f"    {row[0]:>5d}  {row[1]:>8,}  {row[2]:>8,}  {row[3]:>6,}  {row[4]:>6,}  {row[5]:>6,}  {row[6]:>8.1f}")

    # Top 5 categories
    print(f"\n  gold_category_summary (top 5 by events):")
    cur.execute("SELECT * FROM gold_category_summary ORDER BY total_events DESC LIMIT 5;")
    print(f"    {'CatID':>6s}  {'Events':>8s}  {'PV':>8s}  {'Cart':>6s}  {'Fav':>6s}  {'Buy':>6s}  {'Users':>6s}  {'Items':>8s}")
    for row in cur.fetchall():
        print(f"    {row[0]:>6d}  {row[1]:>8,}  {row[2]:>8,}  {row[3]:>6,}  {row[4]:>6,}  {row[5]:>6,}  {row[6]:>6,}  {row[7]:>8,}")

    # User segments
    print(f"\n  User segments (from gold_user_summary):")
    cur.execute("""
        SELECT
            CASE
                WHEN buy_count = 0 THEN 'Browsers Only'
                WHEN buy_count BETWEEN 1 AND 2 THEN 'Occasional Buyers'
                WHEN buy_count BETWEEN 3 AND 5 THEN 'Regular Buyers'
                ELSE 'Power Buyers'
            END AS segment,
            COUNT(*) AS user_count,
            ROUND(AVG(total_events), 1) AS avg_events,
            ROUND(AVG(active_days), 1) AS avg_active_days
        FROM gold_user_summary
        GROUP BY 1 ORDER BY user_count DESC;
    """)
    print(f"    {'Segment':20s}  {'Users':>6s}  {'Avg Events':>10s}  {'Avg Days':>9s}")
    for row in cur.fetchall():
        print(f"    {row[0]:20s}  {row[1]:>6,}  {row[2]:>10,.1f}  {row[3]:>9.1f}")

    # Unique counts
    cur.execute("SELECT COUNT(DISTINCT user_id) FROM bronze_raw_events;")
    unique_users = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT item_id) FROM bronze_raw_events;")
    unique_items = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT category_id) FROM bronze_raw_events;")
    unique_cats = cur.fetchone()[0]

    print(f"\n  Unique counts (bronze):")
    print(f"    Users:      {unique_users:,}")
    print(f"    Items:      {unique_items:,}")
    print(f"    Categories: {unique_cats:,}")

    print(f"\n  Silver layer quality:")
    cur.execute("SELECT COUNT(*) FROM silver_cleaned_events WHERE is_valid = 0;")
    print(f"    Invalid events: {cur.fetchone()[0]:,}")
    cur.execute("SELECT ROUND(AVG(quality_score), 3) FROM silver_cleaned_events WHERE is_valid = 1;")
    print(f"    Avg quality score (valid): {cur.fetchone()[0]}")

    print("\n" + "=" * 70)

    conn.close()
    print("  Done. Database ready at", DB_PATH)
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Play,
  Loader2,
  Database,
  Clock,
  CheckCircle2,
  Table2,
  Terminal,
  AlertCircle,
  Sparkles,
  ShoppingCart,
  CalendarDays,
  Copy,
} from 'lucide-react';
import {
  getDailyDataForMonth as taobaoGetDaily,
  getMonthlySummary as taobaoGetMonthly,
  getCategoryDataForMonth as taobaoGetCategory,
  getSegmentDataForMonth as taobaoGetSegment,
  getAllMonths as taobaoGetAllMonths,
} from '@/data/dashboard-data';
import {
  getDailyDataForMonth as amazonGetDaily,
  getMonthlySummary as amazonGetMonthly,
  getCategoryDataForMonth as amazonGetCategory,
  getSegmentDataForMonth as amazonGetSegment,
  getAllMonths as amazonGetAllMonths,
} from '@/data/amazon-data';
import { ChevronDown } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type DataSource = 'real' | 'mockup' | 'amazon';

interface QueryCatalogItem {
  id: string;
  name: string;
  description: string;
}

interface QueryResult {
  queryId: string;
  queryName: string;
  columns: string[];
  rows: (string | number | null)[][];
  rowCount: number;
  executionTimeMs: number;
}

// ============================================================================
// Query Catalog (shared across all data sources)
// ============================================================================

const QUERY_CATALOG: QueryCatalogItem[] = [
  { id: 'daily-event-breakdown', name: 'Daily Event Breakdown', description: 'Aggregated daily metrics: total events, page views, carts, favorites, purchases, and conversion rate' },
  { id: 'dau-trend', name: 'DAU Trend Analysis', description: 'Daily active users trend with events per user and conversion rate' },
  { id: 'conversion-funnel', name: 'Conversion Funnel', description: 'Overall conversion funnel from Page View → Favorite → Cart → Purchase' },
  { id: 'hourly-patterns', name: 'Hourly Traffic Patterns', description: 'Traffic distribution across 24 hours of the day' },
  { id: 'top-categories', name: 'Top Categories', description: 'Category-level aggregated metrics ranked by total events' },
  { id: 'category-funnel', name: 'Category Funnel Rates', description: 'Per-category conversion funnel: PV→Cart, PV→Buy, Cart→Buy' },
  { id: 'user-segments', name: 'User Segments', description: 'User segmentation by behavior type with engagement metrics' },
  { id: 'top-items', name: 'Top Items by Purchase', description: 'Top items ranked by purchase count with conversion metrics' },
];

// ============================================================================
// Table name maps per data source
// ============================================================================

const TABLE_NAMES: Record<DataSource, { daily: string; hourly: string; category: string; user: string; item: string }> = {
  real: { daily: 'gold_daily_metrics', hourly: 'gold_hourly_patterns', category: 'gold_category_summary', user: 'gold_user_summary', item: 'gold_item_summary' },
  mockup: { daily: 'taobao_mock_daily', hourly: 'taobao_mock_hourly', category: 'taobao_mock_category', user: 'taobao_mock_users', item: 'taobao_mock_items' },
  amazon: { daily: 'amazon_ecommerce_daily', hourly: 'amazon_ecommerce_hourly', category: 'amazon_ecommerce_category', user: 'amazon_ecommerce_users', item: 'amazon_ecommerce_items' },
};

// ============================================================================
// SQL Display per data source
// ============================================================================

function buildSQLDisplay(source: DataSource): Record<string, string> {
  const t = TABLE_NAMES[source];
  return {
    'daily-event-breakdown': `SELECT
  date,
  total_events,
  pv_count,
  cart_count,
  fav_count,
  buy_count,
  unique_users,
  unique_items,
  ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
FROM ${t.daily}
ORDER BY date ASC`,

    'dau-trend': `SELECT
  date,
  unique_users AS dau,
  total_events,
  ROUND(CAST(total_events AS REAL) / NULLIF(unique_users, 0), 2) AS events_per_user,
  ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
FROM ${t.daily}
ORDER BY date ASC`,

    'conversion-funnel': `SELECT
  'Page View'    AS stage,
  SUM(pv_count)  AS count
FROM ${t.daily}
UNION ALL
SELECT 'Favorite', SUM(fav_count) FROM ${t.daily}
UNION ALL
SELECT 'Add to Cart', SUM(cart_count) FROM ${t.daily}
UNION ALL
SELECT 'Purchase', SUM(buy_count) FROM ${t.daily}`,

    'hourly-patterns': `SELECT
  hour,
  total_events,
  pv_count,
  cart_count,
  fav_count,
  buy_count,
  avg_daily_events,
  ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS buy_rate
FROM ${t.hourly}
ORDER BY hour ASC`,

    'top-categories': `SELECT
  category_id,
  total_events,
  pv_count,
  cart_count,
  fav_count,
  buy_count,
  unique_users,
  unique_items,
  ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(total_events, 0), 2) AS conversion_rate
FROM ${t.category}
ORDER BY total_events DESC
LIMIT 20`,

    'category-funnel': `SELECT
  category_id,
  pv_count,
  cart_count,
  fav_count,
  buy_count,
  ROUND(CAST(cart_count AS REAL) * 100.0 / NULLIF(pv_count, 0), 2) AS pv_to_cart_rate,
  ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(pv_count, 0), 2) AS pv_to_buy_rate,
  ROUND(CAST(buy_count AS REAL) * 100.0 / NULLIF(cart_count, 0), 2) AS cart_to_buy_rate
FROM ${t.category}
ORDER BY buy_count DESC
LIMIT 10`,

    'user-segments': `SELECT
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
  FROM ${t.user}
)
GROUP BY segment
ORDER BY user_count DESC`,

    'top-items': `SELECT
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
FROM ${t.item}
ORDER BY buy_count DESC
LIMIT 20`,
  };
}

// ============================================================================
// Animation Variants
// ============================================================================

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const resultVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const rowStagger = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.03, duration: 0.25 },
  }),
};

// ============================================================================
// Helpers
// ============================================================================

function formatCellValue(value: string | number | null): string {
  if (value === null) return '—';
  if (typeof value === 'number') {
    if (Number.isInteger(value) && Math.abs(value) >= 1000) {
      return value.toLocaleString();
    }
    if (!Number.isInteger(value)) {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });
    }
    return value.toLocaleString();
  }
  return String(value);
}

function getGrowthBadge(value: number | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } | null {
  if (value === null) return null;
  if (value > 0) return { label: `+${value}%`, variant: 'default' };
  if (value < 0) return { label: `${value}%`, variant: 'destructive' };
  return { label: '0%', variant: 'secondary' };
}

// Seeded random for consistent hourly patterns
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ============================================================================
// Local result generators for Mockup / Amazon data
// ============================================================================

function generateLocalResults(
  queryId: string,
  source: DataSource,
  year: number,
  month: number,
): QueryResult {
  const getDaily = source === 'mockup' ? taobaoGetDaily : amazonGetDaily;
  const getCategory = source === 'mockup' ? taobaoGetCategory : amazonGetCategory;
  const getSegment = source === 'mockup' ? taobaoGetSegment : amazonGetSegment;
  const queryMeta = QUERY_CATALOG.find(q => q.id === queryId);
  const execTime = Math.floor(12 + Math.random() * 35);

  const daily = getDaily(year, month);
  const categories = getCategory(year, month);
  const segments = getSegment(year, month);

  const startTime = performance.now();

  switch (queryId) {
    case 'daily-event-breakdown': {
      const columns = ['date', 'total_events', 'pv_count', 'cart_count', 'fav_count', 'buy_count', 'unique_users', 'unique_items', 'conversion_rate'];
      const rows: (string | number | null)[][] = daily.map(d => {
        const convRate = d.totalEvents > 0 ? Number(((d.purchases / d.totalEvents) * 100).toFixed(2)) : 0;
        return [d.date, d.totalEvents, d.pageViews, d.carts, d.favorites, d.purchases, d.dau, Math.round(d.pageViews * 0.12), convRate];
      });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'dau-trend': {
      const columns = ['date', 'dau', 'total_events', 'events_per_user', 'conversion_rate'];
      const rows: (string | number | null)[][] = daily.map(d => {
        const eventsPerUser = d.dau > 0 ? Number((d.totalEvents / d.dau).toFixed(2)) : 0;
        const convRate = d.totalEvents > 0 ? Number(((d.purchases / d.totalEvents) * 100).toFixed(2)) : 0;
        return [d.date, d.dau, d.totalEvents, eventsPerUser, convRate];
      });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'conversion-funnel': {
      const columns = ['stage', 'count'];
      const totalPV = daily.reduce((s, d) => s + d.pageViews, 0);
      const totalFav = daily.reduce((s, d) => s + d.favorites, 0);
      const totalCart = daily.reduce((s, d) => s + d.carts, 0);
      const totalBuy = daily.reduce((s, d) => s + d.purchases, 0);
      const rows: (string | number | null)[][] = [
        ['Page View', totalPV],
        ['Favorite', totalFav],
        ['Add to Cart', totalCart],
        ['Purchase', totalBuy],
      ];
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'hourly-patterns': {
      const columns = ['hour', 'total_events', 'pv_count', 'cart_count', 'fav_count', 'buy_count', 'avg_daily_events', 'buy_rate'];
      const hourlyPattern = source === 'amazon'
        ? [0.12, 0.06, 0.04, 0.03, 0.04, 0.07, 0.15, 0.30, 0.55, 0.70, 0.78, 0.82, 0.85, 0.68, 0.62, 0.66, 0.72, 0.82, 0.92, 0.96, 0.88, 0.70, 0.48, 0.28]
        : [0.15, 0.08, 0.05, 0.04, 0.05, 0.08, 0.18, 0.35, 0.60, 0.75, 0.82, 0.88, 0.78, 0.72, 0.68, 0.74, 0.82, 0.90, 0.95, 0.85, 0.72, 0.55, 0.40, 0.25];
      const rows: (string | number | null)[][] = Array.from({ length: 24 }, (_, h) => {
        const hourEvents = daily.reduce((s, d) => {
          const seed = d.day * 100 + h;
          const noise = 0.9 + seededRandom(seed) * 0.2;
          return s + Math.round(d.totalEvents * hourlyPattern[h] * noise / daily.length);
        }, 0);
        const pvCount = Math.round(hourEvents * 0.85);
        const cartCount = Math.round(hourEvents * 0.08);
        const favCount = Math.round(hourEvents * 0.04);
        const buyCount = Math.round(hourEvents * 0.03);
        const avgDaily = daily.length > 0 ? Math.round(hourEvents / daily.length) : 0;
        const buyRate = hourEvents > 0 ? Number(((buyCount / hourEvents) * 100).toFixed(2)) : 0;
        return [h, hourEvents, pvCount, cartCount, favCount, buyCount, avgDaily, buyRate];
      });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'top-categories': {
      const columns = ['category_id', 'total_events', 'pv_count', 'cart_count', 'fav_count', 'buy_count', 'unique_users', 'unique_items', 'conversion_rate'];
      const rows: (string | number | null)[][] = categories
        .sort((a, b) => (b.views + b.carts + b.favorites + b.purchases) - (a.views + a.carts + a.favorites + a.purchases))
        .slice(0, 20)
        .map((c, i) => {
          const totalEvents = c.views + c.carts + c.favorites + c.purchases;
          const uniqueUsers = Math.round(c.views * 0.15);
          const uniqueItems = Math.round(c.purchases * 2.5);
          const convRate = totalEvents > 0 ? Number(((c.purchases / totalEvents) * 100).toFixed(2)) : 0;
          return [c.category, totalEvents, c.views, c.carts, c.favorites, c.purchases, uniqueUsers, uniqueItems, convRate];
        });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'category-funnel': {
      const columns = ['category_id', 'pv_count', 'cart_count', 'fav_count', 'buy_count', 'pv_to_cart_rate', 'pv_to_buy_rate', 'cart_to_buy_rate'];
      const rows: (string | number | null)[][] = categories
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 10)
        .map(c => {
          const pvToCart = c.views > 0 ? Number(((c.carts / c.views) * 100).toFixed(2)) : 0;
          const pvToBuy = c.views > 0 ? Number(((c.purchases / c.views) * 100).toFixed(2)) : 0;
          const cartToBuy = c.carts > 0 ? Number(((c.purchases / c.carts) * 100).toFixed(2)) : 0;
          return [c.category, c.views, c.carts, c.favorites, c.purchases, pvToCart, pvToBuy, cartToBuy];
        });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'user-segments': {
      const columns = ['segment', 'user_count', 'total_events', 'total_purchases', 'avg_events_per_user', 'avg_active_days'];
      const rows: (string | number | null)[][] = segments
        .sort((a, b) => b.count - a.count)
        .map(s => {
          const segmentName = s.segment.toLowerCase().replace(/\s+/g, '_');
          const totalEvents = Math.round(s.count * s.avgEventsPerUser);
          const totalPurchases = Math.round(s.count * (s.purchaseRate / 100));
          const avgActiveDays = Math.round(5 + seededRandom(s.count) * 20);
          return [segmentName, s.count, totalEvents, totalPurchases, s.avgEventsPerUser, avgActiveDays];
        });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    case 'top-items': {
      const columns = ['item_id', 'category_id', 'total_events', 'pv_count', 'cart_count', 'fav_count', 'buy_count', 'unique_users', 'conversion_rate', 'purchases_per_user'];
      const rows: (string | number | null)[][] = categories
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 20)
        .map((c, i) => {
          const totalEvents = c.views + c.carts + c.favorites + c.purchases;
          const uniqueUsers = Math.round(c.views * 0.15);
          const convRate = totalEvents > 0 ? Number(((c.purchases / totalEvents) * 100).toFixed(2)) : 0;
          const purchasesPerUser = uniqueUsers > 0 ? Number((c.purchases / uniqueUsers).toFixed(2)) : 0;
          const itemId = source === 'mockup' ? 1000 + i * 37 : 5000 + i * 41;
          return [itemId, c.category, totalEvents, c.views, c.carts, c.favorites, c.purchases, uniqueUsers, convRate, purchasesPerUser];
        });
      return { queryId, queryName: queryMeta?.name ?? '', columns, rows, rowCount: rows.length, executionTimeMs: execTime };
    }

    default:
      return { queryId, queryName: queryMeta?.name ?? '', columns: [], rows: [], rowCount: 0, executionTimeMs: execTime };
  }
}

// ============================================================================
// SQL Syntax Highlighter (simple token-based)
// ============================================================================

function highlightSQL(sql: string): React.ReactNode[] {
  const keywords = new Set([
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AND', 'OR', 'NOT', 'NULL', 'AS', 'IN', 'BETWEEN', 'LIKE',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'ALL', 'WITH',
    'SET', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
    'TABLE', 'INDEX', 'VIEW', 'INTO', 'VALUES', 'DESC', 'ASC',
    'EXISTS', 'OVER', 'PARTITION', 'WINDOW', 'FILTER', 'IF', 'IS',
    'TRUE', 'FALSE', 'INTERVAL', 'CURRENT_DATE', 'DATE_TRUNC',
  ]);

  const functions = new Set([
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'COALESCE', 'NULLIF',
    'DATEDIFF', 'DATE', 'TO_CHAR', 'EXTRACT', 'LAG', 'LEAD', 'ROW_NUMBER',
  ]);

  const lines = sql.split('\n');
  const result: React.ReactNode[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const tokens = line.match(/\S+/g) || [];
    let charOffset = 0;

    if (lineIdx > 0) result.push(<br key={`br-${lineIdx}`} />);

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      const tokenStart = line.indexOf(token, charOffset);
      if (tokenStart > charOffset) {
        result.push(
          <span key={`ws-${lineIdx}-${t}`}>
            {'\u00A0'.repeat(tokenStart - charOffset)}
          </span>
        );
      }

      let className = 'text-emerald-300/70';
      if (keywords.has(token.toUpperCase())) {
        className = 'text-amber-400 font-semibold';
      } else if (functions.has(token.toUpperCase())) {
        className = 'text-cyan-400';
      } else if (/^\d+(\.\d+)?$/.test(token)) {
        className = 'text-fuchsia-400';
      } else if (/^['"]/.test(token)) {
        className = 'text-orange-300';
      } else if (/^[(),*]$/.test(token)) {
        className = 'text-slate-400';
      } else if (/^--/.test(token)) {
        className = 'text-slate-500 italic';
      }

      result.push(
        <span key={`tok-${lineIdx}-${t}`} className={className}>
          {token}
        </span>
      );
      charOffset = tokenStart + token.length;
    }
  }

  return result;
}

// ============================================================================
// Data Source Toggle Component (matches dashboard-previews.tsx style)
// ============================================================================

function DataSourceToggle({ current, onChange }: { current: DataSource; onChange: (s: DataSource) => void }) {
  const sources: { key: DataSource; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'real', label: 'Real Data', icon: <Database className="h-3.5 w-3.5" />, color: 'text-emerald-500' },
    { key: 'mockup', label: 'Taobao Mockup', icon: <Sparkles className="h-3.5 w-3.5" />, color: 'text-amber-500' },
    { key: 'amazon', label: 'Amazon Data', icon: <ShoppingCart className="h-3.5 w-3.5" />, color: 'text-orange-500' },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
      {sources.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            current === s.key
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <span className={current === s.key ? s.color : ''}>{s.icon}</span>
          <span className="hidden sm:inline">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Month/Year Selector Component (matches dashboard-previews.tsx style)
// ============================================================================

function MonthYearSelector({ year, month, onChange, months }: { year: number; month: number; onChange: (y: number, m: number) => void; months: { year: number; month: number; label: string }[] }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
      <select
        value={`${year}-${String(month).padStart(2, '0')}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-').map(Number);
          onChange(y, m);
        }}
        className="appearance-none bg-background text-foreground text-sm font-medium px-2 py-1.5 pr-7 cursor-pointer focus:outline-none rounded-md border-0"
      >
        {months.map((m) => (
          <option key={`${m.year}-${m.month}`} value={`${m.year}-${String(m.month).padStart(2, '0')}`} className="bg-background text-foreground">
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground -ml-5 pointer-events-none" />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SQLPlayground() {
  // Data source state
  const [dataSource, setDataSource] = useState<DataSource>('real');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(12);

  // Query catalog (always local, same for all sources)
  const queries = QUERY_CATALOG;

  // Selected query & editor state
  const [selectedQueryId, setSelectedQueryId] = useState<string>('');
  const [queryEditorContent, setQueryEditorContent] = useState<string>('');

  // Query execution state
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Build SQL display based on current data source
  const sqlDisplay = useMemo(() => buildSQLDisplay(dataSource), [dataSource]);

  // Initialize with first query on mount / data source change
  useEffect(() => {
    const firstId = queries[0].id;
    setSelectedQueryId(firstId);
    setQueryEditorContent(sqlDisplay[firstId] ?? '-- SQL not available --');
    setResultVisible(false);
    setResult(null);
    setRunError(null);
  }, [dataSource, sqlDisplay]);

  const currentQuery = queries.find((q) => q.id === selectedQueryId);

  const handleQueryChange = useCallback((value: string) => {
    setSelectedQueryId(value);
    setQueryEditorContent(sqlDisplay[value] ?? '-- SQL not available --');
    setResultVisible(false);
    setResult(null);
    setRunError(null);
  }, [sqlDisplay]);

  const handleRunQuery = useCallback(async () => {
    if (isRunning || !selectedQueryId) return;
    setIsRunning(true);
    setResultVisible(false);
    setResult(null);
    setRunError(null);

    try {
      let data: QueryResult;

      if (dataSource === 'real') {
        // Fetch from API
        const res = await fetch(`/api/taobao/sql-query?q=${encodeURIComponent(selectedQueryId)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? `HTTP ${res.status}: ${res.statusText}`);
        }
        data = await res.json();
      } else {
        // Generate locally from mockup data
        // Simulate a small delay for realistic feel
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
        data = generateLocalResults(selectedQueryId, dataSource, selectedYear, selectedMonth);
      }

      setResult(data);
      setResultVisible(true);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsRunning(false);

      // Scroll to results on mobile
      if (tableRef.current && window.innerWidth < 1024) {
        setTimeout(() => {
          tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [isRunning, selectedQueryId, dataSource, selectedYear, selectedMonth]);

  const handleCopySQL = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(queryEditorContent);
      toast.success('Query copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  }, [queryEditorContent]);

  const dbName = dataSource === 'real' ? 'analytics_warehouse' : dataSource === 'mockup' ? 'taobao_mockup_db' : 'amazon_ecommerce_db';

  return (
    <section id="sql-playground" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ================================================================== */}
        {/* Header                                                            */}
        {/* ================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium mb-4">
            <Terminal className="h-4 w-4" />
            Interactive Analytics
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            SQL Playground
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            Explore the analytics warehouse with interactive queries — select
            a data source, choose a query, review the SQL, and see formatted results
          </p>

          {/* Data Source Toggle + Month Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <DataSourceToggle current={dataSource} onChange={setDataSource} />
            {dataSource !== 'real' && (
              <MonthYearSelector
                year={selectedYear}
                month={selectedMonth}
                onChange={(y, m) => { setSelectedYear(y); setSelectedMonth(m); }}
                months={dataSource === 'mockup' ? taobaoGetAllMonths() : amazonGetAllMonths()}
              />
            )}
          </div>

          {/* Data source info badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Database className="h-3.5 w-3.5" />
              {dataSource === 'real' ? 'Alibaba Taobao (Kaggle Real)' : dataSource === 'mockup' ? 'Taobao Mockup (Simulated)' : 'Amazon E-Commerce (Kaggle Simulated)'}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {dataSource === 'real' ? 'Nov 25 – Dec 3, 2017' : `${selectedMonth <= 6 ? 'Jan – Jun' : 'Jul – Dec'} ${selectedYear}`}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              8 queries
            </Badge>
          </div>
        </motion.div>

        {/* ================================================================== */}
        {/* Query Editor Panel                                                 */}
        {/* ================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Left Panel: Query Editor */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="rounded-lg p-2 bg-muted">
                    <Database className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">Query Editor</CardTitle>
                    <CardDescription className="text-xs">
                      Select a query and run it against the warehouse
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 flex-1">
              {/* Query Selector */}
              <Select
                value={selectedQueryId}
                onValueChange={handleQueryChange}
                disabled={catalogLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a query…" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {queries.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      <span className="flex items-center gap-2">
                        <Table2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{q.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Query Description */}
              {!catalogLoading && currentQuery && (
                <p className="text-xs text-muted-foreground">
                  {currentQuery.description}
                </p>
              )}

              {/* SQL Editor Area */}
              <div className="relative flex-1 min-h-[280px] rounded-lg border border-border/50 overflow-hidden">
                {/* Editor header bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {dbName}
                  </span>
                  <button
                    onClick={handleCopySQL}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                    aria-label="Copy SQL to clipboard"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* SQL content */}
                <div className="p-4 bg-zinc-950 overflow-auto max-h-[340px] custom-scrollbar">
                  <pre className="text-[13px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                    {queryEditorContent ? highlightSQL(queryEditorContent) : (
                      <span className="text-zinc-600">-- Select a query above</span>
                    )}
                  </pre>
                </div>
              </div>

              {/* Run Button */}
              <Button
                onClick={handleRunQuery}
                disabled={isRunning || !selectedQueryId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing query…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Query
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right Panel: Results */}
          <Card className="flex flex-col" ref={tableRef}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="rounded-lg p-2 bg-muted">
                    <Table2 className="h-4 w-4 text-teal-500" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">Query Results</CardTitle>
                    <CardDescription className="text-xs">
                      {result ? result.queryName : (currentQuery?.name ?? '—')}
                    </CardDescription>
                  </div>
                </div>

                {resultVisible && result && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Success
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {result.executionTimeMs}ms
                    </Badge>
                  </div>
                )}

                {runError && (
                  <Badge variant="destructive" className="text-xs gap-1 shrink-0">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-[280px]">
              <AnimatePresence mode="wait">
                {isRunning ? (
                  /* ---- Loading State ---- */
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center space-y-3 py-10">
                      <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Executing query…
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {dataSource === 'real'
                            ? 'Running against the analytics warehouse'
                            : `Querying ${dataSource === 'mockup' ? 'Taobao mockup' : 'Amazon'} data for ${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : runError ? (
                  /* ---- Error State ---- */
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center space-y-3 py-10 px-4">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Query execution failed
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                          {runError}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunQuery}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  </motion.div>
                ) : resultVisible && result ? (
                  /* ---- Results State ---- */
                  <motion.div
                    key="results"
                    variants={resultVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex flex-col flex-1"
                  >
                    {/* Row count badge */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {result.rowCount} rows × {result.columns.length} columns
                      </Badge>
                      {dataSource !== 'real' && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          {dataSource === 'mockup' ? 'Mockup Data' : 'Amazon Data'}
                        </Badge>
                      )}
                    </div>

                    {/* Results Table */}
                    <div className="rounded-lg border overflow-auto max-h-[420px] custom-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/60 hover:bg-muted/60">
                            {result.columns.map((col) => (
                              <TableHead
                                key={col}
                                className="text-xs font-semibold text-foreground whitespace-nowrap px-3 py-2.5"
                              >
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.rows.map((row, rowIdx) => (
                            <motion.tr
                              key={rowIdx}
                              custom={rowIdx}
                              variants={rowStagger}
                              initial="hidden"
                              animate="visible"
                              className={`border-b transition-colors last:border-0 ${
                                rowIdx % 2 === 0
                                  ? 'bg-background'
                                  : 'bg-muted/30'
                              } hover:bg-muted/50`}
                            >
                              {row.map((cell, cellIdx) => {
                                const growth = (result.columns[cellIdx].toLowerCase().includes('growth') ||
                                  result.columns[cellIdx].toLowerCase().includes('share'))
                                  ? getGrowthBadge(typeof cell === 'number' ? cell : null)
                                  : null;

                                return (
                                  <TableCell
                                    key={cellIdx}
                                    className="text-xs px-3 py-2 whitespace-nowrap tabular-nums"
                                  >
                                    {growth ? (
                                      <span className="flex items-center gap-1.5">
                                        <span>{formatCellValue(cell)}</span>
                                        <Badge
                                          variant={growth.variant}
                                          className="text-[10px] px-1.5 py-0 h-4 font-medium"
                                        >
                                          {growth.label}
                                        </Badge>
                                      </span>
                                    ) : (
                                      formatCellValue(cell)
                                    )}
                                  </TableCell>
                                );
                              })}
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </motion.div>
                ) : (
                  /* ---- Empty State ---- */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center space-y-3 py-10">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <Play className="h-5 w-5 text-muted-foreground ml-0.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          No results yet
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Select a query and click &quot;Run Query&quot; to see results
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

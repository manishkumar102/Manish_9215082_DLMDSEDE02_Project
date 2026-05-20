'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Users,
  Target,
  ShoppingCart,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  Package,
  Activity,
  ArrowUpDown,
  Database,
  CalendarDays,
  Sparkles,
  Eye,
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
// Color Palette (NO blue/indigo)
// ============================================================================

const COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  fuchsia: '#d946ef',
  rose: '#f43f5e',
  orange: '#f97316',
  lime: '#84cc16',
  pink: '#ec4899',
  slate: '#64748b',
};

const CHART_COLORS = [
  COLORS.emerald, COLORS.teal, COLORS.amber, COLORS.cyan,
  COLORS.fuchsia, COLORS.rose, COLORS.orange, COLORS.lime,
];

type DataSource = 'real' | 'mockup' | 'amazon';

// ============================================================================
// API Types
// ============================================================================

interface StatsData {
  totalEvents: number;
  uniqueUsers: number;
  uniqueItems: number;
  uniqueCategories: number;
  totalDays: number;
  totalPurchases: number;
  overallConversionRate: number;
  avgDAU: number;
  peakDAU: number;
  totalPV: number;
  totalCart: number;
  totalFav: number;
}

interface DailyMetric {
  date: string;
  total_events: number;
  pv_count: number;
  cart_count: number;
  fav_count: number;
  buy_count: number;
  unique_users: number;
  unique_items: number;
  unique_categories: number;
}

interface HourlyPattern {
  hour: number;
  total_events: number;
  pv_count: number;
  cart_count: number;
  fav_count: number;
  buy_count: number;
  avg_daily_events: number;
}

interface CategorySummary {
  category_id: number;
  total_events: number;
  pv_count: number;
  cart_count: number;
  fav_count: number;
  buy_count: number;
  unique_users: number;
  unique_items: number;
  conversion_rate: number;
}

interface SegmentSummary {
  segment: string;
  userCount: number;
  totalEvents: number;
  totalPurchases: number;
  avgEventsPerUser: number;
}

interface SegmentResponse {
  segments: SegmentSummary[];
  totalUsers: number;
}

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  rate: number;
}

interface FunnelResponse {
  stages: FunnelStage[];
  totalEvents: number;
}

interface ItemTop {
  item_id: number;
  category_id: number;
  total_events: number;
  pv_count: number;
  cart_count: number;
  fav_count: number;
  buy_count: number;
  unique_users: number;
  conversion_rate: number;
}

// ============================================================================
// Animation Variants
// ============================================================================

const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const cardStagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// ============================================================================
// Chart Type Toggle Component
// ============================================================================

function ChartTypeToggle({
  current,
  onChange,
}: {
  current: string;
  onChange: (type: string) => void;
}) {
  const types = [
    { key: 'line', icon: LineChartIcon, label: 'Line' },
    { key: 'area', icon: Activity, label: 'Area' },
    { key: 'bar', icon: BarChart3, label: 'Bar' },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5">
      {types.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-sm p-1 transition-colors ${
            current === t.key
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.label}
        >
          <t.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Axis Toggle Component
// ============================================================================

function AxisToggle({
  showX,
  showY,
  onToggleX,
  onToggleY,
}: {
  showX: boolean;
  showY: boolean;
  onToggleX: () => void;
  onToggleY: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleX}
        className={`rounded p-1 transition-colors ${
          showX
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Toggle X-axis"
      >
        <ArrowUpDown className="h-3.5 w-3.5 rotate-90" />
      </button>
      <button
        onClick={onToggleY}
        className={`rounded p-1 transition-colors ${
          showY
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Toggle Y-axis"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ============================================================================
// Chart Card Wrapper
// ============================================================================

function ChartCard({
  title,
  description,
  icon,
  children,
  toolbar,
  index = 0,
  className = '',
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardStagger}
      initial="hidden"
      animate="visible"
    >
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {icon}
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-xs truncate">{description}</CardDescription>
                )}
              </div>
            </div>
            {toolbar && (
              <div className="flex items-center gap-1 shrink-0">
                {toolbar}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtComma(n: number): string {
  return Math.round(n).toLocaleString();
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.toLocaleString('en', { month: 'short' })} ${d.getDate()}`;
}

function fmtHour(hour: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}${ampm}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

// ============================================================================
// Common Axis Props
// ============================================================================

function xAxisProps(show: boolean, dataKey = 'date', tickFormatter?: (v: string) => string) {
  return show
    ? {
        dataKey,
        tickLine: false,
        axisLine: false,
        tickMargin: 8,
        interval: 'preserveStartEnd' as const,
        fontSize: 11,
        tickFormatter: tickFormatter || undefined,
      }
    : { hide: true as const };
}

function yAxisProps(show: boolean, formatter?: (v: number) => string, domain?: [number | string, number | string]) {
  return show
    ? {
        tickLine: false,
        axisLine: false,
        tickMargin: 8,
        tickFormatter: formatter,
        fontSize: 11,
        width: 55,
        domain: domain || undefined,
      }
    : { hide: true as const };
}

// ============================================================================
// Adapter Functions (transform mockup data → API shapes)
// ============================================================================

// Adapter: Transform mockup daily data into DailyMetric shape
function adaptDailyToMetrics(daily: Array<{date: string; totalEvents: number; pageViews: number; carts: number; favorites: number; purchases: number; dau: number}>): DailyMetric[] {
  return daily.map(d => ({
    date: d.date,
    total_events: d.totalEvents,
    pv_count: d.pageViews,
    cart_count: d.carts,
    fav_count: d.favorites,
    buy_count: d.purchases,
    unique_users: d.dau,
    unique_items: 0,
    unique_categories: 0,
  }));
}

// Adapter: Transform mockup monthly summary into StatsData shape
function adaptMonthlyToStats(summary: {totalUsers: number; avgDAU: number; peakDAU: number; totalPageViews: number; totalPurchases: number; totalEvents: number; avgConversionRate: number; totalFavorites: number; totalCarts: number}, totalDays: number): StatsData {
  return {
    totalEvents: summary.totalEvents,
    uniqueUsers: summary.totalUsers,
    uniqueItems: Math.round(summary.totalPageViews * 0.12), // estimate
    uniqueCategories: 5,
    totalDays,
    totalPurchases: summary.totalPurchases,
    overallConversionRate: Number(summary.avgConversionRate.toFixed(2)),
    avgDAU: summary.avgDAU,
    peakDAU: summary.peakDAU,
    totalPV: summary.totalPageViews,
    totalCart: summary.totalCarts,
    totalFav: summary.totalFavorites,
  };
}

// Adapter: Transform mockup category data into CategorySummary shape
function adaptCategoryToSummary(categories: Array<{category: string; views: number; carts: number; favorites: number; purchases: number; conversionRate: number}>): CategorySummary[] {
  return categories.map((c, i) => ({
    category_id: i + 1,
    total_events: c.views + c.carts + c.favorites + c.purchases,
    pv_count: c.views,
    cart_count: c.carts,
    fav_count: c.favorites,
    buy_count: c.purchases,
    unique_users: Math.round(c.views * 0.15),
    unique_items: Math.round(c.purchases * 2.5),
    conversion_rate: c.conversionRate,
  }));
}

// Adapter: Transform mockup segment data into SegmentSummary shape
function adaptSegmentToSummary(segments: Array<{segment: string; count: number; purchaseRate: number; avgEventsPerUser: number}>): SegmentSummary[] {
  return segments.map(s => ({
    segment: s.segment.toLowerCase().replace(/\s+/g, '_'),
    userCount: s.count,
    totalEvents: Math.round(s.count * s.avgEventsPerUser),
    totalPurchases: Math.round(s.count * (s.purchaseRate / 100)),
    avgEventsPerUser: Math.round(s.avgEventsPerUser),
  }));
}

// ============================================================================
// Data Source Toggle Component
// ============================================================================

function DataSourceToggle({ current, onChange }: { current: DataSource; onChange: (s: DataSource) => void }) {
  const sources: { key: DataSource; label: string; icon: React.ReactNode; activeBg: string; color: string }[] = [
    { key: 'real', label: 'Real Data', icon: <Database className="h-3.5 w-3.5" />, activeBg: 'bg-emerald-500/15', color: 'text-emerald-500' },
    { key: 'mockup', label: 'Taobao Mockup', icon: <Sparkles className="h-3.5 w-3.5" />, activeBg: 'bg-amber-500/15', color: 'text-amber-500' },
    { key: 'amazon', label: 'Amazon Data', icon: <ShoppingCart className="h-3.5 w-3.5" />, activeBg: 'bg-orange-500/15', color: 'text-orange-500' },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {sources.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            current === s.key
              ? `${s.activeBg} shadow-sm ${s.color}`
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
// Month/Year Selector Component
// ============================================================================

function MonthYearSelector({ year, month, onChange, months }: { year: number; month: number; onChange: (y: number, m: number) => void; months: { year: number; month: number; label: string }[] }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <select
        value={`${year}-${String(month).padStart(2, '0')}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-').map(Number);
          onChange(y, m);
        }}
        className="appearance-none bg-background text-foreground text-sm font-medium px-2 py-1.5 pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-md border border-border"
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
// KPI Card Component (simplified for real data — no sparklines, no trends)
// ============================================================================

function KPICard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold mt-0.5 tabular-nums">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div className={`${color} rounded-lg p-2.5 bg-muted`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Custom Pie Label
// ============================================================================

function pieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-white text-xs font-medium"
    >
      {percent > 0.07 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center mb-6">
        <Skeleton className="h-9 w-80 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DashboardPreviews() {
  // Data state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [hourlyPatterns, setHourlyPatterns] = useState<HourlyPattern[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [userSegments, setUserSegments] = useState<SegmentSummary[]>([]);
  const [itemTop, setItemTop] = useState<ItemTop[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<FunnelStage[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart toggle states
  const [dauChartType, setDauChartType] = useState('area');
  const [eventsChartType, setEventsChartType] = useState('bar');
  const [hourlyChartType, setHourlyChartType] = useState('area');
  const [buyTrendChartType, setBuyTrendChartType] = useState('line');
  const [dauShowX, setDauShowX] = useState(true);
  const [dauShowY, setDauShowY] = useState(true);
  const [eventsShowX, setEventsShowX] = useState(true);
  const [eventsShowY, setEventsShowY] = useState(true);

  // Data source toggle + month/year selector
  const [dataSource, setDataSource] = useState<DataSource>('real');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(12);

  // Fetch all data based on data source
  useEffect(() => {
    if (dataSource === 'real') {
      // existing API fetch code (unchanged)
      let cancelled = false;
      async function fetchData() {
        try {
          setLoading(true);
          const endpoints = [
            { url: '/api/taobao/stats', setter: (d: StatsData) => setStats(d.error ? null : d) },
            { url: '/api/taobao/daily-metrics', setter: (d: DailyMetric[]) => setDailyMetrics(Array.isArray(d) ? d : []) },
            { url: '/api/taobao/hourly-patterns', setter: (d: HourlyPattern[]) => setHourlyPatterns(Array.isArray(d) ? d : []) },
            { url: '/api/taobao/category-summary', setter: (d: CategorySummary[]) => setCategorySummary(Array.isArray(d) ? d : []) },
          ];
          const results = await Promise.allSettled(
            endpoints.map((e) => fetch(e.url).then((r) => r.json()))
          );
          for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'fulfilled' && !cancelled) {
              endpoints[i].setter(results[i].value);
            }
          }
          const segRes = await fetch('/api/taobao/user-segments');
          if (!cancelled) {
            const segData: SegmentResponse = await segRes.json();
            setUserSegments(segData.segments || []);
          }
          const itemRes = await fetch('/api/taobao/item-top');
          if (!cancelled) {
            const itemData: ItemTop[] = await itemRes.json();
            setItemTop(itemData);
          }
          const funnelRes = await fetch('/api/taobao/conversion-funnel');
          if (!cancelled) {
            const funnelData: FunnelResponse = await funnelRes.json();
            setConversionFunnel(funnelData.stages || []);
          }
        } catch (err) {
          if (!cancelled) setError('Failed to load dashboard data');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      fetchData();
      return () => { cancelled = true; };
    } else {
      // Use mockup or amazon data
      const getDaily = dataSource === 'mockup' ? taobaoGetDaily : amazonGetDaily;
      const getMonthly = dataSource === 'mockup' ? taobaoGetMonthly : amazonGetMonthly;
      const getCategory = dataSource === 'mockup' ? taobaoGetCategory : amazonGetCategory;
      const getSegment = dataSource === 'mockup' ? taobaoGetSegment : amazonGetSegment;

      const daily = getDaily(selectedYear, selectedMonth);
      const monthly = getMonthly(selectedYear, selectedMonth);
      const categories = getCategory(selectedYear, selectedMonth);
      const segments = getSegment(selectedYear, selectedMonth);

      if (monthly) {
        setStats(adaptMonthlyToStats(monthly, daily.length));
      }
      setDailyMetrics(adaptDailyToMetrics(daily));
      setCategorySummary(adaptCategoryToSummary(categories));
      setUserSegments(adaptSegmentToSummary(segments));

      // Generate hourly patterns from daily data
      const hourlyArr: HourlyPattern[] = Array.from({ length: 24 }, (_, h) => {
        const hourEvents = daily.reduce((s, d) => {
          const seed = d.day * 100 + h;
          const pattern = [0.05, 0.03, 0.02, 0.02, 0.02, 0.04, 0.08, 0.20, 0.45, 0.60, 0.70, 0.75, 0.65, 0.58, 0.55, 0.60, 0.68, 0.78, 0.85, 0.75, 0.62, 0.45, 0.30, 0.15];
          return s + Math.round(d.totalEvents * pattern[h] * (0.9 + (Math.sin(seed * 9301 + 49297) * 49297 % 1) * 0.2));
        }, 0);
        return {
          hour: h,
          total_events: hourEvents,
          pv_count: Math.round(hourEvents * 0.85),
          cart_count: Math.round(hourEvents * 0.08),
          fav_count: Math.round(hourEvents * 0.04),
          buy_count: Math.round(hourEvents * 0.03),
          avg_daily_events: Math.round(hourEvents / daily.length),
        };
      });
      setHourlyPatterns(hourlyArr);

      // Mock funnel
      const totalPV = daily.reduce((s, d) => s + d.pageViews, 0);
      const totalFav = daily.reduce((s, d) => s + d.favorites, 0);
      const totalCart = daily.reduce((s, d) => s + d.carts, 0);
      const totalBuy = daily.reduce((s, d) => s + d.purchases, 0);
      setConversionFunnel([
        { stage: 'pv', label: 'Page Views', count: totalPV, rate: 100 },
        { stage: 'fav', label: 'Favorites', count: totalFav, rate: Number(((totalFav / Math.max(totalPV, 1)) * 100).toFixed(2)) },
        { stage: 'cart', label: 'Add to Cart', count: totalCart, rate: Number(((totalCart / Math.max(totalPV, 1)) * 100).toFixed(2)) },
        { stage: 'buy', label: 'Purchases', count: totalBuy, rate: Number(((totalBuy / Math.max(totalPV, 1)) * 100).toFixed(2)) },
      ]);

      // Mock top items
      setItemTop(categories.slice(0, 5).map((c, i) => ({
        item_id: 1000 + i,
        category_id: i + 1,
        total_events: c.views + c.carts + c.purchases,
        pv_count: c.views,
        cart_count: c.carts,
        fav_count: c.favorites,
        buy_count: c.purchases,
        unique_users: Math.round(c.views * 0.15),
        conversion_rate: c.conversionRate,
      })));

      setLoading(false);
      setError(null);
    }
  }, [dataSource, selectedYear, selectedMonth]);

  // ---- Derived Data ----

  // Behavior distribution (computed from stats)
  const behaviorPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Page Views', value: stats.totalPV, fill: COLORS.teal },
      { name: 'Cart Adds', value: stats.totalCart, fill: COLORS.cyan },
      { name: 'Favorites', value: stats.totalFav, fill: COLORS.amber },
      { name: 'Purchases', value: stats.totalPurchases, fill: COLORS.rose },
    ];
  }, [stats]);

  // DAU chart data from daily metrics
  const dauChartData = useMemo(
    () =>
      dailyMetrics.map((d) => ({
        date: d.date,
        unique_users: d.unique_users,
      })),
    [dailyMetrics]
  );

  // Events by day
  const eventsChartData = useMemo(
    () =>
      dailyMetrics.map((d) => ({
        date: d.date,
        total_events: d.total_events,
      })),
    [dailyMetrics]
  );

  // Hourly chart data
  const hourlyChartData = useMemo(
    () =>
      hourlyPatterns.map((h) => ({
        hour: h.hour,
        total_events: h.total_events,
        hourLabel: fmtHour(h.hour),
      })),
    [hourlyPatterns]
  );

  // Purchase trend data
  const buyTrendData = useMemo(
    () =>
      dailyMetrics.map((d) => ({
        date: d.date,
        buy_count: d.buy_count,
      })),
    [dailyMetrics]
  );

  // Funnel data for horizontal bar
  const funnelBarData = useMemo(() => {
    if (conversionFunnel.length === 0) return [];
    const stageOrder = ['pv', 'fav', 'cart', 'buy'];
    const stageLabels: Record<string, string> = {
      pv: 'Page Views',
      fav: 'Favorites',
      cart: 'Add to Cart',
      buy: 'Purchases',
    };
    const stageColors: Record<string, string> = {
      pv: COLORS.emerald,
      fav: COLORS.amber,
      cart: COLORS.cyan,
      buy: COLORS.rose,
    };
    return stageOrder
      .map((s) => {
        const stage = conversionFunnel.find((f) => f.stage === s);
        if (!stage) return null;
        return {
          stage: stageLabels[s] || stage.label,
          count: stage.count,
          fill: stageColors[s],
        };
      })
      .filter(Boolean);
  }, [conversionFunnel]);

  // Top 10 categories by events
  const topCategories = useMemo(
    () => categorySummary.slice(0, 10),
    [categorySummary]
  );

  // User segment pie data
  const segmentPieData = useMemo(
    () =>
      userSegments.map((s, i) => ({
        name: formatSegmentName(s.segment),
        value: s.userCount,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [userSegments]
  );

  // Top 10 items
  const topItems = useMemo(() => itemTop.slice(0, 10), [itemTop]);

  // Avg DAU for reference line
  const avgDAU = useMemo(
    () =>
      dailyMetrics.length > 0
        ? Math.round(
            dailyMetrics.reduce((s, d) => s + d.unique_users, 0) /
              dailyMetrics.length
          )
        : 0,
    [dailyMetrics]
  );

  // Avg hourly events for reference line
  const avgHourlyEvents = useMemo(
    () =>
      hourlyPatterns.length > 0
        ? Math.round(
            hourlyPatterns.reduce((s, h) => s + h.total_events, 0) /
              hourlyPatterns.length
          )
        : 0,
    [hourlyPatterns]
  );

  // Avg daily events for reference line
  const avgDailyEvents = useMemo(
    () =>
      dailyMetrics.length > 0
        ? Math.round(
            dailyMetrics.reduce((s, d) => s + d.total_events, 0) /
              dailyMetrics.length
          )
        : 0,
    [dailyMetrics]
  );

  // ============================================================================
  // Chart Configs
  // ============================================================================

  const dauConfig: ChartConfig = {
    unique_users: { label: 'Unique Users', color: COLORS.emerald },
  };
  const eventsConfig: ChartConfig = {
    total_events: { label: 'Total Events', color: COLORS.amber },
  };
  const hourlyConfig: ChartConfig = {
    total_events: { label: 'Total Events', color: COLORS.fuchsia },
  };
  const behaviorConfig: ChartConfig = {
    'Page Views': { label: 'Page Views', color: COLORS.teal },
    'Cart Adds': { label: 'Cart Adds', color: COLORS.cyan },
    Favorites: { label: 'Favorites', color: COLORS.amber },
    Purchases: { label: 'Purchases', color: COLORS.rose },
  };
  const funnelConfig: ChartConfig = {
    count: { label: 'Events', color: COLORS.emerald },
  };
  const buyTrendConfig: ChartConfig = {
    buy_count: { label: 'Purchases', color: COLORS.fuchsia },
  };
  const segmentPieConfig: ChartConfig = {
    ...userSegments.reduce<Record<string, { label: string; color: string }>>(
      (acc, s, i) => {
        acc[s.segment] = {
          label: formatSegmentName(s.segment),
          color: CHART_COLORS[i % CHART_COLORS.length],
        };
        return acc;
      },
      {}
    ),
  };
  const categoryConfig: ChartConfig = {
    total_events: { label: 'Total Events', color: COLORS.emerald },
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) return (
    <section id="dashboards" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    </section>
  );

  if (error) return (
    <section id="dashboards" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-destructive text-lg">{error}</p>
      </div>
    </section>
  );

  return (
    <section id="dashboards" className="py-20 px-4 sm:px-6 lg:px-8">
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            {dataSource === 'real'
              ? 'Real insights from the Alibaba Taobao User Behavior Dataset — explore traffic patterns, conversion funnels, user segments, and product performance'
              : dataSource === 'mockup'
              ? 'Simulated 24-month Taobao-style e-commerce data — explore trends, funnels, and category performance over time'
              : 'Simulated 24-month Amazon E-Commerce data — based on the Kaggle Amazon dataset with 1M transactions'
            }
          </p>

          {/* Data Source Toggle + Month Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Database className="h-3.5 w-3.5" />
              {dataSource === 'real' ? 'Alibaba Taobao User Behavior (Kaggle)' : dataSource === 'mockup' ? 'Taobao Mockup (Simulated)' : 'Amazon E-Commerce (Kaggle Simulated)'}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {dataSource === 'real' ? 'Nov 25 – Dec 3, 2017' : `${taobaoGetAllMonths()[0].label} – ${taobaoGetAllMonths()[taobaoGetAllMonths().length - 1].label}`}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              {dataSource === 'real' ? (stats ? `${fmtK(stats.totalEvents)} events` : '100K events') : dataSource === 'mockup' ? '1M events • 24 months' : '1M events • 5 categories'}
            </Badge>
          </div>

          {dataSource === 'real' && stats && (
            <p className="text-sm text-muted-foreground">
              Data Period: Nov 25 – Dec 3, 2017 (9 days) · {fmtComma(stats.uniqueUsers)} unique users · {fmtComma(stats.uniqueItems)} unique items · {fmtComma(stats.uniqueCategories)} categories
            </p>
          )}
          {dataSource === 'mockup' && stats && (
            <p className="text-sm text-muted-foreground">
              Selected: {taobaoGetAllMonths().find(m => m.year === selectedYear && m.month === selectedMonth)?.label} · {fmtK(stats.avgDAU)} avg DAU · {fmtComma(stats.totalUsers)} unique users
            </p>
          )}
          {dataSource === 'amazon' && stats && (
            <p className="text-sm text-muted-foreground">
              Selected: {amazonGetAllMonths().find(m => m.year === selectedYear && m.month === selectedMonth)?.label} · {fmtK(stats.avgDAU)} avg DAU · {fmtComma(stats.totalUsers)} unique users · 5 product categories
            </p>
          )}
        </motion.div>

        {/* ================================================================== */}
        {/* Quick Stats Bar (5 KPI Cards)                                     */}
        {/* ================================================================== */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
          >
            <KPICard
              label="Total Events"
              value={fmtK(stats.totalEvents)}
              sub="All behavior types"
              icon={<Activity className="h-5 w-5 text-amber-500" />}
              color="text-amber-500"
            />
            <KPICard
              label="Unique Users"
              value={fmtK(stats.uniqueUsers)}
              sub={dataSource === 'real' ? 'Across 9 days' : `${selectedMonth}/${selectedYear}`}
              icon={<Users className="h-5 w-5 text-emerald-500" />}
              color="text-emerald-500"
            />
            <KPICard
              label="Avg DAU"
              value={fmtK(stats.avgDAU)}
              sub={`Peak: ${fmtK(stats.peakDAU)}`}
              icon={<Eye className="h-5 w-5 text-teal-500" />}
              color="text-teal-500"
            />
            <KPICard
              label="Conversion Rate"
              value={`${stats.overallConversionRate}%`}
              sub={`${fmtComma(stats.totalPurchases)} purchases`}
              icon={<TrendingUp className="h-5 w-5 text-rose-500" />}
              color="text-rose-500"
            />
            <KPICard
              label="Total Purchases"
              value={fmtK(stats.totalPurchases)}
              sub={`Cart: ${fmtK(stats.totalCart)}`}
              icon={<ShoppingCart className="h-5 w-5 text-fuchsia-500" />}
              color="text-fuchsia-500"
            />
          </motion.div>
        )}

        {/* ================================================================== */}
        {/* Tabs System                                                       */}
        {/* ================================================================== */}
        <Tabs defaultValue="traffic" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="flex gap-1 bg-muted/50 p-1 rounded-lg flex-wrap justify-center">
              <TabsTrigger value="traffic" className="px-3 sm:px-4">
                <Activity className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Traffic
              </TabsTrigger>
              <TabsTrigger value="funnels" className="px-3 sm:px-4">
                <Target className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Funnels
              </TabsTrigger>
              <TabsTrigger value="users" className="px-3 sm:px-4">
                <Users className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Users
              </TabsTrigger>
              <TabsTrigger value="products" className="px-3 sm:px-4">
                <Package className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Products
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ================================================================ */}
          {/* TAB 1: Traffic                                                  */}
          {/* ================================================================ */}
          <TabsContent value="traffic">
            <AnimatePresence mode="wait">
              <motion.div
                key="traffic"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                {/* Row 1: DAU Trend + Events by Day */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DAU Trend */}
                  <ChartCard
                    title="Daily Active Users"
                    description={`Unique users per day${dataSource === 'real' ? ' over 9 days' : ''}`}
                    icon={<Users className="h-4 w-4 text-emerald-500 shrink-0" />}
                    index={0}
                    toolbar={
                      <>
                        <ChartTypeToggle current={dauChartType} onChange={setDauChartType} />
                        <AxisToggle showX={dauShowX} showY={dauShowY} onToggleX={() => setDauShowX(!dauShowX)} onToggleY={() => setDauShowY(!dauShowY)} />
                      </>
                    }
                  >
                    <ChartContainer config={dauConfig} className="h-[300px] w-full">
                      {dauChartType === 'bar' ? (
                        <BarChart data={dauChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis {...xAxisProps(dauShowX, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(dauShowY, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ReferenceLine y={avgDAU} stroke={COLORS.emerald} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Avg: ${fmtK(avgDAU)}`, position: 'right', style: { fontSize: 10, fill: COLORS.emerald } }} />
                          <Bar dataKey="unique_users" fill={COLORS.emerald} radius={[3, 3, 0, 0]} barSize={24} />
                        </BarChart>
                      ) : dauChartType === 'area' ? (
                        <AreaChart data={dauChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad-dau" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis {...xAxisProps(dauShowX, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(dauShowY, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ReferenceLine y={avgDAU} stroke={COLORS.emerald} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Avg: ${fmtK(avgDAU)}`, position: 'right', style: { fontSize: 10, fill: COLORS.emerald } }} />
                          <Area type="monotone" dataKey="unique_users" stroke={COLORS.emerald} strokeWidth={2} fill="url(#grad-dau)" />
                        </AreaChart>
                      ) : (
                        <LineChart data={dauChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis {...xAxisProps(dauShowX, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(dauShowY, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ReferenceLine y={avgDAU} stroke={COLORS.emerald} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Avg: ${fmtK(avgDAU)}`, position: 'right', style: { fontSize: 10, fill: COLORS.emerald } }} />
                          <Line type="monotone" dataKey="unique_users" stroke={COLORS.emerald} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      )}
                    </ChartContainer>
                  </ChartCard>

                  {/* Events by Day */}
                  <ChartCard
                    title="Events by Day"
                    description="Total daily events (PV + Cart + Fav + Buy)"
                    icon={<Activity className="h-4 w-4 text-amber-500 shrink-0" />}
                    index={1}
                    toolbar={
                      <>
                        <ChartTypeToggle current={eventsChartType} onChange={setEventsChartType} />
                        <AxisToggle showX={eventsShowX} showY={eventsShowY} onToggleX={() => setEventsShowX(!eventsShowX)} onToggleY={() => setEventsShowY(!eventsShowY)} />
                      </>
                    }
                  >
                    <ChartContainer config={eventsConfig} className="h-[300px] w-full">
                      {eventsChartType === 'bar' ? (
                        <BarChart data={eventsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis {...xAxisProps(eventsShowX, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(eventsShowY, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ReferenceLine y={avgDailyEvents} stroke={COLORS.amber} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `Avg: ${fmtK(avgDailyEvents)}`, position: 'right', style: { fontSize: 10, fill: COLORS.amber } }} />
                          <Bar dataKey="total_events" fill={COLORS.amber} radius={[3, 3, 0, 0]} barSize={24} />
                        </BarChart>
                      ) : eventsChartType === 'area' ? (
                        <AreaChart data={eventsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad-events" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis {...xAxisProps(eventsShowX, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(eventsShowY, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="total_events" stroke={COLORS.amber} strokeWidth={2} fill="url(#grad-events)" />
                        </AreaChart>
                      ) : (
                        <LineChart data={eventsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis {...xAxisProps(eventsShowX, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(eventsShowY, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="total_events" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      )}
                    </ChartContainer>
                  </ChartCard>
                </div>

                {/* Row 2: Hourly Traffic + Behavior Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hourly Traffic Pattern */}
                  <ChartCard
                    title="Hourly Traffic Pattern"
                    description="Event volume across 24 hours (averaged)"
                    icon={<BarChart3 className="h-4 w-4 text-fuchsia-500 shrink-0" />}
                    index={2}
                    toolbar={
                      <ChartTypeToggle current={hourlyChartType} onChange={setHourlyChartType} />
                    }
                  >
                    <ChartContainer config={hourlyConfig} className="h-[300px] w-full">
                      {hourlyChartType === 'bar' ? (
                        <BarChart data={hourlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} tickMargin={8} interval={1} fontSize={10} />
                          <YAxis {...yAxisProps(true, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ReferenceLine y={avgHourlyEvents} stroke={COLORS.fuchsia} strokeDasharray="4 4" strokeOpacity={0.5} />
                          <Bar dataKey="total_events" fill={COLORS.fuchsia} radius={[2, 2, 0, 0]} barSize={12} />
                        </BarChart>
                      ) : hourlyChartType === 'area' ? (
                        <AreaChart data={hourlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad-hourly" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.fuchsia} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS.fuchsia} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} tickMargin={8} interval={2} fontSize={10} />
                          <YAxis {...yAxisProps(true, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="total_events" stroke={COLORS.fuchsia} strokeWidth={2} fill="url(#grad-hourly)" />
                        </AreaChart>
                      ) : (
                        <LineChart data={hourlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} tickMargin={8} interval={2} fontSize={10} />
                          <YAxis {...yAxisProps(true, (v: number) => fmtK(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="total_events" stroke={COLORS.fuchsia} strokeWidth={2} dot={false} />
                        </LineChart>
                      )}
                    </ChartContainer>
                  </ChartCard>

                  {/* Behavior Distribution Donut */}
                  <ChartCard
                    title="Behavior Distribution"
                    description="Breakdown of all events by type"
                    icon={<Layers className="h-4 w-4 text-cyan-500 shrink-0" />}
                    index={3}
                  >
                    <ChartContainer config={behaviorConfig} className="h-[300px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={behaviorPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={pieLabel}
                          labelLine={false}
                        >
                          {behaviorPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                  </ChartCard>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB 2: Funnels                                                  */}
          {/* ================================================================ */}
          <TabsContent value="funnels">
            <AnimatePresence mode="wait">
              <motion.div
                key="funnels"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conversion Funnel */}
                  <ChartCard
                    title="Conversion Funnel"
                    description="Page View → Favorite → Cart → Purchase"
                    icon={<Target className="h-4 w-4 text-emerald-500 shrink-0" />}
                    index={0}
                  >
                    <ChartContainer config={funnelConfig} className="h-[300px] w-full">
                      <BarChart
                        data={funnelBarData}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
                      >
                        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} tickFormatter={(v: number) => fmtK(v)} />
                        <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} fontSize={11} width={80} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={28}>
                          {funnelBarData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </ChartCard>

                  {/* Daily Purchase Trend */}
                  <ChartCard
                    title="Daily Purchase Trend"
                    description="Purchase count per day"
                    icon={<ShoppingCart className="h-4 w-4 text-fuchsia-500 shrink-0" />}
                    index={1}
                    toolbar={
                      <ChartTypeToggle current={buyTrendChartType} onChange={setBuyTrendChartType} />
                    }
                  >
                    <ChartContainer config={buyTrendConfig} className="h-[300px] w-full">
                      {buyTrendChartType === 'bar' ? (
                        <BarChart data={buyTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis {...xAxisProps(true, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(true, (v: number) => fmtComma(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="buy_count" fill={COLORS.fuchsia} radius={[3, 3, 0, 0]} barSize={24} />
                        </BarChart>
                      ) : buyTrendChartType === 'area' ? (
                        <AreaChart data={buyTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad-buy" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.fuchsia} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS.fuchsia} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis {...xAxisProps(true, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(true, (v: number) => fmtComma(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="buy_count" stroke={COLORS.fuchsia} strokeWidth={2} fill="url(#grad-buy)" />
                        </AreaChart>
                      ) : (
                        <LineChart data={buyTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis {...xAxisProps(true, 'date', fmtDate)} />
                          <YAxis {...yAxisProps(true, (v: number) => fmtComma(v))} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="buy_count" stroke={COLORS.fuchsia} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      )}
                    </ChartContainer>
                  </ChartCard>
                </div>

                {/* Funnel stage detail cards */}
                {conversionFunnel.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {conversionFunnel.map((stage, i) => {
                      const stageColors: Record<string, string> = {
                        pv: 'text-emerald-500',
                        fav: 'text-amber-500',
                        cart: 'text-cyan-500',
                        buy: 'text-rose-500',
                      };
                      const stageIcons: Record<string, React.ReactNode> = {
                        pv: <Eye className="h-5 w-5" />,
                        fav: <Layers className="h-5 w-5" />,
                        cart: <ShoppingCart className="h-5 w-5" />,
                        buy: <Target className="h-5 w-5" />,
                      };
                      return (
                        <Card key={stage.stage}>
                          <CardContent className="p-4 text-center">
                            <div className={`${stageColors[stage.stage] || 'text-muted-foreground'} mx-auto mb-2`}>
                              {stageIcons[stage.stage] || <Activity className="h-5 w-5" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{stage.label}</p>
                            <p className="text-lg font-bold mt-0.5 tabular-nums">{fmtComma(stage.count)}</p>
                            <p className="text-xs text-muted-foreground">{stage.rate}% of PV</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB 3: Users                                                    */}
          {/* ================================================================ */}
          <TabsContent value="users">
            <AnimatePresence mode="wait">
              <motion.div
                key="users"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User Segments Donut */}
                  <ChartCard
                    title="User Segments"
                    description="Distribution of users by behavior type"
                    icon={<Users className="h-4 w-4 text-cyan-500 shrink-0" />}
                    index={0}
                  >
                    <ChartContainer config={segmentPieConfig} className="h-[300px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={segmentPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={pieLabel}
                          labelLine={false}
                        >
                          {segmentPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                  </ChartCard>

                  {/* User Segment Table */}
                  <ChartCard
                    title="Segment Details"
                    description="Per-segment metrics breakdown"
                    icon={<BarChart3 className="h-4 w-4 text-teal-500 shrink-0" />}
                    index={1}
                  >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Segment</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Users</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg Events</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Purchases</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userSegments.map((seg, i) => (
                            <tr key={seg.segment} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                  <span className="font-medium">{formatSegmentName(seg.segment)}</span>
                                </div>
                              </td>
                              <td className="text-right py-2 px-3 tabular-nums">{fmtComma(seg.userCount)}</td>
                              <td className="text-right py-2 px-3 tabular-nums">{fmtComma(seg.avgEventsPerUser)}</td>
                              <td className="text-right py-2 px-3 tabular-nums">{fmtComma(seg.totalPurchases)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB 4: Products                                                 */}
          {/* ================================================================ */}
          <TabsContent value="products">
            <AnimatePresence mode="wait">
              <motion.div
                key="products"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Categories Horizontal Bar */}
                  <ChartCard
                    title="Top Categories"
                    description="Top 10 categories by total events"
                    icon={<Package className="h-4 w-4 text-orange-500 shrink-0" />}
                    index={0}
                  >
                    <ChartContainer config={categoryConfig} className="h-[300px] w-full">
                      <BarChart
                        data={topCategories.map((c) => ({
                          category: `Cat ${c.category_id}`,
                          total_events: c.total_events,
                        }))}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
                      >
                        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} tickFormatter={(v: number) => fmtK(v)} />
                        <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={10} width={60} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total_events" radius={[0, 3, 3, 0]} barSize={16}>
                          {topCategories.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </ChartCard>

                  {/* Top Items Table */}
                  <ChartCard
                    title="Top Items"
                    description="Top 10 items by purchase count"
                    icon={<Target className="h-4 w-4 text-rose-500 shrink-0" />}
                    index={1}
                  >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Item</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cat</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Events</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Purchases</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Conv.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topItems.map((item, i) => (
                            <tr key={item.item_id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                                  <span className="font-medium font-mono text-xs">Item {item.item_id}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{item.category_id}</td>
                              <td className="text-right py-2 px-3 tabular-nums">{fmtComma(item.total_events)}</td>
                              <td className="text-right py-2 px-3 tabular-nums font-medium">{fmtComma(item.buy_count)}</td>
                              <td className="text-right py-2 px-3 tabular-nums">
                                <span
                                  className={
                                    item.conversion_rate > 10
                                      ? 'text-emerald-500'
                                      : item.conversion_rate > 5
                                        ? 'text-amber-500'
                                        : 'text-rose-500'
                                  }
                                >
                                  {item.conversion_rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// ============================================================================
// Utility: format segment names to human readable
// ============================================================================

function formatSegmentName(segment: string): string {
  const nameMap: Record<string, string> = {
    power_buyer: 'Power Buyer',
    buyer: 'Buyer',
    engaged_browser: 'Engaged Browser',
    frequent_browser: 'Frequent Browser',
    casual_browser: 'Casual Browser',
    one_time_visitor: 'One-time Visitor',
  };
  return nameMap[segment] || segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

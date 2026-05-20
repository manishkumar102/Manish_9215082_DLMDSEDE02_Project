'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Database,
  Table2,
  Rows3,
  KeyRound,
  Hash,
  Clock,
  Tag,
  User,
  Package,
  BarChart3,
  ArrowRight,
  Info,
  Activity,
  Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ColumnDef {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL';
  description: string;
  isPrimaryKey?: boolean;
  sampleValue: string;
}

interface TableDef {
  name: string;
  icon: typeof Database;
  description: string;
  granularity: string;
  columns: ColumnDef[];
  sampleRows: Record<string, string | number>[];
  totalRows: number;
}

// ── Static Data: Gold-Layer Table Schemas ──────────────────────────────────

const goldTables: TableDef[] = [
  {
    name: 'gold_daily_metrics',
    icon: CalendarIcon,
    description: 'Daily aggregated user behavior metrics across all events',
    granularity: 'Daily',
    totalRows: 31,
    columns: [
      {
        name: 'date',
        type: 'TEXT',
        isPrimaryKey: true,
        description: 'Calendar date in ISO format (YYYY-MM-DD)',
        sampleValue: '2024-11-25',
      },
      {
        name: 'total_events',
        type: 'INTEGER',
        description: 'Total number of user interaction events',
        sampleValue: '847,293',
      },
      {
        name: 'pv_count',
        type: 'INTEGER',
        description: 'Page view events count',
        sampleValue: '612,841',
      },
      {
        name: 'cart_count',
        type: 'INTEGER',
        description: 'Add-to-cart action count',
        sampleValue: '34,512',
      },
      {
        name: 'fav_count',
        type: 'INTEGER',
        description: 'Favorite / wishlist action count',
        sampleValue: '28,903',
      },
      {
        name: 'buy_count',
        type: 'INTEGER',
        description: 'Purchase / order action count',
        sampleValue: '8,204',
      },
      {
        name: 'unique_users',
        type: 'INTEGER',
        description: 'Distinct user count for the day',
        sampleValue: '124,567',
      },
      {
        name: 'unique_items',
        type: 'INTEGER',
        description: 'Distinct items interacted with',
        sampleValue: '45,891',
      },
    ],
    sampleRows: [
      { date: '2024-11-21', total_events: 792_140, pv_count: 571_032, cart_count: 31_247, fav_count: 26_890, buy_count: 7_612, unique_users: 118_234, unique_items: 42_156 },
      { date: '2024-11-22', total_events: 831_507, pv_count: 603_421, cart_count: 33_876, fav_count: 27_124, buy_count: 8_341, unique_users: 121_890, unique_items: 44_032 },
      { date: '2024-11-23', total_events: 924_813, pv_count: 672_345, cart_count: 38_912, fav_count: 31_567, buy_count: 12_456, unique_users: 143_210, unique_items: 51_789 },
      { date: '2024-11-24', total_events: 1_052_391, pv_count: 768_912, cart_count: 45_123, fav_count: 37_891, buy_count: 18_934, unique_users: 178_456, unique_items: 58_234 },
      { date: '2024-11-25', total_events: 847_293, pv_count: 612_841, cart_count: 34_512, fav_count: 28_903, buy_count: 8_204, unique_users: 124_567, unique_items: 45_891 },
    ],
  },
  {
    name: 'gold_hourly_patterns',
    icon: Clock,
    description: 'Hourly behavioral patterns aggregated across all dates',
    granularity: 'Hourly',
    totalRows: 24,
    columns: [
      {
        name: 'hour',
        type: 'INTEGER',
        isPrimaryKey: true,
        description: 'Hour of day (0–23)',
        sampleValue: '14',
      },
      {
        name: 'total_events',
        type: 'INTEGER',
        description: 'Total events in this hour across all days',
        sampleValue: '2,841,203',
      },
      {
        name: 'pv_count',
        type: 'INTEGER',
        description: 'Page views in this hour across all days',
        sampleValue: '2,034,521',
      },
      {
        name: 'cart_count',
        type: 'INTEGER',
        description: 'Add-to-cart events in this hour',
        sampleValue: '112,453',
      },
      {
        name: 'fav_count',
        type: 'INTEGER',
        description: 'Favorite events in this hour',
        sampleValue: '96,721',
      },
      {
        name: 'buy_count',
        type: 'INTEGER',
        description: 'Purchase events in this hour',
        sampleValue: '28,934',
      },
      {
        name: 'avg_daily_events',
        type: 'REAL',
        description: 'Average events per day for this hour',
        sampleValue: '91,652',
      },
    ],
    sampleRows: [
      { hour: 0, total_events: 312_041, pv_count: 218_432, cart_count: 11_234, fav_count: 9_821, buy_count: 2_341, avg_daily_events: 10066 },
      { hour: 8, total_events: 1_834_521, pv_count: 1_324_891, cart_count: 76_234, fav_count: 62_341, buy_count: 18_923, avg_daily_events: 59178 },
      { hour: 12, total_events: 2_591_834, pv_count: 1_872_341, cart_count: 102_891, fav_count: 88_234, buy_count: 26_782, avg_daily_events: 83608 },
      { hour: 18, total_events: 3_124_567, pv_count: 2_256_789, cart_count: 134_567, fav_count: 112_891, buy_count: 34_567, avg_daily_events: 100792 },
      { hour: 22, total_events: 1_567_890, pv_count: 1_134_567, cart_count: 62_345, fav_count: 53_456, buy_count: 15_678, avg_daily_events: 50577 },
    ],
  },
  {
    name: 'gold_category_summary',
    icon: Tag,
    description: 'Behavioral metrics grouped by product category',
    granularity: 'Category',
    totalRows: 18,
    columns: [
      {
        name: 'category_id',
        type: 'INTEGER',
        isPrimaryKey: true,
        description: 'Product category identifier',
        sampleValue: '9',
      },
      {
        name: 'total_events',
        type: 'INTEGER',
        description: 'Total events for items in this category',
        sampleValue: '1,423,891',
      },
      {
        name: 'pv_count',
        type: 'INTEGER',
        description: 'Page views for category items',
        sampleValue: '1_034_567',
      },
      {
        name: 'cart_count',
        type: 'INTEGER',
        description: 'Add-to-cart actions for category items',
        sampleValue: '67_890',
      },
      {
        name: 'fav_count',
        type: 'INTEGER',
        description: 'Favorite actions for category items',
        sampleValue: '54_321',
      },
      {
        name: 'buy_count',
        type: 'INTEGER',
        description: 'Purchases in this category',
        sampleValue: '18_234',
      },
      {
        name: 'unique_users',
        type: 'INTEGER',
        description: 'Distinct users interacting with this category',
        sampleValue: '89_234',
      },
      {
        name: 'unique_items',
        type: 'INTEGER',
        description: 'Distinct items in this category',
        sampleValue: '4_567',
      },
    ],
    sampleRows: [
      { category_id: 1, total_events: 2_134_567, pv_count: 1_545_891, cart_count: 101_234, fav_count: 82_345, buy_count: 27_456, unique_users: 112_345, unique_items: 8_923 },
      { category_id: 5, total_events: 1_876_234, pv_count: 1_361_891, cart_count: 89_012, fav_count: 71_234, buy_count: 24_123, unique_users: 98_765, unique_items: 6_456 },
      { category_id: 9, total_events: 1_423_891, pv_count: 1_034_567, cart_count: 67_890, fav_count: 54_321, buy_count: 18_234, unique_users: 89_234, unique_items: 4_567 },
      { category_id: 12, total_events: 987_654, pv_count: 718_234, cart_count: 47_123, fav_count: 38_456, buy_count: 12_789, unique_users: 72_345, unique_items: 3_234 },
      { category_id: 16, total_events: 654_321, pv_count: 476_543, cart_count: 31_234, fav_count: 25_678, buy_count: 8_456, unique_users: 56_789, unique_items: 2_156 },
    ],
  },
  {
    name: 'gold_user_summary',
    icon: User,
    description: 'Per-user behavioral profile and engagement metrics',
    granularity: 'User',
    totalRows: 5_312,
    columns: [
      {
        name: 'user_id',
        type: 'INTEGER',
        isPrimaryKey: true,
        description: 'Anonymized user identifier',
        sampleValue: '12847',
      },
      {
        name: 'total_events',
        type: 'INTEGER',
        description: 'Total events generated by this user',
        sampleValue: '342',
      },
      {
        name: 'pv_count',
        type: 'INTEGER',
        description: 'Page views by this user',
        sampleValue: '241',
      },
      {
        name: 'cart_count',
        type: 'INTEGER',
        description: 'Add-to-cart actions by this user',
        sampleValue: '34',
      },
      {
        name: 'fav_count',
        type: 'INTEGER',
        description: 'Favorite actions by this user',
        sampleValue: '28',
      },
      {
        name: 'buy_count',
        type: 'INTEGER',
        description: 'Purchases made by this user',
        sampleValue: '7',
      },
      {
        name: 'active_days',
        type: 'INTEGER',
        description: 'Number of days the user was active',
        sampleValue: '18',
      },
    ],
    sampleRows: [
      { user_id: 3821, total_events: 1_247, pv_count: 891, cart_count: 112, fav_count: 89, buy_count: 23, active_days: 25 },
      { user_id: 12847, total_events: 342, pv_count: 241, cart_count: 34, fav_count: 28, buy_count: 7, active_days: 18 },
      { user_id: 56234, total_events: 89, pv_count: 61, cart_count: 12, fav_count: 8, buy_count: 2, active_days: 4 },
      { user_id: 7891, total_events: 567, pv_count: 402, cart_count: 56, fav_count: 47, buy_count: 14, active_days: 22 },
      { user_id: 23456, total_events: 213, pv_count: 154, cart_count: 21, fav_count: 17, buy_count: 5, active_days: 11 },
    ],
  },
  {
    name: 'gold_item_summary',
    icon: Package,
    description: 'Per-item engagement metrics with category linkage',
    granularity: 'Item',
    totalRows: 12_847,
    columns: [
      {
        name: 'item_id',
        type: 'INTEGER',
        isPrimaryKey: true,
        description: 'Unique product item identifier',
        sampleValue: '502341',
      },
      {
        name: 'category_id',
        type: 'INTEGER',
        description: 'FK to gold_category_summary.category_id',
        sampleValue: '9',
      },
      {
        name: 'total_events',
        type: 'INTEGER',
        description: 'Total events for this item',
        sampleValue: '4_521',
      },
      {
        name: 'pv_count',
        type: 'INTEGER',
        description: 'Page views for this item',
        sampleValue: '3_287',
      },
      {
        name: 'cart_count',
        type: 'INTEGER',
        description: 'Add-to-cart actions for this item',
        sampleValue: '234',
      },
      {
        name: 'fav_count',
        type: 'INTEGER',
        description: 'Favorite actions for this item',
        sampleValue: '189',
      },
      {
        name: 'buy_count',
        type: 'INTEGER',
        description: 'Purchases of this item',
        sampleValue: '67',
      },
      {
        name: 'unique_users',
        type: 'INTEGER',
        description: 'Distinct users who interacted with this item',
        sampleValue: '2_891',
      },
    ],
    sampleRows: [
      { item_id: 102_834, category_id: 1, total_events: 8_234, pv_count: 5_987, cart_count: 412, fav_count: 334, buy_count: 123, unique_users: 5_234 },
      { item_id: 256_789, category_id: 5, total_events: 5_621, pv_count: 4_089, cart_count: 289, fav_count: 234, buy_count: 89, unique_users: 3_876 },
      { item_id: 502_341, category_id: 9, total_events: 4_521, pv_count: 3_287, cart_count: 234, fav_count: 189, buy_count: 67, unique_users: 2_891 },
      { item_id: 789_012, category_id: 12, total_events: 3_124, pv_count: 2_271, cart_count: 156, fav_count: 127, buy_count: 45, unique_users: 2_034 },
      { item_id: 934_567, category_id: 16, total_events: 2_089, pv_count: 1_519, cart_count: 104, fav_count: 84, buy_count: 31, unique_users: 1_456 },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getTypeBadgeClass(type: ColumnDef['type']): string {
  switch (type) {
    case 'TEXT':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    case 'INTEGER':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'REAL':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Sub-Components ─────────────────────────────────────────────────────────

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function TableSelectorCard({
  table,
  isSelected,
  onClick,
  index,
}: {
  table: TableDef;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const Icon = table.icon;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left w-full"
      aria-pressed={isSelected}
    >
      <Card
        className={`h-full transition-all duration-300 cursor-pointer hover:shadow-lg ${
          isSelected
            ? 'border-emerald-500/60 shadow-md shadow-emerald-500/10 bg-emerald-500/[0.03]'
            : 'hover:border-emerald-500/30'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 p-2.5 rounded-lg transition-colors duration-300 ${
                isSelected
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-mono truncate">
                  {table.name}
                </CardTitle>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                  </motion.div>
                )}
              </div>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {table.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Rows3 className="h-3.5 w-3.5" />
              <span>{formatNumber(table.totalRows)} rows</span>
            </div>
            <div className="flex items-center gap-1">
              <Table2 className="h-3.5 w-3.5" />
              <span>{table.columns.length} cols</span>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
              {table.granularity}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.button>
  );
}

function ColumnCard({ column, index }: { column: ColumnDef; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: 'easeOut',
      }}
    >
      <Card className="h-full group hover:shadow-md transition-all duration-200 hover:border-emerald-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {column.isPrimaryKey && (
                <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              <CardTitle className="text-sm font-mono truncate">
                {column.name}
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-mono shrink-0 ${getTypeBadgeClass(column.type)}`}
            >
              {column.type}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            {column.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md bg-muted/60 px-3 py-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
              Sample
            </span>
            <span className="text-xs font-mono text-foreground truncate">
              {column.sampleValue}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LivePreviewTable({ table }: { table: TableDef }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border overflow-hidden"
    >
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
            <tr>
              {table.columns.map((col) => (
                <th
                  key={col.name}
                  className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap border-b border-border"
                >
                  <div className="flex items-center gap-1.5">
                    {col.isPrimaryKey && (
                      <KeyRound className="h-3 w-3 text-amber-500" />
                    )}
                    <span className="font-mono">{col.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.sampleRows.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: rowIndex * 0.06,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                className="hover:bg-muted/40 transition-colors"
              >
                {table.columns.map((col) => {
                  const value = row[col.name];
                  const isPK = col.isPrimaryKey;
                  return (
                    <td
                      key={col.name}
                      className={`px-4 py-2.5 whitespace-nowrap font-mono text-xs ${
                        isPK
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-foreground/80'
                      }`}
                    >
                      {typeof value === 'number'
                        ? value.toLocaleString()
                        : String(value)}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>
          Showing first {table.sampleRows.length} of {formatNumber(table.totalRows)} rows
        </span>
      </div>
    </motion.div>
  );
}

function TableStatsPanel({ table }: { table: TableDef }) {
  const stats = [
    {
      label: 'Total Rows',
      value: formatNumber(table.totalRows),
      icon: Rows3,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Columns',
      value: String(table.columns.length),
      icon: Hash,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      label: 'Primary Key',
      value: table.columns.find((c) => c.isPrimaryKey)?.name ?? '—',
      icon: KeyRound,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Granularity',
      value: table.granularity,
      icon: Activity,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
        >
          <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card">
            <div className={`p-2 rounded-md ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-semibold font-mono truncate">
                {stat.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DbSchemaExplorer() {
  const [selectedTableIndex, setSelectedTableIndex] = useState<number | null>(
    null
  );

  const selectedTable =
    selectedTableIndex !== null ? goldTables[selectedTableIndex] : null;

  return (
    <section id="db-schema" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Database className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Database Schema Explorer
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Gold Layer — 5 Analytical Tables
          </p>
        </motion.div>

        {/* ── Table Selector Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Select a Table
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {goldTables.map((table, index) => (
              <TableSelectorCard
                key={table.name}
                table={table}
                isSelected={selectedTableIndex === index}
                onClick={() =>
                  setSelectedTableIndex(
                    selectedTableIndex === index ? null : index
                  )
                }
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Selected Table Detail ── */}
        <AnimatePresence mode="wait">
          {selectedTable && (
            <motion.div
              key={selectedTable.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-10"
            >
              {/* Detail Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Eye className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-mono">
                    {selectedTable.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTable.description}
                  </p>
                </div>
              </div>

              {/* Stats Panel */}
              <TableStatsPanel table={selectedTable} />

              {/* Tabbed Content */}
              <Tabs defaultValue="columns" className="mt-8">
                <TabsList className="mb-6">
                  <TabsTrigger value="columns" className="gap-1.5">
                    <BarChart3 className="h-4 w-4" />
                    Columns ({selectedTable.columns.length})
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1.5">
                    <Eye className="h-4 w-4" />
                    Live Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="columns">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTable.columns.map((col, i) => (
                      <ColumnCard key={col.name} column={col} index={i} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <LivePreviewTable table={selectedTable} />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ── */}
        <AnimatePresence>
          {!selectedTable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-10"
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Database className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Select a table above to explore its schema, columns, and
                    sample data
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Database,
  Cpu,
  BarChart3,
  HardDrive,
  Server,
  Globe,
  Layers,
  Send,
  LayoutDashboard,
  Plug,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  X,
  Search,
  RefreshCw,
  ChevronRight,
  Activity,
  CheckCircle2,
  Info,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

type LayerType = 'source' | 'bronze' | 'transform' | 'silver' | 'gold' | 'output';

interface LineageNode {
  id: string;
  label: string;
  sublabel: string;
  layer: LayerType;
  iconName: string;
  x: number;
  y: number;
  details: {
    description: string;
    inputFormat: string;
    outputFormat: string;
    rowCount: string;
    transformation: string;
    sampleData: string;
    tech: string;
    latency: string;
  };
}

interface LineageEdge {
  from: string;
  to: string;
}

// ============================================================================
// Constants
// ============================================================================

const NODE_W = 148;
const NODE_H = 66;
const HALF_W = NODE_W / 2;
const HALF_H = NODE_H / 2;

const layerMeta: Record<LayerType, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  badgeClass: string;
  headerBg: string;
  headerBorder: string;
}> = {
  source: {
    label: 'Sources',
    color: '#64748b',
    bgColor: 'rgba(100,116,139,0.08)',
    textColor: 'text-slate-600 dark:text-slate-300',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    headerBg: 'rgba(100,116,139,0.06)',
    headerBorder: 'rgba(100,116,139,0.2)',
  },
  bronze: {
    label: 'Bronze',
    color: '#f43f5e',
    bgColor: 'rgba(244,63,94,0.08)',
    textColor: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    headerBg: 'rgba(244,63,94,0.06)',
    headerBorder: 'rgba(244,63,94,0.25)',
  },
  transform: {
    label: 'Transform',
    color: '#d946ef',
    bgColor: 'rgba(217,70,239,0.08)',
    textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    badgeClass: 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
    headerBg: 'rgba(217,70,239,0.06)',
    headerBorder: 'rgba(217,70,239,0.25)',
  },
  silver: {
    label: 'Silver',
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.08)',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    badgeClass: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    headerBg: 'rgba(6,182,212,0.06)',
    headerBorder: 'rgba(6,182,212,0.25)',
  },
  gold: {
    label: 'Gold',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    headerBg: 'rgba(245,158,11,0.06)',
    headerBorder: 'rgba(245,158,11,0.25)',
  },
  output: {
    label: 'Outputs',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    headerBg: 'rgba(16,185,129,0.06)',
    headerBorder: 'rgba(16,185,129,0.25)',
  },
};

// Render-safe icon component (avoids creating components during render)
function DynamicIcon({ name, size, color, className }: { name: string; size?: number; color?: string; className?: string }) {
  const p = { size: size ?? 16, style: color ? { color } : undefined, className };
  switch (name) {
    case 'FileText': return <FileText {...p} />;
    case 'Database': return <Database {...p} />;
    case 'Cpu': return <Cpu {...p} />;
    case 'BarChart3': return <BarChart3 {...p} />;
    case 'HardDrive': return <HardDrive {...p} />;
    case 'Server': return <Server {...p} />;
    case 'Globe': return <Globe {...p} />;
    case 'Layers': return <Layers {...p} />;
    case 'Send': return <Send {...p} />;
    case 'LayoutDashboard': return <LayoutDashboard {...p} />;
    case 'Plug': return <Plug {...p} />;
    case 'Sparkles': return <Sparkles {...p} />;
    case 'Zap': return <Zap {...p} />;
    case 'Activity': return <Activity {...p} />;
    case 'RefreshCw': return <RefreshCw {...p} />;
    case 'Clock': return <Clock {...p} />;
    default: return <FileText {...p} />;
  }
}

// ============================================================================
// Node & Edge Data
// ============================================================================

const lineageNodes: LineageNode[] = [
  // ── Sources ──
  {
    id: 'taobao-csv',
    label: 'Taobao CSV',
    sublabel: 'User Behavior Dataset',
    layer: 'source',
    iconName: 'FileText',
    x: 100,
    y: 120,
    details: {
      description: 'Raw clickstream data from Alibaba Taobao User Behavior dataset. Contains user interactions including views, add-to-cart, purchases, and favorites across millions of product pages.',
      inputFormat: 'CSV (user_id, item_id, category_id, behavior_type, timestamp)',
      outputFormat: 'CSV records (~2.4 GB)',
      rowCount: '~15,000,000 rows',
      transformation: 'None — raw source data loaded as-is',
      sampleData: 'user_id: 1429927, item_id: 2520336, category_id: 2520377, behavior_type: pv, timestamp: 2017-11-25 09:01:23',
      tech: 'Apache CSV, Pandas',
      latency: 'N/A (static)',
    },
  },
  {
    id: 'mock-gen',
    label: 'Mock Generator',
    sublabel: 'Synthetic Data',
    layer: 'source',
    iconName: 'Sparkles',
    x: 100,
    y: 320,
    details: {
      description: 'Python-based synthetic data generator for development and testing. Produces realistic user behavior patterns with configurable distributions and volume.',
      inputFormat: 'Configuration YAML templates',
      outputFormat: 'CSV files',
      rowCount: '~100,000 rows per run',
      transformation: 'Faker-based random generation with statistical distributions',
      sampleData: 'Generates realistic browsing patterns with configurable session lengths, category preferences, and temporal patterns',
      tech: 'Python Faker, Click CLI',
      latency: '~30 seconds per batch',
    },
  },
  {
    id: 'amazon-feed',
    label: 'Amazon Feed',
    sublabel: 'Product Catalog',
    layer: 'source',
    iconName: 'Globe',
    x: 100,
    y: 520,
    details: {
      description: 'Supplementary product catalog data ingested via Amazon Product API. Enriches clickstream with product metadata, pricing, and category hierarchies.',
      inputFormat: 'JSON API responses',
      outputFormat: 'Normalized CSV',
      rowCount: '~500,000 products',
      transformation: 'JSON flattening, field mapping, schema normalization',
      sampleData: 'product_id: B0000X, title: "Product Name", price: 29.99, category: "Electronics > Audio"',
      tech: 'Python requests, Pandas',
      latency: '~2 minutes per batch',
    },
  },
  // ── Bronze ──
  {
    id: 'fastapi-ingest',
    label: 'FastAPI Ingestion',
    sublabel: 'Validation & Upload',
    layer: 'bronze',
    iconName: 'Server',
    x: 330,
    y: 200,
    details: {
      description: 'High-performance REST API service handling data ingestion with Pydantic schema validation, deduplication checks, and automatic routing to the Bronze storage layer.',
      inputFormat: 'CSV uploads + JSON payloads via POST /api/ingest',
      outputFormat: 'Validated CSV files',
      rowCount: '~15,600,000 (combined sources)',
      transformation: 'Schema validation, null checks, type coercion, duplicate detection',
      sampleData: 'POST /api/ingest/csv → 201 Created (batch_id: "uuid", rows_accepted: 50000)',
      tech: 'FastAPI 0.104, Pydantic v2, Uvicorn, multipart uploads',
      latency: '~3 minutes for full dataset',
    },
  },
  {
    id: 'minio-bronze',
    label: 'MinIO Bronze',
    sublabel: 'Raw CSV Storage',
    layer: 'bronze',
    iconName: 'HardDrive',
    x: 330,
    y: 440,
    details: {
      description: 'S3-compatible object storage bucket for raw data in the Bronze layer. Preserves original data fidelity with immutable append-only writes.',
      inputFormat: 'Validated CSV files from FastAPI',
      outputFormat: 'CSV files in bronze/ prefix',
      rowCount: '~15,600,000 rows across files',
      transformation: 'None — immutable raw storage with metadata tagging',
      sampleData: 'bronze/clickstream/2024-01-15/users.csv (size: 128 MB, records: 500K)',
      tech: 'MinIO, S3 API, Parquet-ready partitions',
      latency: '< 1 second write',
    },
  },
  // ── Transformations ──
  {
    id: 'spark-etl',
    label: 'Spark ETL',
    sublabel: 'Dedup · Clean · Sessionize',
    layer: 'transform',
    iconName: 'Cpu',
    x: 570,
    y: 140,
    details: {
      description: 'Apache Spark distributed processing pipeline performing data quality improvements: deduplication, null removal, type casting, and user session windowing with event sequencing.',
      inputFormat: 'Bronze CSV files from MinIO',
      outputFormat: 'Cleaned Parquet files → Silver',
      rowCount: '~14,800,000 (after dedup)',
      transformation: '1) Dedup by (user_id, item_id, timestamp)\n2) Remove null critical fields\n3) Cast types, normalize timestamps\n4) Sessionize: 30min gap → new session_id',
      sampleData: 'user_id, session_id, event_seq, behavior_type, ts_utc, item_id, category_id',
      tech: 'Apache Spark 3.5, PySpark, Delta Lake format',
      latency: '~8 minutes (5-node cluster)',
    },
  },
  {
    id: 'dbt-staging',
    label: 'dbt Staging',
    sublabel: 'Column Mapping',
    layer: 'transform',
    iconName: 'Layers',
    x: 570,
    y: 340,
    details: {
      description: 'Staging models that source from Silver Parquet files. Performs column renaming, type standardization, and basic filtering to create clean foundational views.',
      inputFormat: 'Silver Parquet (partitioned by date)',
      outputFormat: 'Staging views (stg_*)',
      rowCount: '~14,800,000 rows',
      transformation: 'Column renaming conventions, type casting to warehouse standards, basic WHERE filters, source freshness checks',
      sampleData: 'stg_clickstream → stg_users → stg_items → stg_categories',
      tech: 'dbt-core 1.7, Jinja2 macros, SQL',
      latency: '~2 minutes per model',
    },
  },
  {
    id: 'dbt-marts',
    label: 'dbt Marts',
    sublabel: 'Star Schema Build',
    layer: 'transform',
    iconName: 'BarChart3',
    x: 570,
    y: 540,
    details: {
      description: 'Business-level mart models constructing the analytical star schema. Includes dimension tables, fact tables, and pre-aggregated materialized views.',
      inputFormat: 'Staging models (stg_*)',
      outputFormat: 'dim_* + fact_* tables + materialized views',
      rowCount: 'dim_user: 2.5M, dim_item: 800K, fact_clickstream: 14.8M',
      transformation: 'SCD Type 2 for slowly-changing dims, fact table joins, MV aggregations (daily/weekly metrics)',
      sampleData: 'dim_user, dim_item, dim_category, dim_date, fact_clickstream, mv_daily_metrics',
      tech: 'dbt-core 1.7, dbt tests (unique, not_null, referential)',
      latency: '~4 minutes full run',
    },
  },
  // ── Silver / Gold ──
  {
    id: 'minio-silver',
    label: 'MinIO Silver',
    sublabel: 'Parquet (partitioned)',
    layer: 'silver',
    iconName: 'HardDrive',
    x: 800,
    y: 220,
    details: {
      description: 'Clean and validated data store in the Silver layer. Parquet format with Snappy compression, partitioned by date for efficient predicate pushdown.',
      inputFormat: 'Spark ETL output (cleaned data)',
      outputFormat: 'Partitioned Parquet files',
      rowCount: '~14,800,000 rows',
      transformation: 'Storage layer — data already cleaned by Spark ETL',
      sampleData: 'silver/clickstream/date=2024-01-15/*.parquet (avg 45 MB per partition)',
      tech: 'MinIO S3-compatible, Apache Parquet, Snappy compression',
      latency: 'Partition reads < 500ms',
    },
  },
  {
    id: 'postgres-gold',
    label: 'PostgreSQL Gold',
    sublabel: 'Star Schema Tables',
    layer: 'gold',
    iconName: 'Database',
    x: 800,
    y: 460,
    details: {
      description: 'Relational database with the full star schema in the Gold layer. Includes indexed dimension tables, the central fact table, and pre-computed materialized views for dashboards.',
      inputFormat: 'dbt mart models (dim_*, fact_*)',
      outputFormat: 'Dimension tables + fact table + 3 materialized views',
      rowCount: '4 dim tables + 1 fact table + 3 MVs (~18M rows total)',
      transformation: 'Constraints, indexes (btree, brin), materialized views, daily refresh triggers',
      sampleData: 'dim_user (2.5M), dim_item (800K), dim_category (1.2K), dim_date (365), fact_clickstream (14.8M)',
      tech: 'PostgreSQL 16, pg_trgm, partial indexes, REFRESH MATERIALIZED VIEW',
      latency: 'MV refresh ~30 seconds',
    },
  },
  // ── Outputs ──
  {
    id: 'metabase',
    label: 'Metabase',
    sublabel: 'BI Dashboards',
    layer: 'output',
    iconName: 'LayoutDashboard',
    x: 1050,
    y: 140,
    details: {
      description: 'Business intelligence dashboards and ad-hoc query interface connected to the PostgreSQL Gold layer. Powers daily operational reporting and executive KPI tracking.',
      inputFormat: 'PostgreSQL Gold tables via read replica',
      outputFormat: 'Interactive dashboards, charts, drill-downs',
      rowCount: 'Query engine (aggregates on demand)',
      transformation: 'SQL queries, visual aggregations, pivot tables',
      sampleData: 'Daily Active Users, Conversion Funnel, Top Categories, User Cohort Analysis',
      tech: 'Metabase 0.49, PostgreSQL connection, embedded dashboards',
      latency: 'Dashboard loads < 3 seconds',
    },
  },
  {
    id: 'api-endpoints',
    label: 'API Endpoints',
    sublabel: 'REST API Service',
    layer: 'output',
    iconName: 'Plug',
    x: 1050,
    y: 340,
    details: {
      description: 'RESTful API endpoints serving processed data to downstream applications. Supports pagination, filtering, and real-time aggregation queries.',
      inputFormat: 'PostgreSQL Gold tables',
      outputFormat: 'JSON API responses (paginated)',
      rowCount: 'Configurable (default: 100 per page)',
      transformation: 'Query parameter handling, response formatting, async streaming',
      sampleData: 'GET /api/stats → {"total_users": 2500000, "active_today": 45678}\nGET /api/funnel?date=2024-01-15',
      tech: 'FastAPI, asyncpg, Pydantic response models, Redis cache',
      latency: 'p95: 120ms, cached: < 20ms',
    },
  },
  {
    id: 'scheduled-reports',
    label: 'Scheduled Reports',
    sublabel: 'Email & Export',
    layer: 'output',
    iconName: 'Send',
    x: 1050,
    y: 540,
    details: {
      description: 'Automated report generation and distribution system. Produces PDF/CSV summaries on configurable schedules with anomaly detection and threshold alerting.',
      inputFormat: 'PostgreSQL Gold tables + MV aggregates',
      outputFormat: 'PDF reports, CSV exports, email alerts',
      rowCount: 'Aggregated summaries (not row-level)',
      transformation: 'Cron scheduling, template rendering, anomaly detection (z-score > 2σ)',
      sampleData: 'Daily Metrics Report (6:00 AM), Weekly Trends (Mon 9:00 AM), Anomaly Alert (real-time)',
      tech: 'Apache Airflow DAGs, Python Jinja2, SMTP, WeasyPrint',
      latency: 'Report generation ~15 seconds',
    },
  },
];

const lineageEdges: LineageEdge[] = [
  { from: 'taobao-csv', to: 'fastapi-ingest' },
  { from: 'mock-gen', to: 'fastapi-ingest' },
  { from: 'amazon-feed', to: 'fastapi-ingest' },
  { from: 'fastapi-ingest', to: 'minio-bronze' },
  { from: 'minio-bronze', to: 'spark-etl' },
  { from: 'spark-etl', to: 'minio-silver' },
  { from: 'minio-silver', to: 'dbt-staging' },
  { from: 'dbt-staging', to: 'dbt-marts' },
  { from: 'dbt-marts', to: 'postgres-gold' },
  { from: 'postgres-gold', to: 'metabase' },
  { from: 'postgres-gold', to: 'api-endpoints' },
  { from: 'postgres-gold', to: 'scheduled-reports' },
];

// ============================================================================
// Trace Field Paths
// ============================================================================

const traceFields: { field: string; description: string; path: string[] }[] = [
  {
    field: 'user_id',
    description: 'User identifier',
    path: ['taobao-csv', 'fastapi-ingest', 'minio-bronze', 'spark-etl', 'minio-silver', 'dbt-staging', 'dbt-marts', 'postgres-gold', 'metabase', 'api-endpoints'],
  },
  {
    field: 'item_id',
    description: 'Product identifier',
    path: ['taobao-csv', 'fastapi-ingest', 'minio-bronze', 'spark-etl', 'minio-silver', 'dbt-staging', 'dbt-marts', 'postgres-gold', 'metabase'],
  },
  {
    field: 'behavior_type',
    description: 'User action (pv/cart/buy/fav)',
    path: ['taobao-csv', 'fastapi-ingest', 'minio-bronze', 'spark-etl', 'minio-silver', 'dbt-staging', 'dbt-marts', 'postgres-gold', 'metabase'],
  },
  {
    field: 'timestamp',
    description: 'Event timestamp',
    path: ['taobao-csv', 'mock-gen', 'amazon-feed', 'fastapi-ingest', 'minio-bronze', 'spark-etl', 'minio-silver', 'dbt-staging', 'dbt-marts', 'postgres-gold', 'metabase', 'api-endpoints', 'scheduled-reports'],
  },
  {
    field: 'session_id',
    description: 'Generated session identifier',
    path: ['spark-etl', 'minio-silver', 'dbt-staging', 'dbt-marts', 'postgres-gold', 'metabase', 'api-endpoints'],
  },
  {
    field: 'category_id',
    description: 'Product category',
    path: ['taobao-csv', 'fastapi-ingest', 'minio-bronze', 'spark-etl', 'minio-silver', 'dbt-staging', 'dbt-marts', 'postgres-gold', 'metabase'],
  },
];

// ============================================================================
// Summary Data
// ============================================================================

const layerSummary = [
  {
    layer: 'bronze' as LayerType,
    volume: '2.4 GB',
    rows: '15.6M rows',
    format: 'CSV',
    freshness: '< 1 hour ago',
    icon: HardDrive,
  },
  {
    layer: 'silver' as LayerType,
    volume: '1.8 GB',
    rows: '14.8M rows',
    format: 'Parquet',
    freshness: '< 15 min ago',
    icon: Database,
  },
  {
    layer: 'gold' as LayerType,
    volume: '1.2 GB',
    rows: '8 tables',
    format: 'PostgreSQL',
    freshness: '< 5 min ago',
    icon: Activity,
  },
];

const processingTimes = [
  { stage: 'CSV Ingestion', time: '~3 min', tech: 'FastAPI' },
  { stage: 'Spark ETL', time: '~8 min', tech: 'Spark 3.5' },
  { stage: 'dbt Transform', time: '~4 min', tech: 'dbt-core' },
  { stage: 'Report Generation', time: '~15 sec', tech: 'Airflow' },
];

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const detailVariants = {
  enter: { opacity: 0, y: 20, scale: 0.97 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.2 } },
};

// ============================================================================
// Helpers
// ============================================================================

function getEdgePath(from: LineageNode, to: LineageNode): string {
  const sx = from.x + HALF_W;
  const sy = from.y;
  const tx = to.x - HALF_W;
  const ty = to.y;
  const dx = tx - sx;
  const cp = Math.max(dx * 0.45, 40);
  return `M ${sx},${sy} C ${sx + cp},${sy} ${tx - cp},${ty} ${tx},${ty}`;
}

function isEdgeOnTrace(
  edge: LineageEdge,
  traceNodeIds: Set<string>,
): boolean {
  return traceNodeIds.has(edge.from) && traceNodeIds.has(edge.to);
}

// ============================================================================
// Sub-components
// ============================================================================

function LayerLegend() {
  const layers: LayerType[] = ['source', 'bronze', 'transform', 'silver', 'gold', 'output'];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {layers.map((l) => {
        const m = layerMeta[l];
        return (
          <div key={l} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: m.color }}
            />
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Data Volume */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 flex items-center justify-center">
                <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-sm font-semibold">Data Volume by Layer</span>
            </div>
            <div className="space-y-2">
              {layerSummary.map((s) => {
                const m = layerMeta[s.layer];
                return (
                  <div key={s.layer} className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-[10px] ${m.badgeClass}`}>
                      {m.label}
                    </Badge>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{s.volume}</span>
                      <span className="font-medium">{s.rows}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing Times */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-950/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
              </div>
              <span className="text-sm font-semibold">Pipeline Timing</span>
            </div>
            <div className="space-y-2">
              {processingTimes.map((p) => (
                <div key={p.stage} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.stage}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {p.tech}
                    </Badge>
                    <span className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">{p.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Freshness */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold">Data Freshness</span>
            </div>
            <div className="space-y-2">
              {layerSummary.map((s) => {
                const m = layerMeta[s.layer];
                return (
                  <div key={s.layer} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {s.freshness}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Full pipeline E2E: ~17 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function NodeDetailPanel({
  node,
  onClose,
}: {
  node: LineageNode;
  onClose: () => void;
}) {
  const meta = layerMeta[node.layer];

  return (
    <motion.div variants={detailVariants} initial="enter" animate="center" exit="exit">
      <Card className="shadow-md border-2" style={{ borderColor: meta.color + '40' }}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: meta.bgColor }}
              >
                <DynamicIcon name={node.iconName} size={20} color={meta.color} />
              </div>
              <div>
                <CardTitle className="text-lg">{node.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{node.sublabel}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Badge variant="outline" className={`text-[10px] ${meta.badgeClass} w-fit mt-1`}>
            {meta.label} Layer
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{node.details.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Input */}
            <div className="rounded-lg p-3 bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Input</span>
              </div>
              <p className="text-xs text-foreground/80">{node.details.inputFormat}</p>
            </div>
            {/* Output */}
            <div className="rounded-lg p-3 bg-muted/50 border border-border">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
              </div>
              <p className="text-xs text-foreground/80">{node.details.outputFormat}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg p-2.5 bg-muted/30 border border-border text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">Rows</div>
              <div className="text-xs font-semibold">{node.details.rowCount}</div>
            </div>
            <div className="rounded-lg p-2.5 bg-muted/30 border border-border text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">Latency</div>
              <div className="text-xs font-semibold">{node.details.latency}</div>
            </div>
            <div className="rounded-lg p-2.5 bg-muted/30 border border-border text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">Format</div>
              <div className="text-xs font-semibold">{node.details.outputFormat.split(' ')[0]}</div>
            </div>
            <div className="rounded-lg p-2.5 bg-muted/30 border border-border text-center">
              <div className="text-[10px] text-muted-foreground mb-0.5">Tech</div>
              <div className="text-xs font-semibold truncate">{node.details.tech.split(',')[0]}</div>
            </div>
          </div>

          {/* Transformation */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-fuchsia-500" />
              <span className="text-xs font-semibold">Transformation Logic</span>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {node.details.transformation}
              </pre>
            </div>
          </div>

          {/* Sample Data */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs font-semibold">Sample Data</span>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <code className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                {node.details.sampleData}
              </code>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="flex items-center gap-2 flex-wrap">
            {node.details.tech.split(',').map((t) => (
              <Badge key={t.trim()} variant="secondary" className="text-[10px]">
                {t.trim()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// SVG Icon Renderer
// ============================================================================

function SvgIcon({
  iconName,
  x,
  y,
  color,
}: {
  iconName: string;
  x: number;
  y: number;
  color: string;
}) {
  return (
    <foreignObject x={x - 11} y={y - 11} width={22} height={22}>
      <div className="flex items-center justify-center" style={{ width: 22, height: 22 }}>
        <DynamicIcon name={iconName} size={16} color={color} />
      </div>
    </foreignObject>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DataLineage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [traceField, setTraceField] = useState<string>('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => (selectedNodeId ? lineageNodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId],
  );

  const traceNodeIds = useMemo(() => {
    if (!traceField) return new Set<string>();
    const entry = traceFields.find((f) => f.field === traceField);
    if (!entry) return new Set<string>();
    return new Set(entry.path);
  }, [traceField]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Column header positions
  const columnHeaders: { label: string; x: number; layer: LayerType }[] = [
    { label: 'SOURCES', x: 100, layer: 'source' },
    { label: 'BRONZE', x: 330, layer: 'bronze' },
    { label: 'TRANSFORM', x: 570, layer: 'transform' },
    { label: 'SILVER / GOLD', x: 800, layer: 'silver' },
    { label: 'OUTPUTS', x: 1050, layer: 'output' },
  ];

  return (
    <section id="data-lineage" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground mb-4">
            <Activity className="w-3.5 h-3.5 text-fuchsia-500" />
            Interactive Explorer
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Data Lineage Explorer
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trace data from raw sources through every transformation to final outputs. Click any node to explore stage details.
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground/70 mt-2 flex items-center justify-center gap-1.5"
          >
            <span>Click any node to explore</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.span>
          </motion.p>
        </motion.div>

        {/* ── Summary Cards ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mb-8"
        >
          <SummaryCards />
        </motion.div>

        {/* ── Controls Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          {/* Trace Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Trace Data Field:</span>
            </div>
            <Select value={traceField} onValueChange={setTraceField}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Select a field..." />
              </SelectTrigger>
              <SelectContent>
                {traceFields.map((f) => (
                  <SelectItem key={f.field} value={f.field}>
                    <span className="font-mono">{f.field}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {traceField && (
              <Button variant="ghost" size="sm" onClick={() => setTraceField('')} className="h-9 gap-1.5 text-xs">
                <X className="w-3 h-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Legend */}
          <div className="hidden sm:block">
            <LayerLegend />
          </div>
        </motion.div>

        {/* Trace Info Banner */}
        <AnimatePresence>
          {traceField && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="rounded-lg bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2.5 mb-4 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>
                  Tracing <code className="font-mono font-semibold text-amber-700 dark:text-amber-300">{traceField}</code>
                  {' — passes through '}
                  <span className="font-semibold text-amber-700 dark:text-amber-300">{traceNodeIds.size}</span>
                  {' stages in the pipeline'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SVG Lineage Graph ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6"
        >
          <div className="overflow-x-auto custom-scrollbar p-2 sm:p-4">
            <svg
              viewBox="0 0 1150 640"
              className="w-full h-auto min-w-[700px]"
              preserveAspectRatio="xMidYMid meet"
              style={{ maxHeight: 640 }}
            >
              <defs>
                {/* Animated dash */}
                <style>{`
                  @keyframes dash-flow {
                    to { stroke-dashoffset: -24; }
                  }
                  @keyframes glow-pulse {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.5; }
                  }
                `}</style>
                {/* Arrow marker */}
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="var(--muted-foreground, #64748b)" opacity="0.5" />
                </marker>
                {/* Highlighted arrow */}
                <marker
                  id="arrowhead-hl"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" opacity="0.9" />
                </marker>
              </defs>

              {/* ── Column Header Backgrounds ── */}
              {columnHeaders.map((col) => {
                const meta = layerMeta[col.layer];
                return (
                  <rect
                    key={col.label}
                    x={col.x - 82}
                    y={10}
                    width={164}
                    height={30}
                    rx={6}
                    fill={meta.headerBg}
                    stroke={meta.headerBorder}
                    strokeWidth={1}
                  />
                );
              })}

              {/* ── Column Headers ── */}
              {columnHeaders.map((col) => {
                const meta = layerMeta[col.layer];
                return (
                  <text
                    key={col.label}
                    x={col.x}
                    y={30}
                    textAnchor="middle"
                    fill={meta.color}
                    fontSize={11}
                    fontWeight={700}
                    letterSpacing="0.08em"
                    fontFamily="ui-monospace, monospace"
                  >
                    {col.label}
                  </text>
                );
              })}

              {/* ── Edges ── */}
              {lineageEdges.map((edge) => {
                const fromNode = lineageNodes.find((n) => n.id === edge.from);
                const toNode = lineageNodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const pathD = getEdgePath(fromNode, toNode);
                const onTrace = traceField && isEdgeOnTrace(edge, traceNodeIds);
                const dimmed = traceField && !onTrace;
                const isHoverPath =
                  hoveredNodeId &&
                  (edge.from === hoveredNodeId || edge.to === hoveredNodeId);

                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    {/* Glow path for highlighted edges */}
                    {(onTrace || isHoverPath) && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={onTrace ? '#f59e0b' : layerMeta[fromNode.layer].color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        opacity={0.12}
                        style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
                      />
                    )}
                    {/* Main edge path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={dimmed ? 'var(--border, #e2e8f0)' : onTrace ? '#f59e0b' : isHoverPath ? layerMeta[fromNode.layer].color : 'var(--muted-foreground, #64748b)'}
                      strokeWidth={onTrace ? 2.5 : isHoverPath ? 2 : 1.5}
                      strokeDasharray={onTrace ? '8 4' : '6 3'}
                      strokeLinecap="round"
                      opacity={dimmed ? 0.3 : onTrace ? 1 : isHoverPath ? 0.9 : 0.4}
                      markerEnd={onTrace ? 'url(#arrowhead-hl)' : 'url(#arrowhead)'}
                      style={onTrace || !dimmed ? { animation: 'dash-flow 1.5s linear infinite' } : undefined}
                    />
                  </g>
                );
              })}

              {/* ── Nodes ── */}
              {lineageNodes.map((node) => {
                const meta = layerMeta[node.layer];
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isOnTrace = traceNodeIds.has(node.id);
                const isDimmed = traceField && !isOnTrace;
                const isActive = isSelected || isHovered || (traceField && isOnTrace);

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => handleNodeClick(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{ transition: 'opacity 0.2s ease' }}
                    opacity={isDimmed ? 0.25 : 1}
                  >
                    {/* Outer glow (selected or on trace) */}
                    {(isSelected || (traceField && isOnTrace)) && (
                      <rect
                        x={node.x - HALF_W - 4}
                        y={node.y - HALF_H - 4}
                        width={NODE_W + 8}
                        height={NODE_H + 8}
                        rx={14}
                        fill="none"
                        stroke={isSelected ? meta.color : '#f59e0b'}
                        strokeWidth={2}
                        style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
                      />
                    )}

                    {/* Shadow */}
                    <rect
                      x={node.x - HALF_W + 1}
                      y={node.y - HALF_H + 2}
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill="var(--foreground, #0f172a)"
                      opacity="0.05"
                    />

                    {/* Node background */}
                    <rect
                      x={node.x - HALF_W}
                      y={node.y - HALF_H}
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={isActive ? meta.bgColor : 'var(--card, #ffffff)'}
                      stroke={isActive ? meta.color : 'var(--border, #e2e8f0)'}
                      strokeWidth={isActive ? 2 : 1.2}
                      style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                    />

                    {/* Top accent bar */}
                    <rect
                      x={node.x - HALF_W + 10}
                      y={node.y - HALF_H}
                      width={NODE_W - 20}
                      height={3}
                      rx={1.5}
                      fill={meta.color}
                      opacity={isActive ? 0.8 : 0.4}
                      style={{ transition: 'opacity 0.2s' }}
                    />

                    {/* Icon */}
                    <SvgIcon
                      iconName={node.iconName}
                      x={node.x - 58}
                      y={node.y - 2}
                      color={meta.color}
                    />

                    {/* Label */}
                    <text
                      x={node.x + 4}
                      y={node.y - 4}
                      textAnchor="middle"
                      fill="var(--foreground, #0f172a)"
                      fontSize={11}
                      fontWeight={600}
                      style={{ transition: 'fill 0.2s' }}
                    >
                      {node.label}
                    </text>

                    {/* Sublabel */}
                    <text
                      x={node.x + 4}
                      y={node.y + 12}
                      textAnchor="middle"
                      fill="var(--muted-foreground, #64748b)"
                      fontSize={9}
                      style={{ transition: 'fill 0.2s' }}
                    >
                      {node.sublabel}
                    </text>

                    {/* Selection indicator */}
                    {isSelected && (
                      <circle
                        cx={node.x + HALF_W - 8}
                        cy={node.y - HALF_H + 8}
                        r={4}
                        fill={meta.color}
                        opacity={0.9}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Mobile legend */}
          <div className="sm:hidden px-4 pb-3 border-t border-border pt-3">
            <LayerLegend />
          </div>
        </motion.div>

        {/* ── Node Detail Panel ── */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.div
              key={selectedNode.id}
              className="max-w-4xl mx-auto"
            >
              <NodeDetailPanel node={selectedNode} onClose={clearSelection} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

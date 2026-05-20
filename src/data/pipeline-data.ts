// ============================================================================
// E-Commerce Clickstream Analytics Pipeline - Portfolio Data
// ============================================================================

// ---- Type Definitions ----

export interface TechItem {
  name: string;
  icon: string; // lucide-react icon name
  description: string;
  category: 'ingestion' | 'processing' | 'transformation' | 'warehouse' | 'orchestration' | 'visualization';
  color: string; // tailwind color class
}

export interface PipelineStage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // tailwind bg color class
  details: string[];
  technologies: string[];
}

export interface DailyActiveUser {
  date: string;
  dau: number;
  mau_ratio: number;
}

export interface DailyMetric {
  date: string;
  pageViews: number;
  purchases: number;
  favorites: number;
  carts: number;
}

export interface FunnelStep {
  stage: string;
  count: number;
  rate: number;
}

export interface UserSegment {
  segment: string;
  count: number;
  color: string;
}

export interface TopCategory {
  category: string;
  views: number;
  purchases: number;
  conversionRate: number;
}

export interface RetentionCohort {
  cohort: string;
  size: number;
  day1: number;
  day3: number;
  day7: number;
  day14: number;
  day30: number;
}

export interface SchemaColumn {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
}

export interface SchemaTable {
  name: string;
  type: 'dimension' | 'fact';
  columns: SchemaColumn[];
  description?: string;
}

// Aliases for component compatibility
export type StarSchemaTable = SchemaTable;
export type StarSchemaColumn = SchemaColumn;

export interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
}

export interface SetupStep {
  step: number;
  title: string;
  command: string;
  description: string;
}

// ============================================================================
// 1. Tech Stack
// ============================================================================

export const techStack: TechItem[] = [
  {
    name: 'FastAPI',
    icon: 'Upload',
    description: 'Python-based REST API service for ingesting CSV clickstream data, validating schemas, and uploading to the data lake.',
    category: 'ingestion',
    color: 'emerald',
  },
  {
    name: 'MinIO',
    icon: 'HardDrive',
    description: 'S3-compatible object storage serving as the data lake with bronze and silver layers for raw and processed data.',
    category: 'processing',
    color: 'rose',
  },
  {
    name: 'Apache Spark',
    icon: 'Zap',
    description: 'PySpark-based distributed processing engine for data cleaning, validation, enrichment, and Parquet conversion.',
    category: 'processing',
    color: 'orange',
  },
  {
    name: 'Apache Airflow',
    icon: 'CalendarClock',
    description: 'Workflow orchestration platform scheduling and monitoring the entire ETL pipeline with DAG-based dependencies.',
    category: 'orchestration',
    color: 'cyan',
  },
  {
    name: 'dbt',
    icon: 'GitBranch',
    description: 'SQL-based transformation tool building staging, intermediate, and mart layers with tested, version-controlled models.',
    category: 'transformation',
    color: 'fuchsia',
  },
  {
    name: 'PostgreSQL',
    icon: 'Database',
    description: 'Relational data warehouse storing the star schema with dimension and fact tables for analytical queries.',
    category: 'warehouse',
    color: 'sky',
  },
  {
    name: 'Metabase',
    icon: 'BarChart3',
    description: 'Business intelligence platform powering 20+ interactive dashboards for product and business analytics.',
    category: 'visualization',
    color: 'amber',
  },
  {
    name: 'Docker',
    icon: 'Container',
    description: 'Containerization platform ensuring reproducible, isolated deployments across development and production environments.',
    category: 'orchestration',
    color: 'teal',
  },
  {
    name: 'Prometheus',
    icon: 'Activity',
    description: 'Monitoring and alerting system tracking pipeline health, data quality metrics, and service SLAs in real time.',
    category: 'orchestration',
    color: 'rose',
  },
];

// ============================================================================
// 2. Pipeline Stages
// ============================================================================

export const pipelineStages: (PipelineStage & { number: number; tab: string; tabId: string })[] = [
  {
    id: 1,
    number: 1,
    tab: 'Ingest',
    tabId: 'ingestion',
    title: 'Data Ingestion',
    subtitle: 'FastAPI CSV Collector',
    description:
      'A FastAPI-based microservice that downloads clickstream CSV files from external sources, validates the data schema against defined contracts, and uploads validated files to the MinIO bronze layer.',
    icon: 'Download',
    color: 'bg-green-500/10 border-green-500/30',
    details: [
      'REST API endpoints for CSV upload and scheduled pull',
      'JSON Schema validation for 12 required columns',
      'Automatic duplicate detection via event_id hashing',
      'Retry logic with exponential backoff on failures',
      'Uploads validated CSV to MinIO bronze bucket partitioned by date',
    ],
    technologies: ['FastAPI', 'Python', 'MinIO SDK', 'Pydantic'],
  },
  {
    id: 2,
    number: 2,
    tab: 'Raw',
    tabId: 'raw-storage',
    title: 'Raw Storage',
    subtitle: 'MinIO Bronze Layer',
    description:
      'S3-compatible object storage acting as the data lake bronze layer, storing raw CSV files partitioned by ingestion date with immutable append-only semantics.',
    icon: 'HardDrive',
    color: 'bg-rose-500/10 border-rose-500/30',
    details: [
      'CSV format preserving original raw data fidelity',
      'Date-based partitioning: s3://bronze/clickstream/year=YYYY/month=MM/day=DD/',
      'Lifecycle policies: auto-archive after 90 days, delete after 1 year',
      'Versioning enabled for audit trail and recovery',
      '~2.5 GB daily ingestion volume across 8–12 CSV files',
    ],
    technologies: ['MinIO', 'S3 API', 'Parquet', 'Partitioning'],
  },
  {
    id: 3,
    number: 3,
    tab: 'Process',
    tabId: 'processing',
    title: 'Data Processing',
    subtitle: 'PySpark ETL Engine',
    description:
      'Distributed data processing pipeline built on Apache Spark (PySpark) that cleans raw data, validates business rules, enriches records with derived fields, and writes optimized Parquet files.',
    icon: 'Zap',
    color: 'bg-orange-500/10 border-orange-500/30',
    details: [
      'Deduplication using event_id and composite timestamp keys',
      'Null handling: impute missing user_agent, forward-fill session fields',
      'Data type casting and constraint validation (e.g., price > 0)',
      'Derived columns: session_duration, page_category, is_mobile',
      'Writes columnar Parquet with Snappy compression (~70% size reduction)',
      'Processes ~1.5M events/day with 4-worker cluster in ~12 min',
    ],
    technologies: ['Apache Spark', 'PySpark', 'Parquet', 'Snappy'],
  },
  {
    id: 4,
    number: 4,
    tab: 'Silver',
    tabId: 'silver-storage',
    title: 'Silver Storage',
    subtitle: 'MinIO Silver Layer',
    description:
      'Cleaned and enriched data stored in Parquet format in the silver layer, partitioned by event_date for efficient query pruning and downstream consumption.',
    icon: 'Database',
    color: 'bg-sky-500/10 border-sky-500/30',
    details: [
      'Parquet columnar format for fast analytical reads',
      'Partitioned by event_date: s3://silver/clickstream/event_date=YYYY-MM-DD/',
      'Snappy compression reducing storage by ~70%',
      'Optimized for dbt Spark and direct SQL querying via Trino',
      'Data quality checks: row count parity with bronze, null ratio < 0.1%',
      '~750 MB daily after compression (from ~2.5 GB raw)',
    ],
    technologies: ['MinIO', 'Parquet', 'Snappy', 'Partitioning'],
  },
  {
    id: 5,
    number: 5,
    tab: 'Transform',
    tabId: 'transform',
    title: 'Data Transformation',
    subtitle: 'dbt Modeling Layer',
    description:
      'dbt transforms silver data into a well-structured star schema with staging, intermediate, and mart layers, all version-controlled and tested.',
    icon: 'GitBranch',
    color: 'bg-fuchsia-500/10 border-fuchsia-500/30',
    details: [
      'Staging layer (stg_): 1:1 mapping from silver, standardized column names',
      'Intermediate layer (int_): joined and denormalized entities (user sessions, item catalogs)',
      'Mart layer (mart_): business-ready fact and dimension tables',
      'Aggregation tables: daily metrics, conversion funnels, user retention cohorts',
      '40+ dbt models with 85%+ test coverage (unique, not_null, accepted_ranges)',
      'Documentation auto-generated with dbt docs',
    ],
    technologies: ['dbt', 'SQL', 'Jinja', 'dbt Tests'],
  },
  {
    id: 6,
    number: 6,
    tab: 'Warehouse',
    tabId: 'warehouse',
    title: 'Data Warehouse',
    subtitle: 'PostgreSQL Star Schema',
    description:
      'PostgreSQL serves as the analytical data warehouse with a star schema design comprising 4 dimension tables and 5 fact/aggregate tables optimized for BI queries.',
    icon: 'Database',
    color: 'bg-violet-500/10 border-violet-500/30',
    details: [
      'Dimension tables: dim_user, dim_item, dim_category, dim_date (SCD Type 2 for dim_user)',
      'Core fact table: fact_clickstream with 1.5M+ daily rows',
      'Aggregate tables: daily_metrics, conversion_funnel, user_retention, top_items',
      'Indexes: B-tree on foreign keys, BRIN on fact_clickstream(event_date)',
      'Materialized views for Metabase dashboard pre-aggregation',
      'Query performance: p99 < 2s for dashboard queries on 90-day window',
    ],
    technologies: ['PostgreSQL', 'SQL', 'Indexes', 'Materialized Views'],
  },
  {
    id: 7,
    number: 7,
    tab: 'Dashboard',
    tabId: 'dashboard',
    title: 'BI Dashboards',
    subtitle: 'Metabase Analytics',
    description:
      'Metabase provides interactive business intelligence dashboards with 20+ analytical queries covering user behavior, conversion funnels, product performance, and retention analysis.',
    icon: 'BarChart3',
    color: 'bg-amber-500/10 border-amber-500/30',
    details: [
      'Executive Overview: DAU/MAU trends, revenue metrics, key KPI cards',
      'User Behavior: session flow analysis, page heatmaps, device breakdown',
      'Conversion Funnel: page view → favorite → cart → purchase drop-off analysis',
      'Product Analytics: top categories, item performance, category trends',
      'Retention Cohorts: week-based cohort tables with 1/3/7/14/30-day retention',
      'All dashboards auto-refreshed every 6 hours via Metabase scheduled pulses',
    ],
    technologies: ['Metabase', 'SQL', 'Dashboards', 'Scheduled Pulses'],
  },
];

// ============================================================================
// 3. Dashboard Charts - Dashboard Preview Data for Recharts
// ============================================================================

// --- Daily Active Users (30 days) ---
export const dailyActiveUsers: DailyActiveUser[] = [
  { date: 'Jan 1',  dau: 38200,  mau_ratio: 0.128 },
  { date: 'Jan 2',  dau: 35400,  mau_ratio: 0.119 },
  { date: 'Jan 3',  dau: 37100,  mau_ratio: 0.124 },
  { date: 'Jan 4',  dau: 39800,  mau_ratio: 0.133 },
  { date: 'Jan 5',  dau: 42500,  mau_ratio: 0.142 },
  { date: 'Jan 6',  dau: 47300,  mau_ratio: 0.158 },
  { date: 'Jan 7',  dau: 48900,  mau_ratio: 0.163 },
  { date: 'Jan 8',  dau: 42100,  mau_ratio: 0.141 },
  { date: 'Jan 9',  dau: 39600,  mau_ratio: 0.132 },
  { date: 'Jan 10', dau: 40800,  mau_ratio: 0.136 },
  { date: 'Jan 11', dau: 43200,  mau_ratio: 0.144 },
  { date: 'Jan 12', dau: 46100,  mau_ratio: 0.154 },
  { date: 'Jan 13', dau: 50200,  mau_ratio: 0.168 },
  { date: 'Jan 14', dau: 51800,  mau_ratio: 0.173 },
  { date: 'Jan 15', dau: 44300,  mau_ratio: 0.148 },
  { date: 'Jan 16', dau: 41700,  mau_ratio: 0.139 },
  { date: 'Jan 17', dau: 43500,  mau_ratio: 0.145 },
  { date: 'Jan 18', dau: 45900,  mau_ratio: 0.153 },
  { date: 'Jan 19', dau: 48600,  mau_ratio: 0.162 },
  { date: 'Jan 20', dau: 53100,  mau_ratio: 0.177 },
  { date: 'Jan 21', dau: 54700,  mau_ratio: 0.183 },
  { date: 'Jan 22', dau: 46800,  mau_ratio: 0.156 },
  { date: 'Jan 23', dau: 44200,  mau_ratio: 0.148 },
  { date: 'Jan 24', dau: 45100,  mau_ratio: 0.151 },
  { date: 'Jan 25', dau: 47800,  mau_ratio: 0.160 },
  { date: 'Jan 26', dau: 49200,  mau_ratio: 0.164 },
  { date: 'Jan 27', dau: 53900,  mau_ratio: 0.180 },
  { date: 'Jan 28', dau: 55200,  mau_ratio: 0.184 },
  { date: 'Jan 29', dau: 47600,  mau_ratio: 0.159 },
  { date: 'Jan 30', dau: 45300,  mau_ratio: 0.151 },
];

// --- Daily Metrics (30 days) ---
export const dailyMetrics: DailyMetric[] = [
  { date: 'Jan 1',  pageViews: 852000,  purchases: 89400,  favorites: 42800,  carts: 108500 },
  { date: 'Jan 2',  pageViews: 814000,  purchases: 82100,  favorites: 40100,  carts: 101200 },
  { date: 'Jan 3',  pageViews: 839000,  purchases: 86200,  favorites: 41900,  carts: 105800 },
  { date: 'Jan 4',  pageViews: 891000,  purchases: 94500,  favorites: 46200,  carts: 118300 },
  { date: 'Jan 5',  pageViews: 942000,  purchases: 103800, favorites: 50100,  carts: 128400 },
  { date: 'Jan 6',  pageViews: 1023000, purchases: 118200, favorites: 57300,  carts: 142600 },
  { date: 'Jan 7',  pageViews: 1068000, purchases: 124500, favorites: 60200,  carts: 149300 },
  { date: 'Jan 8',  pageViews: 928000,  purchases: 98700,  favorites: 47900,  carts: 121100 },
  { date: 'Jan 9',  pageViews: 876000,  purchases: 90300,  favorites: 44100,  carts: 110800 },
  { date: 'Jan 10', pageViews: 901000,  purchases: 93800,  favorites: 45800,  carts: 114200 },
  { date: 'Jan 11', pageViews: 958000,  purchases: 101200, favorites: 49400,  carts: 124100 },
  { date: 'Jan 12', pageViews: 1002000, purchases: 108900, favorites: 53100,  carts: 132500 },
  { date: 'Jan 13', pageViews: 1076000, purchases: 123400, favorites: 59800,  carts: 148700 },
  { date: 'Jan 14', pageViews: 1112000, purchases: 129800, favorites: 63400,  carts: 155600 },
  { date: 'Jan 15', pageViews: 962000,  purchases: 104100, favorites: 50200,  carts: 126300 },
  { date: 'Jan 16', pageViews: 918000,  purchases: 96200,  favorites: 46700,  carts: 117800 },
  { date: 'Jan 17', pageViews: 945000,  purchases: 99800,  favorites: 48500,  carts: 121900 },
  { date: 'Jan 18', pageViews: 992000,  purchases: 106500, favorites: 51900,  carts: 130200 },
  { date: 'Jan 19', pageViews: 1041000, purchases: 114200, favorites: 55700,  carts: 138400 },
  { date: 'Jan 20', pageViews: 1108000, purchases: 128600, favorites: 62400,  carts: 153200 },
  { date: 'Jan 21', pageViews: 1145000, purchases: 134200, favorites: 65100,  carts: 159800 },
  { date: 'Jan 22', pageViews: 998000,  purchases: 107300, favorites: 52300,  carts: 130500 },
  { date: 'Jan 23', pageViews: 947000,  purchases: 99100,  favorites: 48200,  carts: 120600 },
  { date: 'Jan 24', pageViews: 962000,  purchases: 101500, favorites: 49400,  carts: 123400 },
  { date: 'Jan 25', pageViews: 1012000, purchases: 109800, favorites: 53500,  carts: 133100 },
  { date: 'Jan 26', pageViews: 1038000, purchases: 112500, favorites: 54800,  carts: 136700 },
  { date: 'Jan 27', pageViews: 1098000, purchases: 126800, favorites: 61500,  carts: 151400 },
  { date: 'Jan 28', pageViews: 1132000, purchases: 132100, favorites: 64200,  carts: 157900 },
  { date: 'Jan 29', pageViews: 987000,  purchases: 105400, favorites: 51200,  carts: 128300 },
  { date: 'Jan 30', pageViews: 958000,  purchases: 100800, favorites: 49100,  carts: 123100 },
];

// --- Conversion Funnel ---
export const conversionFunnel: FunnelStep[] = [
  { stage: 'Page Views', count: 1150000, rate: 100 },
  { stage: 'Favorites',  count: 85000,   rate: 7.4 },
  { stage: 'Add to Cart', count: 210000,  rate: 18.3 },
  { stage: 'Purchases',  count: 172500,  rate: 15.0 },
];

// --- User Segments ---
export const userSegments: UserSegment[] = [
  { segment: 'Browser',     count: 15000, color: '#94a3b8' },
  { segment: 'Casual',      count: 25000, color: '#22d3ee' },
  { segment: 'Regular',     count: 7500,  color: '#a78bfa' },
  { segment: 'Power Buyer', count: 2500,  color: '#f59e0b' },
];

// --- Top Categories ---
export const topCategories: TopCategory[] = [
  { category: 'Electronics',   views: 2450000, purchases: 312000, conversionRate: 12.7 },
  { category: 'Fashion',       views: 1980000, purchases: 285000, conversionRate: 14.4 },
  { category: 'Home & Garden', views: 1620000, purchases: 198000, conversionRate: 12.2 },
  { category: 'Sports',        views: 1340000, purchases: 156000, conversionRate: 11.6 },
  { category: 'Beauty',        views: 1180000, purchases: 178000, conversionRate: 15.1 },
  { category: 'Books',         views: 980000,  purchases: 142000, conversionRate: 14.5 },
  { category: 'Food',          views: 860000,  purchases: 98000,  conversionRate: 11.4 },
  { category: 'Toys',          views: 720000,  purchases: 89000,  conversionRate: 12.4 },
];

// --- Retention Cohorts (week-based) ---
export const retentionCohorts: RetentionCohort[] = [
  { cohort: 'Week 1', size: 45000, day1: 68, day3: 45, day7: 28, day14: 18, day30: 12 },
  { cohort: 'Week 2', size: 52000, day1: 72, day3: 48, day7: 32, day14: 22, day30: 15 },
  { cohort: 'Week 3', size: 48000, day1: 65, day3: 42, day7: 25, day14: 16, day30: 10 },
  { cohort: 'Week 4', size: 55000, day1: 70, day3: 46, day7: 30, day14: 20, day30: 13 },
];

// ============================================================================
// 4. Star Schema Tables (ERD Visualization)
// ============================================================================

export const starSchemaTables: SchemaTable[] = [
  {
    name: 'dim_user',
    type: 'dimension',
    columns: [
      { name: 'user_sk',      type: 'SERIAL',      isPK: true },
      { name: 'user_id',      type: 'BIGINT',      isFK: true },
      { name: 'username',     type: 'VARCHAR(64)' },
      { name: 'email',        type: 'VARCHAR(128)' },
      { name: 'signup_date',  type: 'DATE' },
      { name: 'country',      type: 'VARCHAR(64)' },
      { name: 'device_type',  type: 'VARCHAR(32)' },
      { name: 'is_active',    type: 'BOOLEAN' },
      { name: 'user_segment', type: 'VARCHAR(32)' },
      { name: 'valid_from',   type: 'TIMESTAMPTZ' },
      { name: 'valid_to',     type: 'TIMESTAMPTZ' },
      { name: 'is_current',   type: 'BOOLEAN' },
    ],
  },
  {
    name: 'dim_item',
    type: 'dimension',
    columns: [
      { name: 'item_sk',          type: 'SERIAL',      isPK: true },
      { name: 'item_id',          type: 'BIGINT',      isFK: true },
      { name: 'item_name',        type: 'VARCHAR(256)' },
      { name: 'category_sk',      type: 'INTEGER',     isFK: true },
      { name: 'brand',            type: 'VARCHAR(128)' },
      { name: 'price_range',      type: 'VARCHAR(32)' },
      { name: 'avg_rating',       type: 'DECIMAL(3,2)' },
      { name: 'is_available',     type: 'BOOLEAN' },
      { name: 'first_seen_date',  type: 'DATE' },
    ],
  },
  {
    name: 'dim_category',
    type: 'dimension',
    columns: [
      { name: 'category_sk',      type: 'SERIAL',      isPK: true },
      { name: 'category_id',      type: 'INTEGER',     isFK: true },
      { name: 'category_name',    type: 'VARCHAR(128)' },
      { name: 'parent_category',  type: 'VARCHAR(128)' },
      { name: 'level',            type: 'INTEGER' },
    ],
  },
  {
    name: 'dim_date',
    type: 'dimension',
    columns: [
      { name: 'date_sk',          type: 'SERIAL',      isPK: true },
      { name: 'full_date',        type: 'DATE' },
      { name: 'day_of_week',      type: 'INTEGER' },
      { name: 'day_name',         type: 'VARCHAR(16)' },
      { name: 'week_of_year',     type: 'INTEGER' },
      { name: 'month',            type: 'INTEGER' },
      { name: 'month_name',       type: 'VARCHAR(16)' },
      { name: 'quarter',          type: 'INTEGER' },
      { name: 'year',             type: 'INTEGER' },
      { name: 'is_weekend',       type: 'BOOLEAN' },
      { name: 'is_holiday',       type: 'BOOLEAN' },
    ],
  },
  {
    name: 'fact_clickstream',
    type: 'fact',
    columns: [
      { name: 'event_id',       type: 'BIGINT',      isPK: true },
      { name: 'user_sk',        type: 'INTEGER',     isFK: true },
      { name: 'item_sk',        type: 'INTEGER',     isFK: true },
      { name: 'date_sk',        type: 'INTEGER',     isFK: true },
      { name: 'event_type',     type: 'VARCHAR(32)' },
      { name: 'session_id',     type: 'VARCHAR(64)' },
      { name: 'page_url',       type: 'TEXT' },
      { name: 'referrer',       type: 'TEXT' },
      { name: 'device_type',    type: 'VARCHAR(32)' },
      { name: 'user_agent',     type: 'VARCHAR(256)' },
      { name: 'event_timestamp', type: 'TIMESTAMPTZ' },
      { name: 'price',          type: 'DECIMAL(12,2)' },
    ],
  },
  {
    name: 'agg_daily_metrics',
    type: 'fact',
    columns: [
      { name: 'date_sk',       type: 'INTEGER',     isPK: true },
      { name: 'page_views',    type: 'BIGINT' },
      { name: 'unique_users',  type: 'INTEGER' },
      { name: 'sessions',      type: 'BIGINT' },
      { name: 'favorites',     type: 'BIGINT' },
      { name: 'add_to_cart',   type: 'BIGINT' },
      { name: 'purchases',     type: 'BIGINT' },
      { name: 'revenue',       type: 'DECIMAL(15,2)' },
      { name: 'avg_session_duration', type: 'DECIMAL(8,2)' },
    ],
  },
  {
    name: 'agg_conversion_funnel',
    type: 'fact',
    columns: [
      { name: 'date_sk',          type: 'INTEGER',  isPK: true },
      { name: 'page_view_count',  type: 'BIGINT' },
      { name: 'favorite_count',   type: 'BIGINT' },
      { name: 'cart_count',       type: 'BIGINT' },
      { name: 'purchase_count',   type: 'BIGINT' },
      { name: 'view_to_fav_rate', type: 'DECIMAL(5,2)' },
      { name: 'view_to_cart_rate', type: 'DECIMAL(5,2)' },
      { name: 'view_to_purchase_rate', type: 'DECIMAL(5,2)' },
    ],
  },
  {
    name: 'agg_user_retention',
    type: 'fact',
    columns: [
      { name: 'cohort_date',   type: 'DATE',       isPK: true },
      { name: 'cohort_size',   type: 'INTEGER' },
      { name: 'retained_d1',   type: 'INTEGER' },
      { name: 'retained_d3',   type: 'INTEGER' },
      { name: 'retained_d7',   type: 'INTEGER' },
      { name: 'retained_d14',  type: 'INTEGER' },
      { name: 'retained_d30',  type: 'INTEGER' },
      { name: 'retention_d1',  type: 'DECIMAL(5,2)' },
      { name: 'retention_d3',  type: 'DECIMAL(5,2)' },
      { name: 'retention_d7',  type: 'DECIMAL(5,2)' },
      { name: 'retention_d14', type: 'DECIMAL(5,2)' },
      { name: 'retention_d30', type: 'DECIMAL(5,2)' },
    ],
  },
  {
    name: 'agg_top_items',
    type: 'fact',
    columns: [
      { name: 'date_sk',       type: 'INTEGER',  isPK: true },
      { name: 'item_sk',       type: 'INTEGER',  isPK: true },
      { name: 'category_sk',   type: 'INTEGER',  isFK: true },
      { name: 'view_count',    type: 'BIGINT' },
      { name: 'favorite_count', type: 'BIGINT' },
      { name: 'cart_count',    type: 'BIGINT' },
      { name: 'purchase_count', type: 'BIGINT' },
      { name: 'total_revenue', type: 'DECIMAL(15,2)' },
      { name: 'conversion_rate', type: 'DECIMAL(5,2)' },
    ],
  },
];

// ============================================================================
// 5. Project Structure (Tree View)
// ============================================================================

export const projectStructure: TreeNode[] = [
  {
    name: 'ecommerce-clickstream-pipeline',
    type: 'folder',
    children: [
      { name: 'docker-compose.yml', type: 'file' },
      { name: '.env.example', type: 'file' },
      { name: 'Makefile', type: 'file' },
      {
        name: 'ingestion',
        type: 'folder',
        children: [
          { name: 'Dockerfile', type: 'file' },
          {
            name: 'app',
            type: 'folder',
            children: [
              { name: 'main.py', type: 'file' },
              { name: 'config.py', type: 'file' },
              {
                name: 'routes',
                type: 'folder',
                children: [
                  { name: 'upload.py', type: 'file' },
                  { name: 'health.py', type: 'file' },
                ],
              },
              {
                name: 'services',
                type: 'folder',
                children: [
                  { name: 'validator.py', type: 'file' },
                  { name: 'minio_client.py', type: 'file' },
                  { name: 'schema.py', type: 'file' },
                ],
              },
              {
                name: 'models',
                type: 'folder',
                children: [
                  { name: 'clickstream.py', type: 'file' },
                  { name: 'response.py', type: 'file' },
                ],
              },
            ],
          },
          { name: 'requirements.txt', type: 'file' },
          { name: 'tests', type: 'folder', children: [
            { name: 'test_validator.py', type: 'file' },
            { name: 'test_upload.py', type: 'file' },
            { name: 'conftest.py', type: 'file' },
          ] },
        ],
      },
      {
        name: 'spark',
        type: 'folder',
        children: [
          { name: 'Dockerfile', type: 'file' },
          {
            name: 'jobs',
            type: 'folder',
            children: [
              { name: 'clean_clickstream.py', type: 'file' },
              { name: 'validate_data.py', type: 'file' },
              { name: 'enrich_events.py', type: 'file' },
            ],
          },
          {
            name: 'utils',
            type: 'folder',
            children: [
              { name: 'spark_session.py', type: 'file' },
              { name: 'schema_defs.py', type: 'file' },
              { name: 'quality_checks.py', type: 'file' },
            ],
          },
          { name: 'entrypoint.sh', type: 'file' },
          { name: 'requirements.txt', type: 'file' },
        ],
      },
      {
        name: 'airflow',
        type: 'folder',
        children: [
          { name: 'Dockerfile', type: 'file' },
          {
            name: 'dags',
            type: 'folder',
            children: [
              { name: 'clickstream_pipeline.py', type: 'file' },
              { name: 'data_quality_dag.py', type: 'file' },
              { name: 'dbt_run_dag.py', type: 'file' },
            ],
          },
          {
            name: 'plugins',
            type: 'folder',
            children: [
              {
                name: 'operators',
                type: 'folder',
                children: [
                  { name: 'spark_submit.py', type: 'file' },
                  { name: 'minio_sensor.py', type: 'file' },
                ],
              },
            ],
          },
          { name: 'requirements.txt', type: 'file' },
          { name: 'entrypoint.sh', type: 'file' },
        ],
      },
      {
        name: 'dbt',
        type: 'folder',
        children: [
          { name: 'dbt_project.yml', type: 'file' },
          { name: 'profiles.yml', type: 'file' },
          { name: 'packages.yml', type: 'file' },
          {
            name: 'models',
            type: 'folder',
            children: [
              {
                name: 'staging',
                type: 'folder',
                children: [
                  { name: 'stg_clickstream.sql', type: 'file' },
                  { name: 'stg_users.sql', type: 'file' },
                  { name: 'stg_items.sql', type: 'file' },
                  { name: 'schema.yml', type: 'file' },
                ],
              },
              {
                name: 'intermediate',
                type: 'folder',
                children: [
                  { name: 'int_user_sessions.sql', type: 'file' },
                  { name: 'int_item_catalog.sql', type: 'file' },
                  { name: 'int_event_enriched.sql', type: 'file' },
                  { name: 'schema.yml', type: 'file' },
                ],
              },
              {
                name: 'marts',
                type: 'folder',
                children: [
                  {
                    name: 'core',
                    type: 'folder',
                    children: [
                      { name: 'dim_user.sql', type: 'file' },
                      { name: 'dim_item.sql', type: 'file' },
                      { name: 'dim_category.sql', type: 'file' },
                      { name: 'dim_date.sql', type: 'file' },
                      { name: 'fact_clickstream.sql', type: 'file' },
                      { name: 'schema.yml', type: 'file' },
                    ],
                  },
                  {
                    name: 'aggregates',
                    type: 'folder',
                    children: [
                      { name: 'agg_daily_metrics.sql', type: 'file' },
                      { name: 'agg_conversion_funnel.sql', type: 'file' },
                      { name: 'agg_user_retention.sql', type: 'file' },
                      { name: 'agg_top_items.sql', type: 'file' },
                      { name: 'schema.yml', type: 'file' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: 'tests',
            type: 'folder',
            children: [
              { name: 'assert_unique_event_id.sql', type: 'file' },
              { name: 'assert_not_null_user_id.sql', type: 'file' },
              { name: 'assert_positive_price.sql', type: 'file' },
            ],
          },
          {
            name: 'macros',
            type: 'folder',
            children: [
              { name: 'generate_schema_name.sql', type: 'file' },
              { name: 'date_spine.sql', type: 'file' },
            ],
          },
        ],
      },
      {
        name: 'sql',
        type: 'folder',
        children: [
          { name: 'create_schemas.sql', type: 'file' },
          { name: 'seed_dimensions.sql', type: 'file' },
          {
            name: 'materialized_views',
            type: 'folder',
            children: [
              { name: 'mv_daily_kpi.sql', type: 'file' },
              { name: 'mv_category_performance.sql', type: 'file' },
              { name: 'mv_user_segment_summary.sql', type: 'file' },
            ],
          },
          {
            name: 'migrations',
            type: 'folder',
            children: [
              { name: '001_initial_schema.sql', type: 'file' },
              { name: '002_add_retention_tables.sql', type: 'file' },
              { name: '003_add_indexes.sql', type: 'file' },
            ],
          },
        ],
      },
      {
        name: 'scripts',
        type: 'folder',
        children: [
          { name: 'download_kaggle_dataset.py', type: 'file' },
          { name: 'bootstrap_pipeline.sh', type: 'file' },
          { name: 'run_quality_checks.sh', type: 'file' },
          { name: 'backup_restore.sh', type: 'file' },
        ],
      },
      {
        name: 'monitoring',
        type: 'folder',
        children: [
          { name: 'prometheus.yml', type: 'file' },
          {
            name: 'alert_rules',
            type: 'folder',
            children: [
              { name: 'pipeline_health.yml', type: 'file' },
              { name: 'data_quality.yml', type: 'file' },
              { name: 'resource_usage.yml', type: 'file' },
            ],
          },
          {
            name: 'grafana',
            type: 'folder',
            children: [
              { name: 'dashboards', type: 'folder', children: [
                { name: 'pipeline_overview.json', type: 'file' },
                { name: 'data_quality.json', type: 'file' },
              ] },
              { name: 'provisioning', type: 'folder', children: [
                { name: 'datasources.yml', type: 'file' },
              ] },
            ],
          },
        ],
      },
      {
        name: 'docs',
        type: 'folder',
        children: [
          { name: 'architecture.md', type: 'file' },
          { name: 'data_dictionary.md', type: 'file' },
          { name: 'setup_guide.md', type: 'file' },
          { name: 'dbt_models.md', type: 'file' },
          { name: 'api_reference.md', type: 'file' },
        ],
      },
      {
        name: 'tests',
        type: 'folder',
        children: [
          { name: 'conftest.py', type: 'file' },
          {
            name: 'integration',
            type: 'folder',
            children: [
              { name: 'test_ingestion_pipeline.py', type: 'file' },
              { name: 'test_spark_processing.py', type: 'file' },
              { name: 'test_dbt_models.py', type: 'file' },
              { name: 'test_end_to_end.py', type: 'file' },
            ],
          },
          {
            name: 'fixtures',
            type: 'folder',
            children: [
              { name: 'sample_clickstream.csv', type: 'file' },
              { name: 'expected_output.json', type: 'file' },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// 6. Getting Started Steps
// ============================================================================

export const gettingStartedSteps: SetupStep[] = [
  {
    step: 1,
    title: 'Clone & Setup',
    command: 'git clone https://github.com/your-org/ecommerce-clickstream-pipeline.git && cd ecommerce-clickstream-pipeline && cp .env.example .env',
    description:
      'Clone the repository, navigate into the project directory, and copy the example environment file. Edit .env with your MinIO credentials, database connection strings, and API keys.',
  },
  {
    step: 2,
    title: 'Start Services',
    command: 'docker compose up -d',
    description:
      'Launch all infrastructure services including MinIO, PostgreSQL, Apache Airflow, Metabase, Prometheus, and Grafana. This may take 2–3 minutes on first run as Docker images are pulled and initialized.',
  },
  {
    step: 3,
    title: 'Download Kaggle Dataset',
    command: 'docker compose exec ingestion python scripts/download_kaggle_dataset.py --output /data/raw',
    description:
      'Download the real Alibaba Taobao User Behavior dataset from Kaggle (~1M records, ~11K users, Nov 25 - Dec 3, 2017). The dataset contains page views, favorites, cart additions, and purchase events with 5 columns.',
  },
  {
    step: 4,
    title: 'Run Pipeline',
    command: 'docker compose exec airflow airflow dags trigger clickstream_pipeline',
    description:
      'Trigger the main Airflow DAG to execute the full pipeline: CSV ingestion → Spark processing → dbt transformations → PostgreSQL loading. Monitor progress in the Airflow UI at localhost:8080.',
  },
  {
    step: 5,
    title: 'View Dashboards',
    command: 'open http://localhost:3000',
    description:
      'Access Metabase dashboards to explore KPIs, conversion funnels, user retention cohorts, and product analytics. Pre-built dashboards include Executive Overview, User Behavior, Product Analytics, and Retention Analysis.',
  },
];

// ============================================================================
// 7. Helper Constants
// ============================================================================

// --- Derived chart data for dashboard components ---
export const dauChartData = dailyActiveUsers;

export const conversionFunnelData = conversionFunnel.map((s) => ({
  stage: s.stage,
  count: s.count,
  rate: s.rate,
  Page_Views: s.stage === 'Page Views' ? s.count : 0,
  Favorites: s.stage === 'Favorites' ? s.count : 0,
  Add_to_Cart: s.stage === 'Add to Cart' ? s.count : 0,
  Purchases: s.stage === 'Purchases' ? s.count : 0,
}));

export const userSegmentsData = userSegments.map((s) => ({
  name: s.segment,
  value: s.count,
  fill: s.color,
}));

export const topCategoriesData = topCategories;

export const quickCommands = [
  { command: 'make up', description: 'Start all services' },
  { command: 'make down', description: 'Stop all services' },
  { command: 'make ingest', description: 'Ingest new data' },
  { command: 'make pipeline', description: 'Run full pipeline' },
  { command: 'make test', description: 'Run all tests' },
  { command: 'make logs', description: 'View service logs' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  ingestion: 'Data Ingestion',
  processing: 'Data Processing',
  transformation: 'Data Transformation',
  warehouse: 'Data Warehouse',
  orchestration: 'Orchestration',
  visualization: 'Visualization',
};

export const CATEGORY_COLORS: Record<string, string> = {
  ingestion: 'bg-green-500/10 text-green-400 border-green-500/30',
  processing: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  transformation: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  warehouse: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  orchestration: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  visualization: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search, HelpCircle, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

/* ────────────────────── Types & Data ────────────────────── */

type Category = 'pipeline' | 'data' | 'architecture' | 'deployment';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: Category;
}

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'data', label: 'Data' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'deployment', label: 'Deployment' },
];

function getCategoryBadge(category: Category) {
  const map: Record<Category, { className: string; label: string }> = {
    pipeline: {
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      label: 'Pipeline',
    },
    data: {
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      label: 'Data',
    },
    architecture: {
      className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      label: 'Architecture',
    },
    deployment: {
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      label: 'Deployment',
    },
  };
  return map[category];
}

const faqData: FaqItem[] = [
  {
    id: 'data-source',
    category: 'data',
    question: 'What data source does this pipeline use?',
    answer:
      'The pipeline is built around the Alibaba Taobao User Behavior Dataset from the Tianchi competition platform (available on Kaggle). The current dataset contains 100,000 clickstream events with 10,921 unique users, 98,772 unique items, and 5,787 categories spanning 9 days during the Double 11 shopping festival period (Nov 25 – Dec 3, 2017). Four behavior types are tracked: page views (pv), cart additions, favorites, and purchases.',
  },
  {
    id: 'medallion',
    category: 'architecture',
    question: 'What is the Medallion Architecture?',
    answer:
      'The Medallion Architecture (popularized by Databricks) organizes data into three progressively refined layers. The Bronze layer stores raw, unmodified ingested data (CSV files in MinIO). The Silver layer contains cleaned, deduplicated, and validated data in Parquet format with date partitioning. The Gold layer holds business-ready aggregations in a star schema — dimension tables and fact tables optimized for analytical queries and dashboarding.',
  },
  {
    id: 'ingestion',
    category: 'pipeline',
    question: 'How is data ingested into the pipeline?',
    answer:
      'Data is ingested via a FastAPI REST endpoint that accepts CSV file uploads. Each request is validated using Pydantic models that enforce schema constraints (user_id > 0, valid behavior types, timestamp ranges). Validated records are written to the Bronze layer in MinIO as raw CSV files with metadata tracking (source file, ingestion timestamp). The API supports batch uploads and returns quality check summaries per request.',
  },
  {
    id: 'spark',
    category: 'architecture',
    question: 'Why use Apache Spark for processing?',
    answer:
      'Apache Spark provides distributed ETL capabilities essential for handling large-scale clickstream data. Key benefits include in-memory processing for faster transformations, native support for reading/writing Parquet from S3-compatible storage (MinIO via S3A connector), built-in sessionization through window functions (grouping events into user sessions), and fault-tolerant execution with automatic retry. Spark processes the 100K-event dataset in under 10 seconds and scales to millions of events with cluster mode.',
  },
  {
    id: 'dbt',
    category: 'pipeline',
    question: 'What is dbt and why is it used?',
    answer:
      'dbt (data build tool) is the transformation layer that converts Silver-layer Parquet into the Gold-layer star schema. It uses version-controlled SQL to define staging models (stg_), intermediate models (int_), and final fact/dimension tables (fact_, dim_). Key advantages include automated testing (schema assertions, uniqueness, referential integrity), documentation generation, incremental materialization for large tables, and dependency-aware DAG execution.',
  },
  {
    id: 'warehouse',
    category: 'data',
    question: 'How is the data warehouse designed?',
    answer:
      'The warehouse follows a Star Schema with 4 dimension tables (dim_user, dim_item, dim_category, dim_date) and 1 fact table (fact_clickstream). Each dimension table contains slowly-changing attributes and surrogate keys. The fact table stores event-level metrics with foreign keys to all dimensions. Materialized views pre-compute daily KPI aggregates (DAU, conversion rate, revenue) for dashboard performance. PostgreSQL handles the warehouse with proper indexing and constraints.',
  },
  {
    id: 'quality',
    category: 'data',
    question: 'How does the pipeline handle data quality?',
    answer:
      'The pipeline implements 6 quality checks across layers: (1) Pydantic schema validation at ingestion, (2) Duplicate detection via SHA-256 hashing in Spark, (3) Referential integrity checks ensuring user/item/category IDs exist, (4) Statistical anomaly detection flagging outlier event patterns, (5) dbt tests for uniqueness and not-null constraints, (6) Daily data freshness monitoring comparing ingestion timestamps to expected schedules. Failed records are quarantined with error classification.',
  },
  {
    id: 'realtime',
    category: 'architecture',
    question: 'Can this pipeline process real-time data?',
    answer:
      'The current implementation is batch-optimized for daily ingestion cycles. However, the architecture supports a Lambda Architecture extension path: the FastAPI ingestion layer can feed Apache Kafka for real-time event streaming, Apache Flink can process streaming sessions and micro-batch aggregations, and Apache Druid can serve sub-second OLAP queries. The batch layer (Spark + dbt + PostgreSQL) continues to handle historical analysis and model retraining.',
  },
  {
    id: 'orchestration',
    category: 'deployment',
    question: 'How are microservices orchestrated?',
    answer:
      'All 8 pipeline services run as Docker containers orchestrated by Docker Compose with 4 isolated networks (ingestion, processing, warehouse, monitoring). Apache Airflow manages the workflow DAG with parameterized tasks chaining ingestion → Spark ETL → dbt transform → warehouse load → dashboard refresh. Each task has health checks, automatic retry (3 attempts with exponential backoff), and Slack/email alerting on failure.',
  },
  {
    id: 'monitoring',
    category: 'deployment',
    question: 'What monitoring is in place?',
    answer:
      'Prometheus scrapes custom metrics from all services (ingestion rate, processing latency, warehouse query times, container health). Grafana dashboards visualize pipeline health across 4 panels: ingestion throughput, Spark job duration, data quality scores, and system resource utilization. Key alerts include: ingestion lag > 1 hour, Spark job failure, warehouse connection errors, and disk usage > 80%. All metrics are exported via Prometheus client libraries.',
  },
  {
    id: 'deploy',
    category: 'deployment',
    question: 'How do I deploy this pipeline?',
    answer:
      'Deployment is fully containerized via Docker Compose. Clone the repository, copy `.env.example` to `.env`, and run `docker compose up -d` — 8 containers start automatically: FastAPI (8000), Spark Master (8080), Spark Worker (8081), MinIO (9001), PostgreSQL (5432), Airflow Webserver (8082), Metabase (3000), and Prometheus (9090). Bootstrap scripts initialize MinIO buckets, PostgreSQL schemas, and seed sample data. The full pipeline is operational in under 5 minutes.',
  },
  {
    id: 'throughput',
    category: 'pipeline',
    question: 'What is the expected throughput?',
    answer:
      'The batch pipeline achieves 100K events/sec sustained throughput with Apache Spark (3-node cluster). Single-node Spark processes the 100K-event dataset in under 10 seconds. The batch ingestion cycle (FastAPI → MinIO → Spark → dbt → PostgreSQL) completes a full daily run in approximately 2-3 minutes. For the streaming extension path (Kafka + Flink), the target is 10K events/sec per Flink task slot with sub-second latency for session window aggregations.',
  },
];

/* ────────────────────── Animation ────────────────────── */

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ────────────────────── Component ────────────────────── */

export default function Faq() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [allExpanded, setAllExpanded] = useState(false);

  const filtered = useMemo(() => {
    let items = faqData;
    if (activeCategory !== 'all') {
      items = items.filter((i) => i.category === activeCategory);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      items = items.filter(
        (i) =>
          i.question.toLowerCase().includes(q) ||
          i.answer.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeCategory, search]);

  return (
    <section id="faq" className="relative py-16 sm:py-20 bg-background">
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Title ── */}
        <motion.div
          ref={ref}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="text-center mb-10"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-emerald-500" />
              <span className="section-label">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Deep-dive answers about pipeline architecture, data flow, and deployment
            </p>
          </motion.div>
        </motion.div>

        {/* ── Controls ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-4 mb-8"
        >
          {/* Search + Expand All */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              onClick={() => setAllExpanded((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200 shrink-0"
            >
              <ChevronsUpDown className="h-4 w-4" />
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent/60',
                  )}
                >
                  {cat.label}
                  {cat.value !== 'all' && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({faqData.filter((i) => i.category === cat.value).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── FAQ Grid ── */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
        >
          {filtered.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              className="text-center py-16 text-muted-foreground"
            >
              <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No matching questions found</p>
              <p className="text-sm mt-1">Try adjusting your search or category filter</p>
            </motion.div>
          ) : (
            <Accordion
              type="multiple"
              className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
              {...(allExpanded && {
                defaultValue: filtered.map((i) => i.id),
              })}
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((item, index) => {
                  const badge = getCategoryBadge(item.category);
                  return (
                    <motion.div
                      key={item.id}
                      variants={fadeInUp}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.04 }}
                    >
                      <AccordionItem
                        value={item.id}
                        className="border-border/60 bg-card rounded-lg px-4 mb-3 border shadow-sm transition-shadow duration-200 hover:shadow-md"
                      >
                        <AccordionTrigger className="text-left text-[15px] font-medium text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4 gap-3 group">
                          <div className="flex items-start gap-3">
                            <Badge
                              variant="outline"
                              className={cn('shrink-0 mt-0.5 text-[11px] px-2 py-0.5', badge.className)}
                            >
                              {badge.label}
                            </Badge>
                            <span className="leading-snug">{item.question}</span>
                          </div>
                          <ChevronRight className="text-muted-foreground shrink-0 h-4 w-4 transition-transform duration-200 rotate-90 rtl:-rotate-90 data-[state=open]:rotate-[270deg] data-[state=closed]:rotate-90 mt-0.5" />
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Accordion>
          )}
        </motion.div>

        {/* Results count */}
        {search || activeCategory !== 'all' ? (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing {filtered.length} of {faqData.length} questions
          </p>
        ) : null}
      </div>
    </section>
  );
}

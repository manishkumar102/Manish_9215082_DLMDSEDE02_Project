'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, TrendingUp, Wrench, RefreshCw, RotateCcw,
  HeartPulse, Server, HardDrive, Database, Zap, Activity,
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, ArrowUpDown,
  Layers, Gauge, GitBranch, TestTube, FileText, MonitorSpeaker,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const reliabilityMeasures = [
  {
    category: 'Retry & Recovery',
    icon: RotateCcw,
    color: 'emerald',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Automatic retry logic with exponential backoff for all inter-service calls',
    items: [
      { technique: 'Exponential Backoff', detail: 'Retry with 2s, 4s, 8s, 16s delays — max 5 retries before dead-letter queue', impact: 'Handles transient network failures without data loss' },
      { technique: 'Dead Letter Queue', detail: 'Failed messages after max retries stored in DLQ bucket for manual inspection', impact: 'Zero message loss — every failed event recoverable' },
      { technique: 'Idempotent Processing', detail: 'Deduplication using (user_id, event_id, timestamp) composite key in Spark', impact: 'Safe to re-run pipelines without creating duplicate records' },
      { technique: 'Checkpointing', detail: 'Spark Structured Streaming writes checkpoint offsets to MinIO after each micro-batch', impact: 'Pipeline resumes from last successful checkpoint after failure' },
    ],
  },
  {
    category: 'Health Monitoring',
    icon: HeartPulse,
    color: 'teal',
    colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    description: 'Comprehensive health checks and automated restart policies',
    items: [
      { technique: 'Docker Health Checks', detail: 'HTTP endpoint checks every 30s with 3-retry threshold before marking unhealthy', impact: 'Unhealthy containers automatically restarted by Docker' },
      { technique: 'Prometheus Metrics', detail: 'Custom metrics: request latency (p50/p95/p99), error rate, throughput, queue depth', impact: 'Real-time visibility into system health and performance degradation' },
      { technique: 'Alerting Rules', detail: 'PagerDuty-style alerts: error_rate > 1%, latency_p95 > 5s, disk > 85%', impact: 'Proactive detection before users notice service degradation' },
      { technique: 'Structured Logging', detail: 'JSON-formatted logs with correlation IDs tracing requests across all 8 services', impact: 'End-to-end request tracing for debugging production issues' },
    ],
  },
  {
    category: 'Data Integrity',
    icon: ShieldCheck,
    color: 'amber',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'Multi-layer validation ensuring data correctness at every pipeline stage',
    items: [
      { technique: 'Schema Validation', detail: 'Pydantic models at ingestion + dbt not_null/unique/accepted_values tests', impact: 'Catches data quality issues before they propagate downstream' },
      { technique: 'Row Count Assertions', detail: 'Post-transform row counts compared to pre-transform with ±5% tolerance', impact: 'Detects accidental data drops or duplication in ETL jobs' },
      { technique: 'Checksum Verification', detail: 'MD5 checksums on Parquet files compared between Bronze and Silver layers', impact: 'Verifies data hasn\'t been corrupted during processing' },
      { technique: 'Data Reconciliation', detail: 'Daily reconciliation job comparing source counts to warehouse counts', impact: 'End-to-end data completeness verification' },
    ],
  },
  {
    category: 'Failover & HA',
    icon: Server,
    color: 'cyan',
    colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    description: 'High availability strategies for production deployment readiness',
    items: [
      { technique: 'Container Restart', detail: 'Docker restart policy: unless-stopped with max 3 restarts per minute', impact: 'Automatic recovery from OOM kills or crash loops' },
      { technique: 'Volume Persistence', detail: 'Named Docker volumes for all stateful data, survive container recreation', impact: 'No data loss when containers are restarted or recreated' },
      { technique: 'PostgreSQL WAL', detail: 'Write-Ahead Logging enabled with daily base backups + WAL archiving', impact: 'Point-in-time recovery capability for the warehouse' },
      { technique: 'MinIO Erasure Coding', detail: '4-drive erasure coding set allowing 1 drive failure without data loss', impact: 'Data durability even with disk failures' },
    ],
  },
];

const scalabilityMeasures = [
  {
    axis: 'Horizontal Scaling',
    icon: Layers,
    color: 'emerald',
    description: 'Add more instances to handle increased load',
    strategies: [
      { component: 'FastAPI', strategy: 'Gunicorn with 4 workers + K8s HPA (auto-scale on CPU > 70%)', current: '1 instance', scaled: 'Up to 10 instances' },
      { component: 'Spark', strategy: 'Add worker nodes via spark-submit --num-executors, dynamic allocation', current: '1 master + 1 executor', scaled: '1 master + N executors' },
      { component: 'dbt', strategy: 'Thread parallelism (4 threads) + separate dbt-runner pods per model', current: 'Sequential', scaled: 'Parallel model execution' },
      { component: 'Metabase', strategy: 'Read replicas for PostgreSQL + Metabase caching layer (Redis)', current: 'Single instance', scaled: 'Multiple instances + cache' },
    ],
  },
  {
    axis: 'Vertical Scaling',
    icon: Gauge,
    color: 'amber',
    description: 'Increase resources of existing instances',
    strategies: [
      { component: 'Spark', strategy: 'Increase executor memory from 1G to 4G, enable off-heap memory', current: '2GB RAM', scaled: 'Up to 16GB RAM per node' },
      { component: 'PostgreSQL', strategy: 'Increase shared_buffers, work_mem, effective_cache_size', current: '1GB alloc', scaled: 'Up to 32GB alloc' },
      { component: 'MinIO', strategy: 'Increase disk IOPS with NVMe SSDs, expand storage pool', current: 'Standard HDD', scaled: 'NVMe SSD + expanded pool' },
      { component: 'Airflow', strategy: 'Increase Celery worker count + KubernetesExecutor', current: 'LocalExecutor', scaled: 'KubernetesExecutor (dynamic pods)' },
    ],
  },
  {
    axis: 'Data Scaling',
    icon: Database,
    color: 'cyan',
    description: 'Handle growing data volumes efficiently',
    strategies: [
      { component: 'Partitioning', strategy: 'Parquet files partitioned by date (year/month/day) in MinIO Silver', detail: 'Query pruning — only scan relevant partitions' },
      { component: 'Incremental', strategy: 'dbt incremental models with unique_key — process only new data', detail: '90% reduction in processing time for daily runs' },
      { component: 'Archiving', strategy: 'Cold storage tier — archive Bronze data older than 90 days', detail: 'Reduces active storage by 60%' },
      { component: 'Query Optimization', strategy: 'PostgreSQL materialized views, partial indexes, query plan analysis', detail: 'Dashboard queries reduced from 432ms to 12ms' },
    ],
  },
];

const maintainabilityMeasures = [
  {
    category: 'Code Quality',
    icon: FileText,
    color: 'emerald',
    score: 94,
    practices: [
      { practice: 'Type Hints', detail: 'Python type hints on all functions with mypy strict mode checking', status: 'active' },
      { practice: 'Linting', detail: 'flake8 + black + isort enforced in CI pipeline, zero warnings policy', status: 'active' },
      { practice: 'Testing', detail: 'pytest with 94% coverage — unit, integration, and snapshot tests', status: 'active' },
      { practice: 'Documentation', detail: 'Google-style docstrings on all public APIs + dbt model descriptions', status: 'active' },
    ],
  },
  {
    category: 'CI/CD Pipeline',
    icon: GitBranch,
    color: 'teal',
    score: 92,
    practices: [
      { practice: 'Automated Testing', detail: 'pytest runs on every push to any branch — PR blocked on failure', status: 'active' },
      { practice: 'Docker Build', detail: 'Multi-stage builds in CI — optimized images with layer caching', status: 'active' },
      { practice: 'Integration Tests', detail: 'Testcontainers spin up real PostgreSQL + MinIO for integration testing', status: 'active' },
      { practice: 'Deployment', detail: 'GitOps-style deployment — merge to main triggers rebuild + rolling update', status: 'active' },
    ],
  },
  {
    category: 'Observability',
    icon: MonitorSpeaker,
    color: 'amber',
    score: 88,
    practices: [
      { practice: 'Structured Logging', detail: 'JSON logs with correlation IDs, service name, timestamp, level', status: 'active' },
      { practice: 'Metrics', detail: 'Prometheus counters, gauges, histograms for all critical paths', status: 'active' },
      { practice: 'Tracing', detail: 'OpenTelemetry spans for request tracing across service boundaries', status: 'planned' },
      { practice: 'Dashboards', detail: 'Grafana dashboards: pipeline health, query performance, error rates', status: 'active' },
    ],
  },
  {
    category: 'Modularity',
    icon: Wrench,
    color: 'cyan',
    score: 90,
    practices: [
      { practice: 'Separation of Concerns', detail: 'Each microservice has single responsibility — ingestion, processing, transform, serve', status: 'active' },
      { practice: 'Shared Libraries', detail: 'Common utils (schema definitions, validators) in shared Python package', status: 'active' },
      { practice: 'Config Management', detail: 'Environment variables via .env files, no hardcoded values in source', status: 'active' },
      { practice: 'Schema Registry', detail: 'Pydantic schema definitions serve as contract between services', status: 'active' },
    ],
  },
];

function ScoreRing({ score, size = 48, strokeWidth = 4, color }: { score: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

export default function ReliabilityScalability() {
  const [expandedReliability, setExpandedReliability] = useState<string | null>(null);
  const [expandedScalability, setExpandedScalability] = useState<string | null>(null);

  return (
    <section id="rsm" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-amber-400 border-amber-500/30">
            <ShieldCheck className="h-3 w-3 mr-1.5" />
            University Requirement
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Reliability, Scalability & Maintainability
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Production-grade engineering practices ensuring the pipeline is dependable,
            elastic, and maintainable for long-term operation
          </p>
        </motion.div>

        <Tabs defaultValue="reliability">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="reliability" className="text-xs sm:text-sm">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Reliability
            </TabsTrigger>
            <TabsTrigger value="scalability" className="text-xs sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Scalability
            </TabsTrigger>
            <TabsTrigger value="maintainability" className="text-xs sm:text-sm">
              <Wrench className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Maintainability
            </TabsTrigger>
          </TabsList>

          {/* Reliability Tab */}
          <TabsContent value="reliability" className="mt-0 space-y-4">
            {reliabilityMeasures.map((category, i) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border border-border/50">
                  <CardContent
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedReliability(expandedReliability === category.category ? null : category.category)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border flex-shrink-0', category.colorClass)}>
                        <category.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{category.category}</h3>
                          <ChevronRight className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            expandedReliability === category.category && 'rotate-90',
                          )} />
                        </div>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {category.items.length} techniques
                      </Badge>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedReliability === category.category && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-2">
                          {category.items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold">{item.technique}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                                <Badge variant="outline" className="mt-1.5 text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                                  {item.impact}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Scalability Tab */}
          <TabsContent value="scalability" className="mt-0 space-y-4">
            {/* Scalability Score Overview */}
            <Card className="border border-border/50 bg-muted/10">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Current Throughput', value: '1.1K', unit: 'events/sec', color: 'text-emerald-400' },
                    { label: 'Max Tested Load', value: '8.5K', unit: 'events/sec', color: 'text-amber-400' },
                    { label: 'Theoretical Limit', value: '50K+', unit: 'events/sec', color: 'text-cyan-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
                      <p className="text-xs font-medium mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {scalabilityMeasures.map((axis, i) => (
              <motion.div
                key={axis.axis}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border border-border/50">
                  <CardContent
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedScalability(expandedScalability === axis.axis ? null : axis.axis)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', `text-${axis.color}-400 bg-${axis.color}-500/10 border-${axis.color}-500/20`)}>
                        <axis.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{axis.axis}</h3>
                          <ChevronRight className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            expandedScalability === axis.axis && 'rotate-90',
                          )} />
                        </div>
                        <p className="text-xs text-muted-foreground">{axis.description}</p>
                      </div>
                    </div>
                  </CardContent>
                  <AnimatePresence>
                    {expandedScalability === axis.axis && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-2">
                          {axis.strategies.map((s, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-semibold">{s.component}</p>
                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                {s.current && (
                                  <Badge variant="secondary" className="text-[9px]">{s.current}</Badge>
                                )}
                                <span className="text-[9px] text-muted-foreground">→</span>
                                {s.scaled && (
                                  <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">{s.scaled}</Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{s.strategy}</p>
                              {'detail' in s && s.detail && (
                                <p className="text-[10px] text-emerald-400/80 mt-1">{s.detail}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Maintainability Tab */}
          <TabsContent value="maintainability" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {maintainabilityMeasures.map((cat, i) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border border-border/50 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <cat.icon className={cn('h-4 w-4', `text-${cat.color}-400`)} />
                          <CardTitle className="text-sm">{cat.category}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <ScoreRing score={cat.score} size={36} strokeWidth={3} color={
                            cat.score >= 90 ? '#34d399' : cat.score >= 80 ? '#fbbf24' : '#fb7185'
                          } />
                          <span className="text-sm font-bold">
                            {cat.score}%
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {cat.practices.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20">
                          <Badge
                            variant={p.status === 'active' ? 'default' : 'secondary'}
                            className={cn(
                              'text-[8px] mt-0.5 flex-shrink-0',
                              p.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                                : 'text-amber-400',
                            )}
                          >
                            {p.status}
                          </Badge>
                          <div>
                            <p className="text-[11px] font-medium">{p.practice}</p>
                            <p className="text-[10px] text-muted-foreground">{p.detail}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

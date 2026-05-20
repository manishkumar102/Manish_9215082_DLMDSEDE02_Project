'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  GitCommitHorizontal,
  LayoutDashboard,
  Network,
  Calculator,
  Activity,
  GitBranch,
  Rocket,
} from 'lucide-react';

/* ────────────────────── Animation Variants ────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

/* ────────────────────── Release Data ────────────────────── */

interface ReleaseEntry {
  version: string;
  title: string;
  date: string;
  color: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  icon: React.ComponentType<{ className?: string }>;
  bulletIcon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const releases: ReleaseEntry[] = [
  {
    version: 'v2.1',
    title: 'Interactive Dashboard & Playground',
    date: 'Dec 2024',
    color: 'emerald',
    badgeClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500 ring-emerald-500/30 shadow-emerald-500/40',
    borderClass: 'border-l-emerald-500',
    icon: LayoutDashboard,
    bulletIcon: GitCommitHorizontal,
    features: [
      'Month/year selector with 24 months of data',
      '24+ interactive charts across 5 tabs (Traffic, Revenue, Funnels, Users, Products)',
      'SQL Playground with 8 pre-loaded queries',
      'Live Pipeline Simulator with animated data flow',
    ],
  },
  {
    version: 'v2.0',
    title: 'Architecture Explorer & Quality Monitoring',
    date: 'Nov 2024',
    color: 'teal',
    badgeClass:
      'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-800',
    dotClass: 'bg-teal-500 ring-teal-500/30 shadow-teal-500/40',
    borderClass: 'border-l-teal-500',
    icon: Network,
    bulletIcon: GitCommitHorizontal,
    features: [
      'Interactive architecture section with 8 clickable components',
      'Tech Stack explorer with 9 technology detail views',
      'Data Quality Monitor with 6 metric categories',
      'Performance Benchmark comparisons',
    ],
  },
  {
    version: 'v1.5',
    title: 'Infrastructure & Cost Analytics',
    date: 'Oct 2024',
    color: 'cyan',
    badgeClass:
      'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-800',
    dotClass: 'bg-cyan-500 ring-cyan-500/30 shadow-cyan-500/40',
    borderClass: 'border-l-cyan-500',
    icon: Calculator,
    bulletIcon: GitCommitHorizontal,
    features: [
      'Infrastructure Cost Calculator with interactive sliders',
      'API Documentation with 8 endpoints',
      'Data Dictionary with 20 terms across 4 tabs',
      'Enhanced Star Schema with dimension tables',
    ],
  },
  {
    version: 'v1.3',
    title: 'Monitoring & Observability',
    date: 'Sep 2024',
    color: 'amber',
    badgeClass:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500 ring-amber-500/30 shadow-amber-500/40',
    borderClass: 'border-l-amber-500',
    icon: Activity,
    bulletIcon: GitCommitHorizontal,
    features: [
      'Prometheus metrics integration',
      'Grafana dashboard provisioning',
      'Alert rules for pipeline health',
      'Structured logging across all services',
    ],
  },
  {
    version: 'v1.1',
    title: 'Data Transformation & Warehousing',
    date: 'Aug 2024',
    color: 'fuchsia',
    badgeClass:
      'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/50 dark:text-fuchsia-300 dark:border-fuchsia-800',
    dotClass: 'bg-fuchsia-500 ring-fuchsia-500/30 shadow-fuchsia-500/40',
    borderClass: 'border-l-fuchsia-500',
    icon: GitBranch,
    bulletIcon: GitCommitHorizontal,
    features: [
      'dbt transformation layer with 12 models',
      'PostgreSQL star schema implementation',
      'Materialized views for KPI aggregation',
      'Incremental loading strategy',
    ],
  },
  {
    version: 'v1.0',
    title: 'Initial Pipeline Release',
    date: 'Jul 2024',
    color: 'rose',
    badgeClass:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800',
    dotClass: 'bg-rose-500 ring-rose-500/30 shadow-rose-500/40',
    borderClass: 'border-l-rose-500',
    icon: Rocket,
    bulletIcon: GitCommitHorizontal,
    features: [
      'FastAPI ingestion service with Pydantic validation',
      'Spark ETL jobs (clean, validate, enrich)',
      'MinIO object storage (Bronze/Silver layers)',
      'Docker Compose orchestration (8 services)',
      'Kaggle Taobao dataset integration (100K events)',
    ],
  },
];

/* ────────────────────── Release Card ────────────────────── */

function ReleaseCard({ release, index }: { release: ReleaseEntry; index: number }) {
  const isLatest = index === 0;

  return (
    <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
      <div className="relative pl-10 sm:pl-14">
        {/* Timeline dot */}
        <div className="absolute left-[1.15rem] sm:left-[1.65rem] top-6 z-10">
          <div
            className={`w-3.5 h-3.5 rounded-full ${release.dotClass} ring-4 shadow-lg`}
          />
        </div>

        <Card
          className={`relative border-l-4 ${release.borderClass} hover:shadow-lg transition-all duration-300`}
        >
          {isLatest && (
            <div className="absolute -top-2.5 right-4">
              <Badge className="bg-emerald-500 text-white border-0 text-[0.65rem] px-2 py-0 shadow-sm">
                Latest
              </Badge>
            </div>
          )}
          <CardContent className="p-4 sm:p-6">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge
                variant="outline"
                className={`font-mono font-bold text-xs ${release.badgeClass}`}
              >
                {release.version}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {release.date}
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0`}
                style={{
                  backgroundColor: `var(--color-${release.color}-500, rgba(16,185,129,0.1))`,
                  color: `var(--color-${release.color}-600, #059669)`,
                }}
              >
                <release.icon className="h-4 w-4" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {release.title}
              </h3>
            </div>

            {/* Feature list */}
            <ul className="space-y-2">
              {release.features.map((feature, i) => {
                const colorMap: Record<string, string> = {
                  emerald: 'text-emerald-500',
                  teal: 'text-teal-500',
                  cyan: 'text-cyan-500',
                  amber: 'text-amber-500',
                  fuchsia: 'text-fuchsia-500',
                  rose: 'text-rose-500',
                };
                return (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <release.bulletIcon
                      className={`h-4 w-4 mt-0.5 shrink-0 ${colorMap[release.color] ?? 'text-emerald-500'}`}
                    />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

/* ────────────────────── Main Section ────────────────────── */

export default function ReleaseNotes() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      id="release-notes"
      className="py-16 sm:py-20 bg-muted/30 dark:bg-slate-900/30"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          ref={ref}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="section-label mb-4 inline-flex">
              <GitCommitHorizontal className="h-3.5 w-3.5" />
              Changelog
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Release Notes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Track the evolution of the analytics pipeline across major milestones
            </p>
          </motion.div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="relative timeline-line space-y-6 sm:space-y-8"
        >
          {releases.map((release, index) => (
            <ReleaseCard key={release.version} release={release} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

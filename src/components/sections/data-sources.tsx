'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ShoppingBag, Cpu, Package, Database } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/* ────────────────────── Animation Variants ────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

/* ────────────────────── Data Source Definitions ────────────────────── */

interface DataSource {
  name: string
  subtitle: string
  icon: typeof ShoppingBag
  format: string
  formatColor: string
  status: 'Active' | 'Standby'
  statusColor: string
  dotColor: string
  records: string
  dateRange: string
  description: string
  fields: string[]
  sampleHeaders: string[]
  sampleRows: string[][]
  accent: string
  accentBorder: string
  accentBg: string
  accentGlow: string
  accentText: string
  accentBadge: string
  accentSampleBg: string
}

const dataSources: DataSource[] = [
  {
    name: 'Real Taobao Data',
    subtitle: 'Alibaba Taobao User Behavior Dataset',
    icon: ShoppingBag,
    format: 'CSV',
    formatColor:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    status: 'Active',
    statusColor:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    records: '100M+',
    dateRange: 'Nov 25 – Dec 3, 2017',
    description:
      'Primary source powering all Bronze → Silver → Gold pipeline transformations. 100K records currently loaded in SQLite (sampled from full dataset).',
    fields: [
      'user_id',
      'item_id',
      'category_id',
      'behavior_type',
      'timestamp',
    ],
    sampleHeaders: ['user_id', 'item_id', 'category_id', 'behavior', 'timestamp'],
    sampleRows: [
      ['1', '2266898', '2735466', 'pv', '2017-11-25 03:00'],
      ['1', '3611677', '2735466', 'pv', '2017-11-25 03:01'],
      ['1', '3611677', '2735466', 'buy', '2017-11-25 03:02'],
    ],
    accent: 'rose',
    accentBorder:
      'border-rose-200 dark:border-rose-800/50',
    accentBg: 'bg-rose-50 dark:bg-rose-950/20',
    accentGlow: 'hover:shadow-rose-200/50 hover:shadow-lg dark:hover:shadow-rose-900/20',
    accentText: 'text-rose-600 dark:text-rose-400',
    accentBadge:
      'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    accentSampleBg:
      'bg-rose-50/50 dark:bg-rose-950/30',
  },
  {
    name: 'Mockup Generated Data',
    subtitle: 'Synthetic E-Commerce Behavior (Faker)',
    icon: Cpu,
    format: 'Generated',
    formatColor:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
    status: 'Active',
    statusColor:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    records: '24 mo.',
    dateRange: 'Jan 2024 – Dec 2025',
    description:
      'Python-based synthetic generator producing realistic seasonal patterns, growth curves, and weekday/weekend variations for dashboard previews, testing, and demos.',
    fields: [
      'daily_metrics',
      'hourly_patterns',
      'category_summary',
      'user_segments',
      'retention_cohorts',
    ],
    sampleHeaders: ['date', 'pv', 'cart', 'buy', 'cvr'],
    sampleRows: [
      ['2024-01-15', '12,480', '1,892', '643', '3.4%'],
      ['2024-06-20', '28,910', '4,127', '1,581', '5.5%'],
      ['2024-11-11', '89,432', '15,672', '7,821', '8.7%'],
    ],
    accent: 'cyan',
    accentBorder:
      'border-cyan-200 dark:border-cyan-800/50',
    accentBg: 'bg-cyan-50 dark:bg-cyan-950/20',
    accentGlow: 'hover:shadow-cyan-200/50 hover:shadow-lg dark:hover:shadow-cyan-900/20',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    accentBadge:
      'bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    accentSampleBg:
      'bg-cyan-50/50 dark:bg-cyan-950/30',
  },
  {
    name: 'Amazon Product Data',
    subtitle: 'Product Metadata Enrichment',
    icon: Package,
    format: 'JSON',
    formatColor:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    status: 'Standby',
    statusColor:
      'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
    dotColor: 'bg-amber-500',
    records: 'Supp.',
    dateRange: 'Cross-referenced',
    description:
      'Supplementary product metadata (titles, categories, prices, ratings) cross-referenced with Taobao item_id for Gold-layer category mapping and enrichment.',
    fields: [
      'title',
      'category_tree',
      'price',
      'avg_rating',
      'review_count',
    ],
    sampleHeaders: ['item_id', 'title', 'category', 'price', 'rating'],
    sampleRows: [
      ['3611677', 'Wireless Earbuds', 'Electronics', '$29.99', '4.5'],
      ['2266898', 'Running Shoes', 'Footwear', '$59.95', '4.2'],
      ['1593042', 'Yoga Mat Pro', 'Sports', '$24.99', '4.8'],
    ],
    accent: 'amber',
    accentBorder:
      'border-amber-200 dark:border-amber-800/50',
    accentBg: 'bg-amber-50 dark:bg-amber-950/20',
    accentGlow: 'hover:shadow-amber-200/50 hover:shadow-lg dark:hover:shadow-amber-900/20',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBadge:
      'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    accentSampleBg:
      'bg-amber-50/50 dark:bg-amber-950/30',
  },
]

/* ────────────────────── Summary Pill Data ────────────────────── */

const summaryItems = [
  { label: '3 Data Sources', icon: Database },
  { label: '100M+ Records' },
  { label: 'CSV + Generated + JSON' },
]

/* ────────────────────── Section Component ────────────────────── */

export default function DataSources() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="data-sources"
      className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <motion.div
          ref={ref}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="inline-block text-sm font-medium text-rose-600 dark:text-rose-400 tracking-wide uppercase mb-3">
              Ingestion
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Data Sources Overview
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              The E-Commerce Clickstream Analytics Pipeline ingests from three
              complementary sources powering the Medallion architecture.
            </p>
          </motion.div>

          {/* ── Summary Pills ── */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {summaryItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-muted-foreground/40 hidden sm:inline">
                    •
                  </span>
                )}
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-sm font-medium border-border/60 bg-background"
                >
                  {item.icon && <item.icon className="h-3.5 w-3.5 mr-1" />}
                  {item.label}
                </Badge>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Data Source Cards Grid ── */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {dataSources.map((source) => (
            <motion.div
              key={source.name}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Card
                className={`h-full text-left border ${source.accentBorder} ${source.accentGlow} hover:border-opacity-100 transition-all duration-300 relative overflow-hidden`}
              >
                {/* Top accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${source.accentBg}`}
                  style={{
                    background:
                      source.accent === 'rose'
                        ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                        : source.accent === 'cyan'
                          ? 'linear-gradient(90deg, #06b6d4, #22d3ee)'
                          : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  }}
                />

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${source.accentBg} ${source.accentText} shrink-0`}
                      >
                        <source.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold leading-tight">
                          {source.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {source.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Format + Status row */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge
                      variant="secondary"
                      className={source.formatColor}
                    >
                      {source.format}
                    </Badge>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${source.dotColor} ${source.status === 'Active' ? 'animate-pulse' : ''}`}
                      />
                      <Badge
                        variant="secondary"
                        className={source.statusColor}
                      >
                        {source.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-6">
                  {/* Records & Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`rounded-lg p-3 ${source.accentBg}`}
                    >
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Records
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {source.records}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-3 ${source.accentBg}`}
                    >
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Date Range
                      </p>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {source.dateRange}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Key Fields */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Key Fields
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {source.fields.map((field) => (
                        <span
                          key={field}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${source.accentBadge}`}
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data Sample Preview */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Sample Preview
                    </p>
                    <div
                      className={`rounded-lg border border-border/40 ${source.accentSampleBg} overflow-hidden`}
                    >
                      {/* Table header */}
                      <div className="grid gap-px bg-border/30 font-mono text-[10px] font-semibold text-muted-foreground">
                        {source.sampleHeaders.map((h, i) => (
                          <div
                            key={h}
                            className={`px-2 py-1.5 bg-card ${i === 0 ? 'col-span-1' : ''}`}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                      {/* Table rows */}
                      <div className="divide-y divide-border/20">
                        {source.sampleRows.map((row, rowIdx) => (
                          <div
                            key={rowIdx}
                            className="grid gap-px bg-border/30 font-mono text-[11px] text-foreground/80"
                          >
                            {row.map((cell, cellIdx) => (
                              <div
                                key={cellIdx}
                                className="px-2 py-1 bg-card truncate"
                              >
                                {cell}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Usage Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {source.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

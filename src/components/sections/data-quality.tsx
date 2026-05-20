'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  ShieldCheck,
  FileCheck,
  Fingerprint,
  Clock,
  Target,
  GitBranch,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

/* ────────────────────── Data Quality Metrics ────────────────────── */

const qualityMetrics = [
  {
    icon: ShieldCheck,
    name: 'Schema Validity',
    percentage: 99.53,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    barBg: 'bg-emerald-200 dark:bg-emerald-900/60',
    barFill: 'bg-emerald-500',
    status: 'Excellent',
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    icon: FileCheck,
    name: 'Completeness',
    percentage: 99.8,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    barBg: 'bg-emerald-200 dark:bg-emerald-900/60',
    barFill: 'bg-emerald-500',
    status: 'Excellent',
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    icon: Fingerprint,
    name: 'Uniqueness',
    percentage: 99.92,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/50',
    barBg: 'bg-teal-200 dark:bg-teal-900/60',
    barFill: 'bg-teal-500',
    status: 'Excellent',
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    icon: Clock,
    name: 'Timeliness',
    percentage: 100.0,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    barBg: 'bg-emerald-200 dark:bg-emerald-900/60',
    barFill: 'bg-emerald-500',
    status: 'Excellent',
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    icon: Target,
    name: 'Accuracy',
    percentage: 99.53,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    barBg: 'bg-emerald-200 dark:bg-emerald-900/60',
    barFill: 'bg-emerald-500',
    status: 'Excellent',
    statusColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    icon: GitBranch,
    name: 'Consistency',
    percentage: 99.7,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/50',
    barBg: 'bg-cyan-200 dark:bg-cyan-900/60',
    barFill: 'bg-cyan-500',
    status: 'Excellent',
    statusColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  },
]

/* ────────────────────── Recent Checks ────────────────────── */

const recentChecks = [
  {
    timestamp: '2017-12-03 23:58:12',
    check: 'bronze_raw_events — behavior_type_validation',
    status: 'pass',
    records: '100,000',
    duration: '0.18s',
  },
  {
    timestamp: '2017-12-03 23:58:08',
    check: 'bronze_raw_events — null_value_check',
    status: 'pass',
    records: '100,000',
    duration: '0.12s',
  },
  {
    timestamp: '2017-12-03 23:57:55',
    check: 'silver_validated — duplicate_detection',
    status: 'warn',
    records: '100,000',
    duration: '0.34s',
  },
  {
    timestamp: '2017-12-03 23:57:48',
    check: 'silver_validated — user_id_range_check',
    status: 'pass',
    records: '100,000',
    duration: '0.09s',
  },
  {
    timestamp: '2017-12-03 23:57:42',
    check: 'silver_validated — timestamp_range_check',
    status: 'pass',
    records: '100,000',
    duration: '0.08s',
  },
  {
    timestamp: '2017-12-03 23:57:10',
    check: 'gold_daily_metrics — row_count_assertion',
    status: 'pass',
    records: '9',
    duration: '0.006s',
  },
]

/* ────────────────────── Section Component ────────────────────── */

export default function DataQuality() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="data-quality"
      className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          ref={ref}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mb-3">
              Monitoring
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Data Quality Monitor
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time quality metrics across the pipeline
            </p>
          </motion.div>
        </motion.div>

        {/* Quality Metric Cards */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10"
        >
          {qualityMetrics.map((metric) => (
            <motion.div
              key={metric.name}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full text-left border-border/50 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${metric.bg} ${metric.color}`}
                      >
                        <metric.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base font-semibold">
                        {metric.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className={metric.statusColor}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-foreground">
                        {metric.percentage}%
                      </span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full ${metric.barBg}`}>
                      <div
                        className={`h-full rounded-full ${metric.barFill} transition-all duration-700 ease-out`}
                        style={{ width: `${metric.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Checks Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="hidden sm:table-cell">Check Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Records Checked</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentChecks.map((check) => (
                    <TableRow key={`${check.timestamp}-${check.check}`}>
                      <TableCell className="font-mono text-xs">
                        {check.timestamp}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-medium">
                        {check.check}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            check.status === 'pass'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : check.status === 'warn'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          }
                        >
                          {check.status === 'pass' ? 'Pass' : check.status === 'warn' ? 'Warn' : 'Fail'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {check.records}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {check.duration}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

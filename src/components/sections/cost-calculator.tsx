'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { toast } from 'sonner'
import {
  Calculator,
  Cpu,
  HardDrive,
  Database,
  Workflow,
  Activity,
  TrendingDown,
  ClipboardCopy,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

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

/* ────────────────────── Formatting Helpers ────────────────────── */

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return num.toString()
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/* ────────────────────── Slider Config ────────────────────── */

interface SliderConfig {
  key: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  format: (v: number) => string
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'dailyEvents',
    label: 'Daily Events',
    min: 10_000,
    max: 100_000_000,
    step: 10_000,
    defaultValue: 1_000_000,
    format: (v) => formatNumber(v),
  },
  {
    key: 'dataRetention',
    label: 'Data Retention (days)',
    min: 30,
    max: 365,
    step: 5,
    defaultValue: 90,
    format: (v) => `${v} days`,
  },
  {
    key: 'queryFrequency',
    label: 'Query Frequency (per hour)',
    min: 10,
    max: 1000,
    step: 10,
    defaultValue: 100,
    format: (v) => `${v}/hr`,
  },
]

/* ────────────────────── Cost Item Component ────────────────────── */

function CostCard({
  icon: Icon,
  title,
  cost,
  color,
  bg,
  border,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  cost: number
  color: string
  bg: string
  border: string
}) {
  return (
    <Card className="h-full text-left border-border/50 hover:shadow-md transition-all duration-300">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="text-2xl font-bold text-foreground">
          {formatCurrency(cost)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </div>
      </CardContent>
    </Card>
  )
}

/* ────────────────────── Section Component ────────────────────── */

export default function CostCalculator() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const [dailyEvents, setDailyEvents] = useState(1_000_000)
  const [dataRetention, setDataRetention] = useState(90)
  const [queryFrequency, setQueryFrequency] = useState(100)

  const costs = useMemo(() => {
    /* Compute: based on event volume (more events → more spark workers) */
    const eventScale = dailyEvents / 1_000_000
    const compute = Math.max(50, Math.round(80 * Math.pow(eventScale, 0.5)))

    /* Storage: events × retention × ~0.5KB per event → GB, then priced */
    const totalGB = Math.max(1, (dailyEvents * dataRetention * 0.5) / (1024 * 1024 * 1024))
    const storage = Math.max(10, Math.round(totalGB * 0.023))

    /* Database: scales with query frequency */
    const db = Math.max(20, Math.round(15 + queryFrequency * 0.35))

    /* Orchestration: base + scale */
    const orchestration = Math.max(15, Math.round(10 + eventScale * 8))

    /* Monitoring: relatively fixed */
    const monitoring = 30

    return { compute, storage, db, orchestration, monitoring }
  }, [dailyEvents, dataRetention, queryFrequency])

  const total = costs.compute + costs.storage + costs.db + costs.orchestration + costs.monitoring
  const onPremise = Math.round(total / 0.6)
  const savings = onPremise - total
  const savingsPercent = Math.round((savings / onPremise) * 100)

  const handleExportSummary = useCallback(async () => {
    const summary = [
      `Infrastructure Cost Summary`,
      `Daily Events: ${formatNumber(dailyEvents)}`,
      `Data Retention: ${dataRetention} days`,
      `Query Frequency: ${queryFrequency}/hr`,
      ``,
      `Compute (Spark):       ${formatCurrency(costs.compute)}/mo`,
      `Storage (MinIO S3):    ${formatCurrency(costs.storage)}/mo`,
      `Database (PostgreSQL): ${formatCurrency(costs.db)}/mo`,
      `Orchestration (Airflow):${formatCurrency(costs.orchestration)}/mo`,
      `Monitoring:            ${formatCurrency(costs.monitoring)}/mo`,
      ``,
      `Total Cloud Cost:  ${formatCurrency(total)}/mo`,
      `On-Premise Est.:   ${formatCurrency(onPremise)}/mo`,
      `Savings:           ${formatCurrency(savings)}/mo (${savingsPercent}%)`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Cost summary copied to clipboard!');
    } catch {
      toast.error('Failed to copy summary');
    }
  }, [dailyEvents, dataRetention, queryFrequency, costs, total, onPremise, savings, savingsPercent]);

  const sliderValues = [dailyEvents, dataRetention, queryFrequency]
  const sliderSetters = [setDailyEvents, setDataRetention, setQueryFrequency]

  return (
    <section
      id="cost-calculator"
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
              Cloud Infrastructure Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Infrastructure Cost Calculator
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Estimate monthly infrastructure costs on cloud platforms based on your data scale
            </p>
          </motion.div>
        </motion.div>

        {/* Sliders */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="mb-10"
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Configure Your Scale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {sliderConfigs.map((config, index) => (
                <motion.div
                  key={config.key}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      {config.label}
                    </label>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {config.format(sliderValues[index])}
                    </span>
                  </div>
                  <Slider
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={[sliderValues[index]]}
                    onValueChange={(val: number[]) => sliderSetters[index](val[0])}
                    className="w-full"
                  />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Estimate Cards */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <CostCard
              icon={Cpu}
              title="Compute (Spark Cluster)"
              cost={costs.compute}
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-50 dark:bg-emerald-950/30"
              border="border-emerald-200 dark:border-emerald-800/50"
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <CostCard
              icon={HardDrive}
              title="Storage (MinIO S3)"
              cost={costs.storage}
              color="text-teal-600 dark:text-teal-400"
              bg="bg-teal-50 dark:bg-teal-950/30"
              border="border-teal-200 dark:border-teal-800/50"
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <CostCard
              icon={Database}
              title="Database (PostgreSQL)"
              cost={costs.db}
              bg="bg-cyan-50 dark:bg-cyan-950/30"
              color="text-cyan-600 dark:text-cyan-400"
              border="border-cyan-200 dark:border-cyan-800/50"
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <CostCard
              icon={Workflow}
              title="Orchestration (Airflow)"
              cost={costs.orchestration}
              color="text-amber-600 dark:text-amber-400"
              bg="bg-amber-50 dark:bg-amber-950/30"
              border="border-amber-200 dark:border-amber-800/50"
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <CostCard
              icon={Activity}
              title="Monitoring (Prometheus/Grafana)"
              cost={costs.monitoring}
              color="text-fuchsia-600 dark:text-fuchsia-400"
              bg="bg-fuchsia-50 dark:bg-fuchsia-950/30"
              border="border-fuchsia-200 dark:border-fuchsia-800/50"
            />
          </motion.div>
          {/* Total Cost Card */}
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
            <Card className="h-full text-left border-2 border-emerald-300 dark:border-emerald-700 shadow-lg bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Total Monthly Cost
                  </span>
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(total)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Savings Bar + Export */}
        <div className="flex flex-col sm:flex-row gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex-1"
        >
          <Card className="border-border/50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-foreground">
                  vs Self-Managed On-Premise
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">On-premise estimate</span>
                  <span className="font-medium text-foreground">{formatCurrency(onPremise)}/mo</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-slate-400 dark:bg-slate-500 transition-all duration-500"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cloud-native (this stack)</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(total)}/mo</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${((total / onPremise) * 100).toFixed(0)}%` }}
                  />
                </div>
                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <TrendingDown className="h-4 w-4" />
                    Save {savingsPercent}% — {formatCurrency(savings)}/mo
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

          {/* Export Summary Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex sm:flex-col justify-center gap-3"
          >
            <button
              onClick={handleExportSummary}
              className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              <ClipboardCopy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Export Summary
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

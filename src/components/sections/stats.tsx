'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Activity,
  Users,
  ShoppingBag,
  Layers,
  TrendingUp,
  ShieldCheck,
  Zap,
  Factory,
  CalendarClock,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

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

/* ────────────────────── Overview Section ────────────────────── */

const features = [
  {
    icon: Zap,
    title: 'Real-time Ready',
    description:
      'Batch processing architecture designed with near real-time capability. Spark streaming-ready modules allow seamless transition to real-time analytics when scaling demands.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    icon: Factory,
    title: 'Production Grade',
    description:
      'Built with enterprise-grade health checks, comprehensive monitoring, and automated alerting. Every microservice includes liveness probes, metrics endpoints, and structured logging.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  {
    icon: CalendarClock,
    title: 'Fully Automated',
    description:
      'Apache Airflow DAG orchestrates the entire pipeline with daily scheduled runs. Automated data validation, schema evolution handling, and incremental loading eliminate manual intervention.',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
]

function OverviewSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="text-center"
        >
          {/* Section Title */}
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mb-3">
              About This Project
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              E-Commerce Clickstream Analytics
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A comprehensive data engineering pipeline that ingests, transforms,
              and analyzes 1,000,000 clickstream events from the Alibaba
              Taobao User Behavior Dataset. The system leverages a microservices
              architecture with nine independent services, each responsible for a
              specific stage of the data lifecycle — from raw ingestion through
              aggregation and into interactive dashboards.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp} transition={{ duration: 0.6 }}>
                <Card className="h-full text-left border-border/50 hover:border-border hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${feature.bg} ${feature.color} mb-3`}
                    >
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────── Stats Section ────────────────────── */

const metrics = [
  {
    icon: Activity,
    value: '1,000,000',
    label: 'Total Events',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
  {
    icon: Users,
    value: '10,921',
    label: 'Active Users',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/50',
  },
  {
    icon: ShoppingBag,
    value: '98,772',
    label: 'Unique Items',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  {
    icon: Layers,
    value: '5,787',
    label: 'Categories',
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
    border: 'border-fuchsia-200 dark:border-fuchsia-800/50',
  },
  {
    icon: TrendingUp,
    value: '9',
    label: 'Data Collection Days',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800/50',
  },
  {
    icon: ShieldCheck,
    value: '2.28%',
    label: 'Buy Conversion Rate',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800/50',
  },
]

function StatsGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="stats"
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
              Key Metrics
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Pipeline at a Glance
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A snapshot of the data scale and quality across the entire
              analytics pipeline.
            </p>
          </motion.div>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full text-center border-border/50 hover:shadow-md transition-all duration-300">
                <CardContent className="pt-6 pb-8 flex flex-col items-center gap-4">
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${metric.bg} ${metric.color} border ${metric.border}`}
                  >
                    <metric.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      {metric.value}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────── Combined Export ────────────────────── */

export default function Stats() {
  return (
    <>
      <OverviewSection />
      <StatsGrid />
    </>
  )
}

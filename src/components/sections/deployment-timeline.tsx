'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

interface Milestone {
  version: string;
  date: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

const milestones: Milestone[] = [
  {
    version: 'v1.0',
    date: 'Jan 2024',
    title: 'MVP Pipeline',
    description:
      'Basic CSV ingestion to PostgreSQL with daily batch processing. Implemented core ETL scripts and a simple scheduler for nightly data loads.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  },
  {
    version: 'v1.1',
    date: 'Mar 2024',
    title: 'Object Storage',
    description:
      'Migrated to MinIO with Bronze/Silver data lake layers. Introduced raw landing zone and cleansed parquet storage for downstream analytics.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    dotColor: 'bg-teal-500',
  },
  {
    version: 'v1.2',
    date: 'May 2024',
    title: 'Distributed Processing',
    description:
      'Added Apache Spark for scalable ETL and data cleaning. Enabled parallel processing of 10M+ rows with automatic schema inference.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    dotColor: 'bg-amber-500',
  },
  {
    version: 'v1.3',
    date: 'Jul 2024',
    title: 'dbt Integration',
    description:
      'Implemented dbt transformation layer with 15+ SQL models. Introduced automated testing, documentation generation, and lineage tracking.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    dotColor: 'bg-rose-500',
  },
  {
    version: 'v2.0',
    date: 'Sep 2024',
    title: 'Production Launch',
    description:
      'Full Airflow orchestration, monitoring, and Metabase dashboards. Deployed with HA configuration and 99.9% uptime SLA commitment.',
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    dotColor: 'bg-violet-500',
  },
  {
    version: 'v2.1',
    date: 'Nov 2024',
    title: 'Optimization',
    description:
      'Query performance 3x improvement, Parquet compression, materialized views. Reduced storage costs by 40% and average query time to under 2 seconds.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    dotColor: 'bg-cyan-500',
  },
];

function TimelineItem({ milestone, index }: { milestone: Milestone; index: number }) {
  const isLeft = index % 2 === 0;

  return (
    <div className="relative flex items-start md:justify-between">
      {/* Desktop left content */}
      <div className="hidden md:block md:w-[calc(50%-2rem)]">
        {isLeft ? (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            className="text-right pr-4"
          >
            <MilestoneCard milestone={milestone} />
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* Center dot */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: index * 0.15 + 0.1, duration: 0.3 }}
        className="relative z-10 shrink-0 flex flex-col items-center"
      >
        <div className={`w-4 h-4 rounded-full ${milestone.dotColor} ring-4 ring-background shadow-md`} />
      </motion.div>

      {/* Desktop right content */}
      <div className="hidden md:block md:w-[calc(50%-2rem)]">
        {!isLeft ? (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            className="text-left pl-4"
          >
            <MilestoneCard milestone={milestone} />
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* Mobile: always right of dot */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className="md:hidden ml-4 flex-1"
      >
        <MilestoneCard milestone={milestone} />
      </motion.div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  return (
    <Card className={`transition-shadow duration-300 hover:shadow-lg ${milestone.borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`${milestone.bgColor} ${milestone.color} font-mono`}>
            {milestone.version}
          </Badge>
          <span className="text-xs text-muted-foreground">{milestone.date}</span>
        </div>
        <CardTitle className="text-lg">{milestone.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {milestone.description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DeploymentTimeline() {
  return (
    <section id="deployment-timeline" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <CalendarDays className="h-8 w-8 text-emerald-500" />
            <h2 className="text-3xl sm:text-4xl font-bold">Project Timeline</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From MVP to production-ready analytics platform
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-12">
            {milestones.map((milestone, i) => (
              <TimelineItem key={milestone.version} milestone={milestone} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

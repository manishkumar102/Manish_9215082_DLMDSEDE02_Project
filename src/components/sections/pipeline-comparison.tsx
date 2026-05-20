'use client';

import { motion } from 'framer-motion';
import { Database, GitBranch, Zap, Check, X, ArrowRight, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const architectures = [
  {
    title: 'Batch Processing',
    subtitle: 'Traditional',
    icon: Database,
    accent: 'emerald',
    description: 'Scheduled batch jobs processing data at fixed intervals (hourly/daily). Simple, reliable, well-understood.',
    bestFor: 'Historical analytics, reporting, data warehousing',
    tools: 'Apache Spark, dbt, Apache Airflow',
    pros: ['Simple to implement', 'Easy to debug', 'Cost-effective for large batches', 'Strong data consistency'],
    cons: ['High latency (hours)', 'Not real-time', 'Data staleness', 'Complex scheduling'],
    latency: 'Minutes to Hours',
    complexity: 'Low',
    usage: '✅ Currently using for Gold-layer aggregations',
  },
  {
    title: 'Lambda Architecture',
    subtitle: 'Batch + Speed',
    icon: GitBranch,
    accent: 'amber',
    description: 'Dual-path architecture combining batch layer for accuracy with speed layer for low-latency results.',
    bestFor: 'Near real-time analytics with batch accuracy fallback',
    tools: 'Spark + Kafka Streams + Apache Druid',
    pros: ['Near real-time', 'Fault-tolerant', 'Historical + real-time', 'Flexible query'],
    cons: ['Complex to maintain', 'Two codebases', 'Higher infrastructure cost', 'Merging complexity'],
    latency: 'Seconds to Minutes',
    complexity: 'High',
    usage: '📋 Planned for Phase 2 streaming support',
  },
  {
    title: 'Kappa Architecture',
    subtitle: 'Stream-First',
    icon: Zap,
    accent: 'rose',
    description: 'Pure streaming architecture where all data flows through a unified stream processing pipeline.',
    bestFor: 'Real-time monitoring, fraud detection, live dashboards',
    tools: 'Apache Kafka, Apache Flink, Apache Druid',
    pros: ['True real-time', 'Single codebase', 'Simpler operations', 'Event-driven'],
    cons: ['Stream processing complexity', 'Handling late arrivals', 'Higher resource needs', 'Less mature tooling'],
    latency: 'Milliseconds',
    complexity: 'Medium',
    usage: '🔮 Future consideration for v3.0',
  },
];

const comparisonMatrix = [
  { dimension: 'Latency', batch: 'Hours', lambda: 'Seconds', kappa: 'Milliseconds' },
  { dimension: 'Complexity', batch: 'Low', lambda: 'High', kappa: 'Medium' },
  { dimension: 'Data Consistency', batch: 'Strong', lambda: 'Good', kappa: 'Eventual' },
  { dimension: 'Infrastructure Cost', batch: 'Low', lambda: 'High', kappa: 'Medium' },
  { dimension: 'Fault Tolerance', batch: 'High', lambda: 'Very High', kappa: 'High' },
  { dimension: 'Our Pipeline', batch: '✅ Current', lambda: '📋 Planned', kappa: '🔮 Future' },
];

const accentStyles: Record<string, string> = {
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    glow: 'shadow-emerald-500/5',
    badge: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    glow: 'shadow-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/15',
  },
  rose: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    glow: 'shadow-rose-500/5',
    badge: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/15',
  },
};

export default function PipelineComparison() {
  return (
    <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-400 border-emerald-500/30">
            <Layers className="h-3 w-3 mr-1.5" />
            Architecture Deep-Dive
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Pipeline Architecture Comparison
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Evaluating Batch, Lambda, and Kappa architectures for our data pipeline — trading off
            latency, complexity, and operational maturity.
          </p>
        </motion.div>

        {/* Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {architectures.map((arch, i) => {
            const style = accentStyles[arch.accent];
            return (
              <motion.div
                key={arch.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <Card className={cn('h-full border', style.border, `shadow-sm ${style.glow}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', style.iconBg)}>
                        <arch.icon className={cn('h-5 w-5', style.text)} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{arch.title}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] mt-1">{arch.subtitle}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{arch.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5 w-20 shrink-0">Best for</span>
                        <span className="text-xs">{arch.bestFor}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5 w-20 shrink-0">Tools</span>
                        <span className="text-xs">{arch.tools}</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Latency</p>
                        <p className={cn('text-xs font-medium', style.text)}>{arch.latency}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Complexity</p>
                        <p className={cn('text-xs font-medium', style.text)}>{arch.complexity}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-400 shrink-0" /><span className="text-[11px]">{arch.pros[0]}</span></div>
                      <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-400 shrink-0" /><span className="text-[11px]">{arch.pros[1]}</span></div>
                      <div className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-400 shrink-0" /><span className="text-[11px]">{arch.pros[2]}</span></div>
                      <div className="flex items-center gap-1.5"><X className="h-3 w-3 text-rose-400 shrink-0" /><span className="text-[11px] text-muted-foreground">{arch.cons[0]}</span></div>
                      <div className="flex items-center gap-1.5"><X className="h-3 w-3 text-rose-400 shrink-0" /><span className="text-[11px] text-muted-foreground">{arch.cons[1]}</span></div>
                    </div>
                    <div className={cn('rounded-lg p-2.5 text-xs font-medium', style.bg, style.text)}>
                      {arch.usage}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comparison Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-semibold">Dimension</th>
                      <th className="text-left py-3 px-3 font-semibold text-emerald-400">Batch</th>
                      <th className="text-left py-3 px-3 font-semibold text-amber-400">Lambda</th>
                      <th className="text-left py-3 px-3 font-semibold text-rose-400">Kappa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMatrix.map((row, i) => (
                      <tr key={row.dimension} className={cn('border-b border-border/30 transition-colors hover:bg-muted/20', i === comparisonMatrix.length - 1 && 'border-b-0')}>
                        <td className="py-2.5 px-3 font-medium">{row.dimension}</td>
                        <td className="py-2.5 px-3">{row.batch}</td>
                        <td className="py-2.5 px-3">{row.lambda}</td>
                        <td className="py-2.5 px-3">{row.kappa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Our Architecture Decision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-2 text-emerald-400 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Our Architecture Decision
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                Our pipeline uses a Batch Processing architecture as the foundation, with plans to evolve
                toward Lambda Architecture for near real-time capabilities. This phased approach balances
                development speed with future scalability.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 rounded-xl bg-background border border-emerald-500/20 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phase 1</p>
                  <p className="text-xs font-medium">Batch MVP</p>
                  <Badge className={cn('mt-1.5 text-[9px]', accentStyles.emerald.badge)}>Current</Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400 rotate-90 sm:rotate-0 shrink-0 self-center" />
                <div className="flex-1 rounded-xl bg-background border border-amber-500/20 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phase 2</p>
                  <p className="text-xs font-medium">Add Speed Layer</p>
                  <Badge className={cn('mt-1.5 text-[9px]', accentStyles.amber.badge)}>Planned</Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 rotate-90 sm:rotate-0 shrink-0 self-center" />
                <div className="flex-1 rounded-xl bg-background border border-rose-500/20 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phase 3</p>
                  <p className="text-xs font-medium">Full Lambda</p>
                  <Badge className={cn('mt-1.5 text-[9px]', accentStyles.rose.badge)}>Future</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

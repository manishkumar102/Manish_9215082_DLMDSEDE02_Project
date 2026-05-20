'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, GitBranch, BarChart3, Database, Radio, Clock,
  ArrowRight, CheckCircle2, AlertTriangle, Info, Layers,
  Activity, Server, HardDrive, Workflow, Cpu,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const batchPipeline = [
  { id: 'b1', name: 'CSV Data Source', icon: HardDrive, color: 'emerald', desc: 'Taobao dataset, 100K events across 9 days, daily batches' },
  { id: 'b2', name: 'FastAPI Ingestion', icon: Server, color: 'teal', desc: 'REST API, bulk upload, Pydantic validation' },
  { id: 'b3', name: 'MinIO Bronze', icon: Database, color: 'rose', desc: 'Raw CSV/JSON landing zone, 90-day retention' },
  { id: 'b4', name: 'Spark Processing', icon: Zap, color: 'orange', desc: 'Clean, dedup, validate, sessionize (batch job)' },
  { id: 'b5', name: 'MinIO Silver', icon: Database, color: 'fuchsia', desc: 'Clean Parquet files, partitioned by date' },
  { id: 'b6', name: 'dbt Transform', icon: GitBranch, color: 'sky', desc: 'Staging → intermediate → mart models (SQL)' },
  { id: 'b7', name: 'PostgreSQL', icon: Database, color: 'amber', desc: 'Star schema warehouse with materialized views' },
  { id: 'b8', name: 'Metabase', icon: BarChart3, color: 'cyan', desc: 'Business intelligence dashboards (daily refresh)' },
];

const streamingPipeline = [
  { id: 's1', name: 'Event Stream', icon: Radio, color: 'emerald', desc: 'Kafka topics: click_events, session_events (real-time)' },
  { id: 's2', name: 'Kafka Connect', icon: Server, color: 'teal', desc: 'Schema Registry + Avro serialization, partitioning' },
  { id: 's3', name: 'Flink Processing', icon: Zap, color: 'orange', desc: 'Stream processing: windowed aggregations, CEP patterns' },
  { id: 's4', name: 'Druid', icon: Database, color: 'rose', desc: 'Real-time OLAP: sub-second queries on streaming data' },
  { id: 's5', name: 'Spark Streaming', icon: Cpu, color: 'fuchsia', desc: 'Micro-batch (Structured Streaming) for complex transforms' },
  { id: 's6', name: 'Redis Cache', icon: Activity, color: 'cyan', desc: 'Hot data cache: session state, real-time counters' },
  { id: 's7', name: 'PostgreSQL', icon: Database, color: 'amber', desc: 'Persistent storage: historical data, batch reconciliation' },
  { id: 's8', name: 'Grafana Live', icon: BarChart3, color: 'sky', desc: 'Real-time dashboards with auto-refresh, live alerts' },
];

const comparisonTable = [
  {
    dimension: 'Data Freshness',
    batch: 'Hours (daily batch runs)',
    streaming: 'Seconds to minutes (real-time)',
    winner: 'streaming' as const,
  },
  {
    dimension: 'Throughput',
    batch: 'Very high (optimized bulk processing)',
    streaming: 'High (continuous ingestion)',
    winner: 'batch' as const,
  },
  {
    dimension: 'Complexity',
    batch: 'Lower (simpler architecture, fewer components)',
    streaming: 'Higher (distributed streaming, state management)',
    winner: 'batch' as const,
  },
  {
    dimension: 'Fault Tolerance',
    batch: 'Easier (re-run batch from checkpoint)',
    streaming: 'Complex (exactly-once semantics, state recovery)',
    winner: 'batch' as const,
  },
  {
    dimension: 'Cost',
    batch: 'Lower (process once, idle between runs)',
    streaming: 'Higher (always-on infrastructure)',
    winner: 'batch' as const,
  },
  {
    dimension: 'Analytics Latency',
    batch: 'Minutes (dashboard refresh after batch completes)',
    streaming: 'Milliseconds (push-based real-time dashboards)',
    winner: 'streaming' as const,
  },
  {
    dimension: 'Data Accuracy',
    batch: 'Higher (complete dataset, late-arriving data handled)',
    streaming: 'Lower (windowed approximations, potential duplicates)',
    winner: 'batch' as const,
  },
  {
    dimension: 'Use Case Fit',
    batch: 'ML model training, daily reporting, audit',
    streaming: 'Live dashboards, fraud detection, recommendations',
    winner: 'neither' as const,
  },
];

const lambdaArchComponents = [
  {
    layer: 'Batch Layer',
    icon: Layers,
    color: 'emerald',
    description: 'The existing batch pipeline serves as the batch layer — storing all data in raw form and computing comprehensive views',
    components: ['FastAPI', 'MinIO Bronze/Silver', 'Spark Batch', 'dbt', 'PostgreSQL Gold'],
    benefit: 'Provides accurate, complete historical data for analytics and ML training',
  },
  {
    layer: 'Speed Layer',
    icon: Zap,
    color: 'orange',
    description: 'New real-time layer handles low-latency data processing for recent data that hasn\'t been batched yet',
    components: ['Kafka', 'Flink', 'Druid', 'Redis Cache', 'Grafana Live'],
    benefit: 'Sub-second analytics on the most recent data (last 1-24 hours)',
  },
  {
    layer: 'Serving Layer',
    icon: BarChart3,
    color: 'cyan',
    description: 'Unified query layer merging batch views with real-time views for a single source of truth',
    components: ['PostgreSQL (batch views)', 'Druid (real-time views)', 'Metabase/Grafana (unified UI)'],
    benefit: 'Users see both historical accuracy and real-time freshness in one dashboard',
  },
];

function PipelineNode({ node, index, isSelected, onClick }: {
  node: { id: string; name: string; icon: typeof Zap; color: string; desc: string };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = node.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 border',
          isSelected
            ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
            : 'border-border/50 hover:border-border hover:shadow-sm',
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-xs', `bg-${node.color}-500/10 text-${node.color}-400`)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold truncate">{node.name}</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{node.desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StreamingStrategy() {
  const [activeTab, setActiveTab] = useState('lambda');
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  return (
    <section id="streaming" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-orange-400 border-orange-500/30">
            <Radio className="h-3 w-3 mr-1.5" />
            Phase 3 Requirement
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Real-Time Streaming Strategy
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Lambda Architecture strategy to introduce a second data pipeline capable
            of processing real-time streaming data alongside the existing batch system
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="lambda" className="text-xs sm:text-sm">
              <Layers className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Lambda Architecture
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Batch vs Stream
            </TabsTrigger>
            <TabsTrigger value="components" className="text-xs sm:text-sm">
              <Workflow className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Streaming Components
            </TabsTrigger>
          </TabsList>

          {/* Lambda Architecture */}
          <TabsContent value="lambda" className="mt-0 space-y-6">
            {/* Architecture Explanation */}
            <Card className="border border-border/50 bg-muted/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Lambda Architecture — Hybrid Batch + Streaming</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The Lambda Architecture combines a batch layer (existing pipeline) with a speed layer (new streaming pipeline)
                      and a serving layer that merges results. This approach provides both the accuracy of batch processing and
                      the low-latency of stream processing, making it ideal for clickstream analytics where both historical reporting
                      and real-time monitoring are required.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {lambdaArchComponents.map((comp) => (
                    <div key={comp.layer} className="p-3 rounded-xl bg-background border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <comp.icon className={cn('h-4 w-4', `text-${comp.color}-400`)} />
                        <h4 className="text-xs font-semibold">{comp.layer}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">{comp.description}</p>
                      <div className="space-y-1">
                        {comp.components.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[9px] mr-1 mb-1">{c}</Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[9px] text-emerald-400">{comp.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual: Existing Batch Pipeline */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Existing Batch Pipeline (Layer 1)
                <Badge variant="secondary" className="text-[10px]">Implemented</Badge>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {batchPipeline.map((node, i) => (
                  <PipelineNode
                    key={node.id}
                    node={node}
                    index={i}
                    isSelected={selectedBatch === node.id}
                    onClick={() => setSelectedBatch(selectedBatch === node.id ? null : node.id)}
                  />
                ))}
              </div>
            </div>

            {/* Arrow Separator */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/30 bg-orange-500/5">
                <ArrowRight className="h-3 w-3 mr-1" />
                ADD STREAMING LAYER
              </Badge>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Visual: New Streaming Pipeline */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-400" />
                New Streaming Pipeline (Layer 2)
                <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30">Planned Strategy</Badge>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {streamingPipeline.map((node, i) => (
                  <PipelineNode
                    key={node.id}
                    node={node}
                    index={i}
                    isSelected={selectedStream === node.id}
                    onClick={() => setSelectedStream(selectedStream === node.id ? null : node.id)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Batch vs Streaming Comparison */}
          <TabsContent value="comparison" className="mt-0">
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Batch vs Real-Time Streaming Comparison</CardTitle>
                <CardDescription>
                  Trade-off analysis for choosing between batch and streaming approaches per use case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 font-semibold text-foreground">Dimension</th>
                        <th className="text-left py-3 px-3 font-semibold text-emerald-400">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Batch</span>
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-orange-400">
                          <span className="flex items-center gap-1.5"><Radio className="h-3 w-3" /> Streaming</span>
                        </th>
                        <th className="text-center py-3 px-3 font-semibold text-foreground">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonTable.map((row) => (
                        <tr key={row.dimension} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground">{row.dimension}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.batch}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.streaming}</td>
                          <td className="py-2.5 px-3 text-center">
                            {row.winner === 'batch' && (
                              <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15">Batch</Badge>
                            )}
                            {row.winner === 'streaming' && (
                              <Badge className="text-[9px] bg-orange-500/10 text-orange-400 hover:bg-orange-500/15">Streaming</Badge>
                            )}
                            {row.winner === 'neither' && (
                              <Badge variant="secondary" className="text-[9px]">Use Case</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Key Insight */}
            <Card className="mt-4 border border-orange-500/20 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-orange-400">Key Architectural Insight</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Lambda Architecture is the recommended strategy because it combines the strengths of both approaches.
                      The existing batch pipeline handles historical accuracy, ML model training, and quarterly reporting
                      (which doesn&apos;t need real-time data). The new streaming layer adds real-time capabilities for
                      live dashboards, anomaly detection, and instant alerting — without disrupting the proven batch pipeline.
                      The serving layer merges both views, giving users a unified experience with both accuracy and freshness.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Streaming Components Detail */}
          <TabsContent value="components" className="mt-0 space-y-3">
            {streamingPipeline.map((component, i) => (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', `bg-${component.color}-500/10 text-${component.color}-400`)}>
                        <component.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold">{component.name}</h3>
                          <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30 bg-orange-500/5">
                            Planned
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{component.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Integration Note */}
            <Card className="border border-border/50 bg-muted/10">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <Workflow className="h-3.5 w-3.5 text-cyan-400" />
                  Integration with Existing Batch Pipeline
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { point: 'Shared Data Lake', detail: 'Both batch and streaming write to MinIO Silver — unified storage' },
                    { point: 'Same PostgreSQL Warehouse', detail: 'Streaming micro-batches merge into same star schema tables' },
                    { point: 'Unified Monitoring', detail: 'Prometheus monitors both batch jobs and streaming consumers' },
                    { point: 'Orchestrated by Airflow', detail: 'Airflow DAGs coordinate batch runs and manage streaming checkpoints' },
                  ].map((item) => (
                    <div key={item.point} className="flex items-start gap-2 p-2 rounded-lg bg-background border border-border/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium">{item.point}</p>
                        <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

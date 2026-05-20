'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Zap,
  Database,
  Timer,
  TrendingUp,
  ArrowDownRight,
  HardDrive,
  Server,
} from 'lucide-react';

// ============================================================================
// Color Palette (NO blue/indigo)
// ============================================================================

const COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  fuchsia: '#d946ef',
  rose: '#f43f5e',
  orange: '#f97316',
  lime: '#84cc16',
  pink: '#ec4899',
  slate: '#64748b',
};

// ============================================================================
// Animation Variants
// ============================================================================

const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const cardStagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// ============================================================================
// Data
// ============================================================================

const queryPerformanceData = [
  { query: 'Daily KPI Summary', before: 320, after: 8 },
  { query: 'Conversion Funnel', before: 480, after: 12 },
  { query: 'Hourly Patterns', before: 390, after: 10 },
  { query: 'Top Categories', before: 520, after: 18 },
  { query: 'User Segments', before: 450, after: 15 },
];

const dataProcessingData = [
  { stage: 'CSV Ingestion', before: 120, after: 8 },
  { stage: 'Spark ETL', before: 45, after: 3 },
  { stage: 'dbt Transform', before: 18, after: 2 },
  { stage: 'Warehouse Load', before: 12, after: 1 },
  { stage: 'Total Pipeline', before: 195, after: 14 },
];

const throughputData = [
  { metric: 'Simple Lookup', before: 280, after: 48000 },
  { metric: 'Aggregation', before: 180, after: 32000 },
  { metric: 'Join Query', before: 120, after: 18000 },
  { metric: 'Complex Analytics', before: 65, after: 12000 },
  { metric: 'Full Table Scan', before: 42, after: 8500 },
];

// ============================================================================
// Chart Configs
// ============================================================================

const queryChartConfig: ChartConfig = {
  before: { label: 'Before', color: COLORS.rose },
  after: { label: 'After', color: COLORS.emerald },
};

const processingChartConfig: ChartConfig = {
  before: { label: 'Before', color: COLORS.rose },
  after: { label: 'After', color: COLORS.emerald },
};

const throughputChartConfig: ChartConfig = {
  before: { label: 'Before', color: COLORS.orange },
  after: { label: 'After', color: COLORS.emerald },
};

// ============================================================================
// Summary Card Component
// ============================================================================

function SummaryCard({
  icon,
  label,
  value,
  description,
  color,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  color: string;
  index?: number;
}) {
  return (
    <motion.div custom={index} variants={cardStagger} initial="hidden" animate="visible">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`${color} rounded-lg p-2 bg-muted`}>{icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Metric Card for Cost Tab
// ============================================================================

function CostMetricCard({
  icon,
  title,
  before,
  after,
  reduction,
  color,
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  before: string;
  after: string;
  reduction: string;
  color: string;
  index?: number;
}) {
  return (
    <motion.div custom={index} variants={cardStagger} initial="hidden" animate="visible">
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`${color} rounded-lg p-2 bg-muted`}>{icon}</div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Before</p>
              <p className="text-base font-medium text-rose-500 line-through decoration-rose-300 tabular-nums">
                {before}
              </p>
            </div>
            <ArrowDownRight className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">After</p>
              <p className="text-base font-bold text-emerald-600 tabular-nums">{after}</p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3 mr-1" />
            {reduction}
          </Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function PerformanceBenchmark() {
  const avgQueryImprovement = useMemo(() => {
    const totalBefore = queryPerformanceData.reduce((s, d) => s + d.before, 0);
    const totalAfter = queryPerformanceData.reduce((s, d) => s + d.after, 0);
    return totalBefore > 0 ? Math.round(((totalBefore - totalAfter) / totalBefore) * 100) : 0;
  }, []);

  const avgProcessingImprovement = useMemo(() => {
    const totalBefore = dataProcessingData.reduce((s, d) => s + d.before, 0);
    const totalAfter = dataProcessingData.reduce((s, d) => s + d.after, 0);
    return totalBefore > 0 ? Math.round(((totalBefore - totalAfter) / totalBefore) * 100) : 0;
  }, []);

  return (
    <section id="performance" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ================================================================== */}
        {/* Header                                                            */}
        {/* ================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Performance Benchmarks
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Measurable improvements from pipeline optimization
          </p>
        </motion.div>

        {/* ================================================================== */}
        {/* Tabs System                                                       */}
        {/* ================================================================== */}
        <Tabs defaultValue="query" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="query" className="px-3 sm:px-4">
                <Zap className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Query Performance
              </TabsTrigger>
              <TabsTrigger value="processing" className="px-3 sm:px-4">
                <Database className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Data Processing
              </TabsTrigger>
              <TabsTrigger value="cost" className="px-3 sm:px-4">
                <Timer className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
                Throughput & Latency
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ================================================================ */}
          {/* Tab 1: Query Performance                                         */}
          {/* ================================================================ */}
          <TabsContent value="query">
            <motion.div
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <SummaryCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Average Improvement"
                  value={`${avgQueryImprovement}% faster`}
                  description="Across all benchmark queries"
                  color="text-emerald-500"
                  index={0}
                />
                <SummaryCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Best Improvement"
                  value="User Segments"
                  description="450ms → 15ms (97% faster)"
                  color="text-amber-500"
                  index={1}
                />
                <SummaryCard
                  icon={<Database className="h-5 w-5" />}
                  label="Avg Query Time"
                  value="12.6ms"
                  description="Down from 432ms average"
                  color="text-cyan-500"
                  index={2}
                />
              </div>

              {/* Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Query Execution Time Comparison</CardTitle>
                  <CardDescription className="text-xs">
                    Before vs after optimization — lower is better
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={queryChartConfig} className="h-[340px] w-full">
                    <BarChart
                      data={queryPerformanceData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="query"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={0}
                        fontSize={11}
                        tick={{ fill: 'var(--color-muted-foreground)' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(v: number) => `${v}ms`}
                        fontSize={11}
                        width={50}
                        label={{
                          value: 'Execution Time (ms)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 10, fill: '#94a3b8' },
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey="before"
                        fill={COLORS.rose}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        name="Before"
                      />
                      <Bar
                        dataKey="after"
                        fill={COLORS.emerald}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        name="After"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Bottom Summary Badge */}
              <div className="flex justify-center mt-4">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-sm px-4 py-1.5">
                  <Zap className="h-4 w-4 mr-1.5" />
                  Average {avgQueryImprovement}% improvement across all queries
                </Badge>
              </div>
            </motion.div>
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 2: Data Processing                                           */}
          {/* ================================================================ */}
          <TabsContent value="processing">
            <motion.div
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <SummaryCard
                  icon={<Database className="h-5 w-5" />}
                  label="End-to-End Pipeline"
                  value="93% faster"
                  description="195s → 14s total"
                  color="text-emerald-500"
                  index={0}
                />
                <SummaryCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Best Stage Improvement"
                  value="Warehouse Load"
                  description="12s → 1s (92% faster)"
                  color="text-amber-500"
                  index={1}
                />
                <SummaryCard
                  icon={<Server className="h-5 w-5" />}
                  label="Avg Stage Time"
                  value="2.8s"
                  description="Down from 39s average"
                  color="text-cyan-500"
                  index={2}
                />
              </div>

              {/* Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pipeline Stage Duration</CardTitle>
                  <CardDescription className="text-xs">
                    Processing time per stage — before vs after optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={processingChartConfig} className="h-[340px] w-full">
                    <BarChart
                      data={dataProcessingData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="stage"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={0}
                        fontSize={11}
                        tick={{ fill: 'var(--color-muted-foreground)' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(v: number) => `${v}s`}
                        fontSize={11}
                        width={50}
                        label={{
                          value: 'Duration (s)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 10, fill: '#94a3b8' },
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <ReferenceLine
                        y={0}
                        stroke="var(--color-border)"
                      />
                      <Bar
                        dataKey="before"
                        fill={COLORS.rose}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        name="Before"
                      />
                      <Bar
                        dataKey="after"
                        fill={COLORS.emerald}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        name="After"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Bottom Summary Badge */}
              <div className="flex justify-center mt-4">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-sm px-4 py-1.5">
                  <Zap className="h-4 w-4 mr-1.5" />
                  {avgProcessingImprovement}% faster end-to-end pipeline
                </Badge>
              </div>
            </motion.div>
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 3: Cost Efficiency                                           */}
          {/* ================================================================ */}
          <TabsContent value="cost">
            <motion.div
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Cost Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <CostMetricCard
                  icon={<HardDrive className="h-5 w-5" />}
                  title="Storage Savings"
                  before="48 MB (CSV)"
                  after="16 MB (Parquet)"
                  reduction="67% less storage"
                  color="text-emerald-500"
                  index={0}
                />
                <CostMetricCard
                  icon={<Server className="h-5 w-5" />}
                  title="Throughput"
                  before="420 evt/s"
                  after="48,000 evt/s"
                  reduction="114× improvement"
                  color="text-amber-500"
                  index={1}
                />
                <CostMetricCard
                  icon={<Timer className="h-5 w-5" />}
                  title="Query Latency"
                  before="432ms/query"
                  after="12ms/query"
                  reduction="97% reduction"
                  color="text-cyan-500"
                  index={2}
                />
              </div>

              {/* Horizontal Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Throughput by Query Type (events/sec)</CardTitle>
                  <CardDescription className="text-xs">
                    Before vs after optimization — higher is better
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={throughputChartConfig} className="h-[300px] w-full">
                    <BarChart
                      data={throughputData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      layout="vertical"
                    >
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                        fontSize={11}
                        label={{
                          value: 'Events per Second',
                          angle: 0,
                          position: 'insideBottom',
                          offset: -5,
                          style: { fontSize: 10, fill: '#94a3b8' },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="metric"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={11}
                        width={120}
                        tick={{ fill: 'var(--color-muted-foreground)' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey="before"
                        fill={COLORS.orange}
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                        name="Before"
                      />
                      <Bar
                        dataKey="after"
                        fill={COLORS.emerald}
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                        name="After"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Bottom Summary Badge */}
              <div className="flex justify-center mt-4">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-sm px-4 py-1.5">
                  <Zap className="h-4 w-4 mr-1.5" />
                  Up to 114× throughput improvement across all query types
                </Badge>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect, useCallback, type LucideIcon } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  HardDrive,
  Zap,
  GitBranch,
  Database,
  BarChart3,
  Play,
  Pause,
  Clock,
  Activity,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

interface StageConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  baseThroughput: number;
}

interface MetricInfo {
  label: string;
  value: number;
  format: (v: number) => string;
  baseValue: number;
  variance: number;
  icon: LucideIcon;
  textColor: string;
  sparkColor: string;
}

// ============================================================================
// Color Mapping
// ============================================================================

const colorMap: Record<
  string,
  { text: string; bg: string; border: string; accent: string; light: string; hex: string }
> = {
  emerald: {
    text: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/20 dark:border-emerald-500/25',
    accent: 'bg-emerald-500',
    light: 'bg-emerald-500/5 dark:bg-emerald-500/8',
    hex: '#10b981',
  },
  teal: {
    text: 'text-teal-500 dark:text-teal-400',
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    border: 'border-teal-500/20 dark:border-teal-500/25',
    accent: 'bg-teal-500',
    light: 'bg-teal-500/5 dark:bg-teal-500/8',
    hex: '#14b8a6',
  },
  rose: {
    text: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20 dark:border-rose-500/25',
    accent: 'bg-rose-500',
    light: 'bg-rose-500/5 dark:bg-rose-500/8',
    hex: '#f43f5e',
  },
  orange: {
    text: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-500/20 dark:border-orange-500/25',
    accent: 'bg-orange-500',
    light: 'bg-orange-500/5 dark:bg-orange-500/8',
    hex: '#f97316',
  },
  fuchsia: {
    text: 'text-fuchsia-500 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/15',
    border: 'border-fuchsia-500/20 dark:border-fuchsia-500/25',
    accent: 'bg-fuchsia-500',
    light: 'bg-fuchsia-500/5 dark:bg-fuchsia-500/8',
    hex: '#d946ef',
  },
  sky: {
    text: 'text-sky-500 dark:text-sky-400',
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    border: 'border-sky-500/20 dark:border-sky-500/25',
    accent: 'bg-sky-500',
    light: 'bg-sky-500/5 dark:bg-sky-500/8',
    hex: '#0ea5e9',
  },
  amber: {
    text: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/20 dark:border-amber-500/25',
    accent: 'bg-amber-500',
    light: 'bg-amber-500/5 dark:bg-amber-500/8',
    hex: '#f59e0b',
  },
  cyan: {
    text: 'text-cyan-500 dark:text-cyan-400',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    border: 'border-cyan-500/20 dark:border-cyan-500/25',
    accent: 'bg-cyan-500',
    light: 'bg-cyan-500/5 dark:bg-cyan-500/8',
    hex: '#06b6d4',
  },
};

// ============================================================================
// Pipeline Stages
// ============================================================================

const stages: StageConfig[] = [
  { name: 'CSV Source', icon: FileText, color: 'emerald', baseThroughput: 1200 },
  { name: 'FastAPI Ingestion', icon: Upload, color: 'teal', baseThroughput: 980 },
  { name: 'MinIO Bronze', icon: HardDrive, color: 'rose', baseThroughput: 850 },
  { name: 'Spark Processing', icon: Zap, color: 'orange', baseThroughput: 1100 },
  { name: 'MinIO Silver', icon: HardDrive, color: 'fuchsia', baseThroughput: 900 },
  { name: 'dbt Transform', icon: GitBranch, color: 'sky', baseThroughput: 750 },
  { name: 'PostgreSQL', icon: Database, color: 'amber', baseThroughput: 420 },
  { name: 'Metabase', icon: BarChart3, color: 'cyan', baseThroughput: 180 },
];

// ============================================================================
// Metrics Configuration
// ============================================================================

const metricsConfig: MetricInfo[] = [
  {
    label: 'Batch Duration',
    value: 4.8,
    format: (v: number) => v.toFixed(1) + 's',
    baseValue: 4.8,
    variance: 1.2,
    icon: Clock,
    textColor: 'text-emerald-400',
    sparkColor: '#10b981',
  },
  {
    label: 'Total Processed',
    value: 100000,
    format: (v: number) => Math.round(v).toLocaleString(),
    baseValue: 100000,
    variance: 200,
    icon: Activity,
    textColor: 'text-teal-400',
    sparkColor: '#14b8a6',
  },
  {
    label: 'Invalid Rows',
    value: 467,
    format: (v: number) => Math.round(v).toLocaleString(),
    baseValue: 467,
    variance: 50,
    icon: ShieldAlert,
    textColor: 'text-rose-400',
    sparkColor: '#f43f5e',
  },
  {
    label: 'Valid Rate',
    value: 99.53,
    format: (v: number) => v.toFixed(2) + '%',
    baseValue: 99.53,
    variance: 0.05,
    icon: CheckCircle2,
    textColor: 'text-amber-400',
    sparkColor: '#f59e0b',
  },
];

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================================================
// Helpers
// ============================================================================

function generateSparkline(seed: number, pointCount: number = 20): string {
  const coords: string[] = [];
  const w = 72;
  const h = 20;

  for (let i = 0; i < pointCount; i++) {
    const x = (i / (pointCount - 1)) * w;
    const noise =
      Math.sin(seed + i * 0.5) * 0.3 +
      Math.cos(seed * 1.7 + i * 0.8) * 0.2 +
      Math.sin(seed * 0.3 + i * 1.2) * 0.15;
    const y = h / 2 + noise * (h / 2) * 0.55;
    const clampedY = Math.max(2, Math.min(h - 2, y));
    coords.push(`${x.toFixed(1)},${clampedY.toFixed(1)}`);
  }

  return coords.join(' ');
}

// ============================================================================
// FlowConnector Sub-component
// ============================================================================

function FlowConnector({
  isRunning,
  isVertical,
  dotColor,
}: {
  isRunning: boolean;
  isVertical: boolean;
  dotColor: string;
}) {
  const svgW = isVertical ? 24 : 56;
  const svgH = isVertical ? 32 : 24;
  const dotCount = 3;

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={isVertical ? { width: 24, height: 32 } : { width: 56, height: 24 }}
    >
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Dashed connecting line */}
        <line
          x1={isVertical ? svgW / 2 : 4}
          y1={isVertical ? 4 : svgH / 2}
          x2={isVertical ? svgW / 2 : svgW - 4}
          y2={isVertical ? svgH - 4 : svgH / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-muted-foreground/25"
          strokeDasharray="4 3"
        />
        {/* Animated flowing dots */}
        {isRunning &&
          Array.from({ length: dotCount }).map((_, i) => (
            <motion.circle
              key={i}
              r={3}
              fill={dotColor}
              opacity={0.85}
              style={{ filter: `drop-shadow(0 0 3px ${dotColor})` }}
              initial={
                isVertical
                  ? { cx: svgW / 2, cy: 2 }
                  : { cx: 2, cy: svgH / 2 }
              }
              animate={
                isVertical
                  ? { cy: [2, svgH - 2] }
                  : { cx: [2, svgW - 2] }
              }
              transition={{
                duration: 1.2,
                delay: i * 0.35,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
      </svg>
    </div>
  );
}

// ============================================================================
// PipelineNode Sub-component
// ============================================================================

function PipelineNode({
  stage,
  throughput,
  isRunning,
}: {
  stage: StageConfig;
  throughput: number;
  isRunning: boolean;
}) {
  const colors = colorMap[stage.color] ?? colorMap.emerald;
  const StageIcon = stage.icon;

  return (
    <Card
      className={`
        rounded-xl border ${colors.border} shadow-sm
        bg-card/80 backdrop-blur-sm
        hover:shadow-lg transition-all duration-300
        w-[112px] flex-shrink-0
      `}
    >
      <CardContent className="flex flex-col items-center text-center gap-2 p-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}
        >
          <StageIcon className="w-5 h-5" />
        </div>

        {/* Name */}
        <p className="text-[11px] font-medium leading-tight">{stage.name}</p>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {isRunning ? 'Running' : 'Paused'}
          </span>
        </div>

        {/* Throughput counter */}
        <div className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {throughput.toLocaleString()} evt/s
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MetricCard Sub-component
// ============================================================================

function MetricCard({
  metric,
  value,
  sparkSeed,
}: {
  metric: MetricInfo;
  value: number;
  sparkSeed: number;
}) {
  const MetricIcon = metric.icon;

  return (
    <Card className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MetricIcon className={`w-4 h-4 ${metric.textColor}`} />
            <span className="text-xs text-muted-foreground">{metric.label}</span>
          </div>
          {/* Tiny sparkline */}
          <svg width={72} height={20} viewBox="0 0 72 20" className="opacity-60">
            <polyline
              points={generateSparkline(sparkSeed)}
              fill="none"
              stroke={metric.sparkColor}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-lg font-bold tracking-tight tabular-nums">
          {metric.format(value)}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Pipeline Simulator Component
// ============================================================================

export default function PipelineSimulator() {
  const [isRunning, setIsRunning] = useState(true);
  const [throughputs, setThroughputs] = useState<number[]>(
    stages.map((s) => s.baseThroughput),
  );
  const [metricValues, setMetricValues] = useState<number[]>(
    metricsConfig.map((m) => m.baseValue),
  );

  // Periodically update throughputs and metric values
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setThroughputs((prev) =>
        prev.map((_, i) => {
          const base = stages[i].baseThroughput;
          return base + Math.floor(Math.random() * 60 - 30);
        }),
      );

      setMetricValues((prev) =>
        prev.map((v, i) => {
          const cfg = metricsConfig[i];
          const delta = (Math.random() - 0.5) * cfg.variance * 0.4;
          return Math.max(
            cfg.baseValue - cfg.variance,
            Math.min(cfg.baseValue + cfg.variance, v + delta),
          );
        }),
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  return (
    <section id="pipeline-simulator" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Live Pipeline Simulator
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch data flow through each stage in real-time
          </p>
        </motion.div>

        {/* Start / Pause Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRunning}
            className={`gap-2 transition-colors duration-200 ${
              isRunning
                ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            )}
          </Button>
        </div>

        {/* Desktop Pipeline Flow — horizontal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="hidden lg:block"
        >
          <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2 px-4">
            {stages.map((stage, idx) => (
              <motion.div
                key={stage.name}
                variants={itemVariants}
                className="flex items-center"
              >
                <PipelineNode
                  stage={stage}
                  throughput={throughputs[idx]}
                  isRunning={isRunning}
                />
                {idx < stages.length - 1 && (
                  <FlowConnector
                    isRunning={isRunning}
                    isVertical={false}
                    dotColor={colorMap[stage.color]?.hex ?? '#10b981'}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile / Tablet Pipeline Flow — vertical */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="lg:hidden"
        >
          <div className="flex flex-col items-center">
            {stages.map((stage, idx) => (
              <motion.div
                key={stage.name}
                variants={itemVariants}
                className="flex flex-col items-center"
              >
                <PipelineNode
                  stage={stage}
                  throughput={throughputs[idx]}
                  isRunning={isRunning}
                />
                {idx < stages.length - 1 && (
                  <FlowConnector
                    isRunning={isRunning}
                    isVertical={true}
                    dotColor={colorMap[stage.color]?.hex ?? '#10b981'}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12"
        >
          {metricsConfig.map((metric, i) => (
            <MetricCard
              key={metric.label}
              metric={metric}
              value={metricValues[i]}
              sparkSeed={i * 7.3 + 2.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

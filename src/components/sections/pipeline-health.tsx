'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  Server,
  Database,
  Container,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ────────────────────── Types ──────────────────────

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  port: number;
  memory: number;
  maxMemory: number;
  cpu: 'low' | 'medium' | 'high';
  diskIo: 'low' | 'medium' | 'high';
  network: 'low' | 'medium' | 'high';
}

interface SystemResources {
  label: string;
  icon: typeof Cpu;
  used: number;
  total: number;
  unit: string;
}

// ────────────────────── Static Data ──────────────────────

const services: ServiceHealth[] = [
  { name: 'FastAPI Ingestion', status: 'healthy', uptime: 99.97, port: 8000, memory: 128, maxMemory: 512, cpu: 'low', diskIo: 'medium', network: 'high' },
  { name: 'MinIO (Bronze)', status: 'healthy', uptime: 99.99, port: 9000, memory: 256, maxMemory: 1024, cpu: 'low', diskIo: 'high', network: 'medium' },
  { name: 'Apache Spark', status: 'warning', uptime: 99.85, port: 8080, memory: 2048, maxMemory: 4096, cpu: 'high', diskIo: 'high', network: 'high' },
  { name: 'MinIO (Silver)', status: 'healthy', uptime: 99.99, port: 9001, memory: 256, maxMemory: 1024, cpu: 'low', diskIo: 'high', network: 'medium' },
  { name: 'dbt Transformer', status: 'healthy', uptime: 99.92, port: 8580, memory: 512, maxMemory: 1024, cpu: 'medium', diskIo: 'medium', network: 'low' },
  { name: 'PostgreSQL', status: 'healthy', uptime: 99.99, port: 5432, memory: 1024, maxMemory: 2048, cpu: 'medium', diskIo: 'high', network: 'medium' },
  { name: 'Metabase', status: 'healthy', uptime: 99.95, port: 3001, memory: 768, maxMemory: 2048, cpu: 'low', diskIo: 'low', network: 'medium' },
  { name: 'Apache Airflow', status: 'healthy', uptime: 99.90, port: 8081, memory: 512, maxMemory: 1024, cpu: 'medium', diskIo: 'medium', network: 'low' },
  { name: 'Prometheus', status: 'healthy', uptime: 99.98, port: 9090, memory: 256, maxMemory: 1024, cpu: 'low', diskIo: 'medium', network: 'low' },
  { name: 'Grafana', status: 'healthy', uptime: 99.97, port: 3100, memory: 256, maxMemory: 1024, cpu: 'low', diskIo: 'low', network: 'medium' },
];

const systemResources: SystemResources[] = [
  { label: 'CPU Usage', icon: Cpu, used: 34, total: 100, unit: '%' },
  { label: 'Memory Usage', icon: Server, used: 6.2, total: 16, unit: 'GB' },
  { label: 'Disk Usage', icon: HardDrive, used: 45.3, total: 100, unit: 'GB' },
];

const statusConfig = {
  healthy: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', label: 'Healthy' },
  warning: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', label: 'Warning' },
  error: { dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300', label: 'Error' },
} as const;

const loadColor = { low: 'bg-emerald-400', medium: 'bg-amber-400', high: 'bg-rose-400' } as const;

// ────────────────────── Animation ──────────────────────

const fadeInUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

// ────────────────────── Sub-components ──────────────────────

function UptimeRing({ value, status }: { value: number; status: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = status === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <svg width="44" height="44" className="shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" className="stroke-muted" strokeWidth="3" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 22 22)" className="transition-all duration-700" />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central"
        className="fill-foreground" fontSize="8" fontWeight="600">{value}%</text>
    </svg>
  );
}

function DotIndicator({ load }: { load: 'low' | 'medium' | 'high' }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${loadColor[load]}`} />;
}

function ServiceCard({ svc }: { svc: ServiceHealth }) {
  const cfg = statusConfig[svc.status];
  const memPct = Math.round((svc.memory / svc.maxMemory) * 100);

  return (
    <motion.div variants={fadeInUp} transition={{ duration: 0.45 }} whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <Card className="h-full border-border/60 transition-colors">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              <span className="font-semibold text-sm text-foreground truncate">{svc.name}</span>
            </div>
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${cfg.badge}`}>{cfg.label}</Badge>
          </div>

          {/* Uptime + Port */}
          <div className="flex items-center justify-between">
            <UptimeRing value={svc.uptime} status={svc.status} />
            <Badge variant="outline" className="font-mono text-xs">:{svc.port}</Badge>
          </div>

          {/* Memory bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Memory</span>
              <span className="font-mono">{svc.memory}MB / {svc.maxMemory}MB</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${memPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${memPct}%` }} />
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /><DotIndicator load={svc.cpu} />CPU</span>
            <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /><DotIndicator load={svc.diskIo} />I/O</span>
            <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /><DotIndicator load={svc.network} />Net</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceGauge({ res }: { res: SystemResources }) {
  const pct = Math.round((res.used / res.total) * 100);
  const barColor = pct > 70 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <res.icon className="h-4 w-4 text-emerald-500" />
            {res.label}
          </div>
          <span className="text-sm font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground font-mono">{res.used} / {res.total} {res.unit}</p>
      </CardContent>
    </Card>
  );
}

// ────────────────────── Main Component ──────────────────────

export default function PipelineHealth() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [lastChecked, setLastChecked] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLastChecked((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const avgUptime = (services.reduce((s, v) => s + v.uptime, 0) / services.length).toFixed(2);

  const summaryStats = [
    { icon: Server, label: 'Total Services', value: '10', color: 'text-emerald-500' },
    { icon: CheckCircle, label: 'Healthy', value: '9', color: 'text-emerald-500' },
    { icon: AlertTriangle, label: 'Warnings', value: '1', color: 'text-amber-500' },
    { icon: Activity, label: 'Errors', value: '0', color: 'text-rose-500' },
    { icon: Shield, label: 'Avg Uptime', value: `${avgUptime}%`, color: 'text-teal-500' },
  ];

  return (
    <section id="pipeline-health" className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div ref={ref} initial="initial" animate={isInView ? 'animate' : 'initial'} variants={stagger} className="text-center mb-10">
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mb-3">Monitoring</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-emerald-500" />Pipeline Health Monitor
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">Real-time health status of all 10 Docker microservices in the data pipeline</p>
          </motion.div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div initial="initial" animate={isInView ? 'animate' : 'initial'} variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {summaryStats.map((s) => (
            <motion.div key={s.label} variants={fadeInUp} transition={{ duration: 0.4 }}>
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Service Cards Grid */}
        <motion.div initial="initial" animate={isInView ? 'animate' : 'initial'} variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {services.map((svc) => (
            <ServiceCard key={svc.port} svc={svc} />
          ))}
        </motion.div>

        {/* System Resources */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.5, delay: 0.3 }} className="mb-6">
          <Card className="border-border/60">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Container className="h-5 w-5 text-teal-500" />System Resources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {systemResources.map((r) => (
                  <ResourceGauge key={r.label} res={r} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Last Checked */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Last checked: <span className="font-mono text-foreground">{lastChecked}</span> seconds ago
          </p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setLastChecked(0)}>
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, ShoppingCart, Heart, CheckCircle,
  Play, Pause, Trash2, Activity, Users, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Types
interface LiveEvent {
  id: number;
  timestamp: string;
  user_id: string;
  behavior: 'pv' | 'cart' | 'fav' | 'buy';
  item_id: string;
  category_id: string;
}

// Deterministic Taobao distribution: pv=87.63%, cart=6.04%, fav=4.05%, buy=2.28%
const BOUNDARIES = [8763, 9367, 9772, 10000] as const;
function getBehavior(counter: number): LiveEvent['behavior'] {
  const mod = counter % 10000;
  if (mod < BOUNDARIES[0]) return 'pv';
  if (mod < BOUNDARIES[1]) return 'cart';
  if (mod < BOUNDARIES[2]) return 'fav';
  return 'buy';
}
function getIntervalMs(counter: number): number {
  return 1000 + ((counter * 7 + 3) % 2001);
}
function fmtTime(d: Date): string { return d.toTimeString().slice(0, 8); }

type BKey = 'pv' | 'cart' | 'fav' | 'buy';
const BCFG: Record<BKey, { icon: typeof Eye; color: string; bg: string; border: string; bar: string }> = {
  pv:   { icon: Eye,          color: 'text-slate-400',    bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   bar: '#64748b' },
  cart: { icon: ShoppingCart,  color: 'text-amber-400',    bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: '#f59e0b' },
  fav:  { icon: Heart,         color: 'text-rose-400',     bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    bar: '#f43f5e' },
  buy:  { icon: CheckCircle,   color: 'text-emerald-400',  bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: '#10b981' },
};

const DIST_LABELS: { key: BKey; label: string; pct: number }[] = [
  { key: 'pv', label: 'Page View', pct: 87.63 },
  { key: 'cart', label: 'Add to Cart', pct: 6.04 },
  { key: 'fav', label: 'Favorite', pct: 4.05 },
  { key: 'buy', label: 'Purchase', pct: 2.28 },
];

const METRICS = [
  { label: 'Total Events', icon: Activity, iconColor: 'text-emerald-400' },
  { label: 'Events/sec', icon: Zap, iconColor: 'text-amber-400' },
  { label: 'Active Users', icon: Users, iconColor: 'text-teal-400' },
  { label: 'Buy Rate', icon: CheckCircle, iconColor: 'text-emerald-400' },
];

const eventV = {
  initial: { opacity: 0, y: -12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

// Animated counter
function Counter({ value, dec = 0 }: { value: number; dec?: number }) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), 50);
    return () => clearTimeout(t);
  }, [value]);
  return <span className="tabular-nums">{dec > 0 ? d.toFixed(dec) : Math.round(d).toLocaleString()}{dec > 0 ? '%' : ''}</span>;
}

// SVG area sparkline
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 160, h = 40, max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - (v / max) * h * 0.85 - 2 }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`${line} ${w},${h} 0,${h}`} fill="url(#sg)" />
      <polyline points={line} fill="none" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LiveEventStream() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eps, setEps] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [sparkData, setSparkData] = useState<number[]>(Array(30).fill(0));

  const ctrRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secRef = useRef(0);
  const usersRef = useRef<Set<string>>(new Set());
  const pausedRef = useRef(false);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  // Event generation loop
  useEffect(() => {
    function tick() {
      if (pausedRef.current) return;
      timerRef.current = setTimeout(() => {
        const c = ctrRef.current;
        const uid = `u_${(c * 13 + 7) % 98765 + 10000}`;
        usersRef.current.add(uid);
        if (usersRef.current.size > 2000) {
          const it = usersRef.current.values();
          for (let i = 0; i < 500; i++) usersRef.current.delete(it.next().value);
        }
        setEvents((prev) => [{
          id: c, timestamp: fmtTime(new Date()), user_id: uid,
          behavior: getBehavior(c),
          item_id: `item_${(c * 31 + 11) % 500000 + 100000}`,
          category_id: `cat_${(c * 7 + 3) % 5000 + 1000}`,
        }, ...prev].slice(0, 50));
        setTotalEvents((p) => p + 1);
        secRef.current += 1;
        ctrRef.current += 1;
        tick();
      }, getIntervalMs(ctrRef.current));
    }
    tick();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPaused]);

  // Per-second metrics
  useEffect(() => {
    const iv = setInterval(() => {
      setEps(secRef.current);
      setSparkData((p) => [...p.slice(1), secRef.current]);
      secRef.current = 0;
      setActiveUsers(usersRef.current.size);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleClear = useCallback(() => {
    setEvents([]); setTotalEvents(0); setEps(0);
    setSparkData(Array(30).fill(0));
    secRef.current = 0; usersRef.current.clear();
  }, []);

  const metricValues = [totalEvents, eps, activeUsers, totalEvents > 0 ? (events.filter((e) => e.behavior === 'buy').length / totalEvents) * 100 : 0];
  const bCounts = { pv: 0, cart: 0, fav: 0, buy: 0 };
  events.forEach((e) => { bCounts[e.behavior]++; });
  const total = events.length || 1;
  const bKeys: BKey[] = ['pv', 'cart', 'fav', 'buy'];

  return (
    <section id="live-events" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }} className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 inline-flex items-center gap-3">
            Live Event Stream
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-semibold">LIVE</Badge>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time simulated Taobao user behavior events flowing through the data pipeline
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Event Feed */}
          <div className="lg:col-span-3">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Event Feed
                    <span className="text-xs text-muted-foreground font-normal ml-1">({events.length} visible)</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsPaused((p) => !p)}
                      className={`h-7 text-xs gap-1.5 transition-colors ${isPaused ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}>
                      {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClear}
                      className="h-7 text-xs gap-1.5 border-border/50 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10">
                      <Trash2 className="w-3 h-3" /> Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {events.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-sm text-muted-foreground">
                        {isPaused ? 'Stream paused — click Resume to continue' : 'Waiting for events...'}
                      </motion.div>
                    )}
                    {events.map((ev) => {
                      const cfg = BCFG[ev.behavior];
                      const Ic = cfg.icon;
                      return (
                        <motion.div key={ev.id} variants={eventV} initial="initial" animate="animate" exit="exit" layout
                          className={`flex items-center gap-3 px-4 py-2.5 border-b border-border/30 ${cfg.bg} transition-colors`}>
                          <Ic className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                          <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-16 flex-shrink-0">{ev.timestamp}</span>
                          <Badge variant="secondary" className={`text-[10px] font-mono h-5 border ${cfg.border} ${cfg.bg} ${cfg.color}`}>{ev.behavior}</Badge>
                          <span className="text-xs font-mono text-muted-foreground truncate">{ev.user_id}</span>
                          <span className="text-xs font-mono text-foreground/50 truncate ml-auto">{ev.item_id}</span>
                          <span className="text-[10px] font-mono text-muted-foreground/60 flex-shrink-0">{ev.category_id}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Data Source Info */}
            <Card className="mt-4 border-border/30 bg-muted/20">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Simulating Taobao User Behavior Dataset</p>
                  <p className="text-[11px] text-muted-foreground">Based on Alibaba Taobao dataset &bull; ~1M events &bull; Nov 25 &ndash; Dec 3, 2017</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m, i) => {
                const MIcon = m.icon;
                return (
                  <Card key={m.label} className="border-border/50 bg-card/80">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MIcon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                        <span className="text-[11px] text-muted-foreground">{m.label}</span>
                      </div>
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        <Counter value={metricValues[i]} dec={i === 3 ? 2 : 0} />
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Behavior Distribution */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-semibold">Behavior Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex rounded-md overflow-hidden h-4 mb-3">
                  {bKeys.map((k) => (
                    <motion.div key={k} initial={{ width: 0 }} animate={{ width: `${(bCounts[k] / total) * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }} className="h-full" style={{ backgroundColor: BCFG[k].bar }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {DIST_LABELS.map(({ key, label, pct }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: BCFG[key].bar }} />
                        <span className="text-[11px] text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Throughput Sparkline */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Throughput (last 30s)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4"><Sparkline data={sparkData} /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

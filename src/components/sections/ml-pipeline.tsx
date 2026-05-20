'use client';

import { motion } from 'framer-motion';
import {
  Layers, Cpu, Save, BarChart3, Globe, Star, TrendingUp,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const stages = [
  {
    id: 1, title: 'Feature Store', color: 'emerald', Icon: Layers,
    desc: 'Aggregate user behavior features from Gold layer',
    items: ['User embeddings', 'Category preferences', 'Time patterns', 'Purchase history'],
  },
  {
    id: 2, title: 'Model Training', color: 'fuchsia', Icon: Cpu,
    desc: 'Train collaborative filtering and content-based models',
    items: ['ALS matrix factorization', 'Item2Vec', 'Neural collaborative filtering'],
  },
  {
    id: 3, title: 'Model Registry', color: 'amber', Icon: Save,
    desc: 'Version, validate and deploy trained models',
    items: ['MLflow tracking', 'A/B testing', 'Model versioning', 'Performance metrics'],
  },
  {
    id: 4, title: 'Batch Scoring', color: 'teal', Icon: BarChart3,
    desc: 'Generate personalized recommendations for all users',
    items: ['Daily score refresh', 'Top-N recommendations', 'Diversity re-ranking'],
  },
  {
    id: 5, title: 'Online Serving', color: 'rose', Icon: Globe,
    desc: 'Serve real-time recommendations via API',
    items: ['REST API', 'Caching layer', 'Cold-start fallback', 'A/B routing'],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; progress: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400', progress: 'bg-emerald-500' },
  fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', badge: 'bg-fuchsia-500/10 text-fuchsia-400', progress: 'bg-fuchsia-500' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   badge: 'bg-amber-500/10 text-amber-400',   progress: 'bg-amber-500' },
  teal:    { bg: 'bg-teal-500/10',     text: 'text-teal-400',    border: 'border-teal-500/30',    badge: 'bg-teal-500/10 text-teal-400',    progress: 'bg-teal-500' },
  rose:    { bg: 'bg-rose-500/10',     text: 'text-rose-400',    border: 'border-rose-500/30',    badge: 'bg-rose-500/10 text-rose-400',    progress: 'bg-rose-500' },
};

const recommendations = [
  { name: 'Electronics #4521', rating: 4.8, confidence: 96, purchases: '2.3K' },
  { name: 'Clothing #8934', rating: 4.6, confidence: 92, purchases: '1.8K' },
  { name: 'Home & Kitchen #2103', rating: 4.5, confidence: 89, purchases: '1.2K' },
  { name: 'Beauty #6721', rating: 4.3, confidence: 85, purchases: '980' },
  { name: 'Sports #3456', rating: 4.9, confidence: 98, purchases: '3.1K' },
  { name: 'Books #9012', rating: 4.2, confidence: 87, purchases: '1.5K' },
];

const metrics = [
  { label: 'Accuracy (Hit Rate@10)', value: '34.2%', color: 'fuchsia' },
  { label: 'NDCG', value: '0.287', color: 'emerald' },
  { label: 'Coverage', value: '67.8%', color: 'amber' },
  { label: 'Training Time', value: '45 min', color: 'teal' },
];

const modelComparison = [
  { name: 'ALS', value: 34.2, color: 'bg-fuchsia-500', barCls: '[&>div]:bg-fuchsia-500' },
  { name: 'Item2Vec', value: 31.8, color: 'bg-emerald-500', barCls: '[&>div]:bg-emerald-500' },
  { name: 'NCF', value: 36.1, color: 'bg-amber-500', barCls: '[&>div]:bg-amber-500' },
];

function PipelineStageCard({ stage, index }: { stage: typeof stages[number]; index: number }) {
  const c = colorMap[stage.color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12 }}
      className="flex-1 min-w-0"
    >
      <Card className="border border-border/50 bg-card hover:shadow-lg transition-shadow h-full">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
              <stage.Icon className={`h-5 w-5 ${c.text}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground">Stage {stage.id}</span>
              </div>
              <CardTitle className="text-sm truncate">{stage.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{stage.desc}</p>
          <div className="flex flex-wrap gap-1.5">
            {stage.items.map((item) => (
              <Badge key={item} variant="secondary" className="text-[10px] font-normal">{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnimatedArrow() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="hidden md:flex flex-col items-center justify-center flex-shrink-0 w-8"
    >
      <div className="flex flex-col items-center gap-0.5">
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-0.5"
        >
          <div className="h-px w-4 bg-fuchsia-500/40" />
          <ArrowRight className="h-3.5 w-3.5 text-fuchsia-500/60" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function MobileArrow() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex md:hidden justify-center py-1"
    >
      <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
        <ArrowRight className="h-4 w-4 text-fuchsia-500/60 rotate-90" />
      </motion.div>
    </motion.div>
  );
}

export default function MLPipeline() {
  return (
    <section id="ml-pipeline" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <Badge variant="outline" className="mb-4 text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/5">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Machine Learning
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            ML &amp; Recommendation Pipeline
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            End-to-end machine learning workflow integrated into the data engineering pipeline
            — from feature engineering to real-time model serving
          </p>
        </motion.div>

        {/* ML Pipeline Flow */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {stages.map((stage, i) => (
            <div key={stage.id} className="contents">
              <PipelineStageCard stage={stage} index={i} />
              {i < stages.length - 1 && <AnimatedArrow />}
              {i < stages.length - 1 && <MobileArrow />}
            </div>
          ))}
        </div>

        {/* Recommendation Preview + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendation Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border border-border/50 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-sm">Recommended for User #10891</CardTitle>
                  <Badge variant="secondary" className="text-[10px] ml-auto">Live Preview</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendations.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 hover:border-border/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" /> {item.rating}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{item.purchases} purchases</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.confidence}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.06 }}
                              className={`h-full rounded-full ${item.confidence >= 95 ? 'bg-emerald-500' : item.confidence >= 90 ? 'bg-fuchsia-500' : 'bg-amber-500'}`}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{item.confidence}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Model Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="border border-border/50 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-sm">Model Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.map((m) => {
                  const mc = colorMap[m.color];
                  return (
                    <div key={m.label} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                        <p className={`text-lg font-bold ${mc.text}`}>{m.value}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        <TrendingUp className="h-2.5 w-2.5 mr-1" />
                        Active
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Model Comparison */}
            <Card className="border border-border/50 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Model Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modelComparison.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{m.name}</span>
                      <span className="font-semibold">{m.value}%</span>
                    </div>
                    <Progress value={(m.value / 40) * 100} className={`h-1.5 ${m.barCls}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useCallback, type LucideIcon } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  HardDrive,
  Zap,
  CalendarClock,
  GitBranch,
  Database,
  BarChart3,
  Container,
  Activity,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Star,
  ExternalLink,
  Box,
  FileCode,
  Server,
  Plug,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { techStackDetails } from '@/data/tech-stack-details';
import type { TechStackDetail } from '@/data/tech-stack-details';

// ============================================================================
// Color Mapping
// ============================================================================

const colorMap: Record<string, { text: string; bg: string; border: string; accent: string; light: string; cardBg: string; darkCardBg: string }> = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/25', border: 'border-emerald-200 dark:border-emerald-500/40', accent: 'bg-emerald-500', light: 'bg-emerald-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.17 0.04 160) 0%, oklch(0.15 0.015 160) 100%)' },
  teal: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-500/25', border: 'border-teal-200 dark:border-teal-500/40', accent: 'bg-teal-500', light: 'bg-teal-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.17 0.035 180) 0%, oklch(0.15 0.012 180) 100%)' },
  orange: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/25', border: 'border-orange-200 dark:border-orange-500/40', accent: 'bg-orange-500', light: 'bg-orange-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.18 0.04 60) 0%, oklch(0.15 0.015 60) 100%)' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/25', border: 'border-rose-200 dark:border-rose-500/40', accent: 'bg-rose-500', light: 'bg-rose-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.18 0.04 10) 0%, oklch(0.15 0.015 10) 100%)' },
  fuchsia: { text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/25', border: 'border-fuchsia-200 dark:border-fuchsia-500/40', accent: 'bg-fuchsia-500', light: 'bg-fuchsia-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.18 0.04 310) 0%, oklch(0.15 0.015 310) 100%)' },
  sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-500/25', border: 'border-sky-200 dark:border-sky-500/40', accent: 'bg-sky-500', light: 'bg-sky-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.17 0.035 230) 0%, oklch(0.15 0.012 230) 100%)' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/25', border: 'border-amber-200 dark:border-amber-500/40', accent: 'bg-amber-500', light: 'bg-amber-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.18 0.05 85) 0%, oklch(0.15 0.02 85) 100%)' },
  cyan: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-500/25', border: 'border-cyan-200 dark:border-cyan-500/40', accent: 'bg-cyan-500', light: 'bg-cyan-50', cardBg: '', darkCardBg: 'background: linear-gradient(135deg, oklch(0.17 0.035 200) 0%, oklch(0.15 0.012 200) 100%)' },
};

// ============================================================================
// Icon Mapping
// ============================================================================

const iconMap: Record<string, LucideIcon> = {
  Upload,
  HardDrive,
  Zap,
  CalendarClock,
  GitBranch,
  Database,
  BarChart3,
  Container,
  Activity,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] ?? Box;
  return <Comp className={className} />;
}

// ============================================================================
// Category Color Map
// ============================================================================

const categoryColorMap: Record<string, string> = {
  Ingestion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  Processing: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  Transformation: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300',
  Warehouse: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  Orchestration: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  Visualization: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const detailVariants = {
  enter: { opacity: 0, x: 60 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.25, ease: 'easeIn' } },
};

const overviewVariants = {
  enter: { opacity: 0, x: -60 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.25, ease: 'easeIn' } },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ============================================================================
// CopyButton Sub-component
// ============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700 absolute top-3 right-3"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

// ============================================================================
// CodeBlock Sub-component
// ============================================================================

function CodeBlock({
  code,
  language,
  filename,
  description,
}: {
  code: string;
  language: string;
  filename: string;
  description: string;
}) {
  return (
    <motion.div
      custom={0}
      variants={staggerItemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm font-mono text-muted-foreground">{filename}</code>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          {language}
        </Badge>
      </div>

      <div className="relative group rounded-lg overflow-hidden border border-slate-700">
        <CopyButton text={code} />
        <ScrollArea className="max-h-80">
          <pre className="bg-slate-900 text-slate-100 p-4 pr-12 text-sm font-mono leading-relaxed overflow-x-auto">
            <code>{code}</code>
          </pre>
        </ScrollArea>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}

// ============================================================================
// Overview Tab Content
// ============================================================================

function OverviewTabContent({ tech }: { tech: TechStackDetail }) {
  const colors = colorMap[tech.color] ?? colorMap.emerald;

  return (
    <div className="space-y-6">
      {/* Description Card */}
      <motion.div custom={0} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className={`rounded-xl border-l-4 shadow-sm`} style={{ borderLeftColor: 'var(--accent-color)' }}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} flex-shrink-0`}>
                <DynamicIcon name={tech.icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-emerald-600 dark:text-emerald-400 text-sm italic">{tech.overview.tagline}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tech.overview.description}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Features */}
        <motion.div custom={1} variants={staggerItemVariants} initial="hidden" animate="visible">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5">
                {tech.overview.keyFeatures.map((feature, i) => (
                  <motion.li
                    key={i}
                    custom={i + 2}
                    variants={staggerItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Strengths & Use Cases */}
        <motion.div custom={2} variants={staggerItemVariants} initial="hidden" animate="visible" className="space-y-4">
          {/* Strengths */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5">
                {tech.overview.strengths.map((strength, i) => (
                  <motion.li
                    key={i}
                    custom={i + 2}
                    variants={staggerItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <Star className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <Card className={`shadow-sm border ${colors.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Box className={`w-4 h-4 ${colors.text}`} />
                Use Cases in This Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5">
                {tech.overview.useCases.map((uc, i) => (
                  <motion.li
                    key={i}
                    custom={i + 2}
                    variants={staggerItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <ChevronRight className={`w-3.5 h-3.5 mt-0.5 ${colors.text} flex-shrink-0`} />
                    <span>{uc}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Version / License / Website */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Version</div>
                  <code className={`text-sm font-mono font-medium ${colors.text}`}>{tech.version}</code>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">License</div>
                  <span className="text-sm font-medium">{tech.license}</span>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Website</div>
                  <a
                    href={tech.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-medium ${colors.text} inline-flex items-center gap-1 hover:underline`}
                  >
                    Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// Configuration Tab Content
// ============================================================================

function ConfigurationTabContent({ tech }: { tech: TechStackDetail }) {
  const colors = colorMap[tech.color] ?? colorMap.emerald;

  return (
    <div className="space-y-5">
      {/* Docker Image & Resources */}
      {(tech.configuration.dockerImage || tech.configuration.resources || tech.configuration.ports) && (
        <motion.div custom={0} variants={staggerItemVariants} initial="hidden" animate="visible">
          <Card className={`shadow-sm border ${colors.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className={`w-4 h-4 ${colors.text}`} />
                Deployment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tech.configuration.dockerImage && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Docker Image</div>
                    <code className="text-xs font-mono font-medium text-muted-foreground break-all">{tech.configuration.dockerImage}</code>
                  </div>
                )}
                {tech.configuration.ports && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Ports</div>
                    <code className="text-xs font-mono font-medium text-muted-foreground">{tech.configuration.ports}</code>
                  </div>
                )}
                {tech.configuration.resources && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Resources</div>
                    <code className="text-xs font-mono font-medium text-muted-foreground">{tech.configuration.resources}</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Config Files */}
      <motion.div custom={1} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-500" />
              Configuration Files
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {tech.configuration.configFiles.map((file, i) => (
                <motion.li
                  key={file.path}
                  custom={i + 2}
                  variants={staggerItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-start gap-3 py-1.5"
                >
                  <FileCode className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-500" />
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-mono break-all">{file.path}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">{file.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Environment Variables */}
      <motion.div custom={2} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-500" />
              Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs">Key</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs">Description</th>
                    <th className="text-left py-2 font-medium text-muted-foreground text-xs">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {tech.configuration.environmentVars.map((env, i) => (
                    <motion.tr
                      key={env.key}
                      custom={i + 3}
                      variants={staggerItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2 pr-4">
                        <code className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">{env.key}</code>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">{env.description}</td>
                      <td className="py-2">
                        <code className="text-xs font-mono text-muted-foreground">{env.defaultValue}</code>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integrations */}
      <motion.div custom={3} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="w-4 h-4 text-fuchsia-500" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {tech.integrations.map((integ, i) => (
                <motion.div
                  key={integ.name}
                  custom={i + 4}
                  variants={staggerItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-start gap-3"
                >
                  <Badge
                    variant="outline"
                    className={`text-[10px] mt-0.5 flex-shrink-0 ${
                      integ.direction === 'upstream'
                        ? 'text-emerald-600 border-emerald-300'
                        : integ.direction === 'downstream'
                          ? 'text-rose-600 border-rose-300'
                          : 'text-cyan-600 border-cyan-300'
                    }`}
                  >
                    {integ.direction}
                  </Badge>
                  <div>
                    <span className="text-sm font-medium">{integ.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{integ.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Bento Card (used in overview)
// ============================================================================

function getCardSize(index: number): string {
  if (index < 2) return 'sm:col-span-2';
  if (index < 4) return 'sm:col-span-1 md:col-span-1';
  return 'sm:col-span-1';
}

interface TechCardData {
  tech: TechStackDetail;
  onClick: () => void;
}

function TechCard({ tech, onClick }: TechCardData) {
  const colors = colorMap[tech.color] ?? colorMap.emerald;
  const catClass = categoryColorMap[tech.category] || 'bg-muted text-muted-foreground';

  return (
    <Card
      className="rounded-xl border shadow-sm hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 ease-out h-full cursor-pointer group relative overflow-hidden"
      style={{ background: colors.darkCardBg }}
      onClick={onClick}
    >
      {/* Light mode overlay to override the dark gradient */}
      <div className="absolute inset-0 rounded-xl bg-card dark:bg-transparent" />
      {/* Colored border glow in dark mode */}
      <div className={`absolute inset-0 rounded-xl border ${colors.border} dark:border-transparent pointer-events-none`} />
      <div className={`absolute inset-0 rounded-xl border-0 dark:border ${colors.border} pointer-events-none`} />
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl scale-110 ${colors.bg}`}
        style={{ opacity: 0 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.15'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
      />
      <CardContent className="p-5 flex flex-col gap-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`w-11 h-11 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
          >
            <DynamicIcon name={tech.icon} className="w-5 h-5" />
          </div>
          <Badge
            variant="secondary"
            className={`text-[10px] px-2 py-0.5 rounded-full ${catClass}`}
          >
            {tech.category}
          </Badge>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">{tech.name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tech.overview.tagline}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Detail View Component
// ============================================================================

function DetailView({
  tech,
  currentIndex,
  total,
  onBack,
  onPrev,
  onNext,
}: {
  tech: TechStackDetail;
  currentIndex: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const colors = colorMap[tech.color] ?? colorMap.emerald;
  const catClass = categoryColorMap[tech.category] || 'bg-muted text-muted-foreground';

  return (
    <motion.div variants={detailVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Technology Stack</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">{tech.name}</span>
        </div>
      </div>

      {/* Technology Title */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
          <DynamicIcon name={tech.icon} className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{tech.name}</h3>
            <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 rounded-full ${catClass}`}>
              {tech.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{tech.overview.tagline}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTabContent tech={tech} />
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <div className="space-y-8">
            {tech.codeExamples.map((example, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="font-semibold text-sm">{example.title}</h4>
                <CodeBlock
                  code={example.code}
                  language={example.language}
                  filename={example.filename}
                  description={example.description}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <ConfigurationTabContent tech={tech} />
        </TabsContent>
      </Tabs>

      {/* Prev / Next Navigation */}
      <Separator />
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentIndex > 0 ? techStackDetails[currentIndex - 1]?.name : 'Previous'}
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {total}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === total - 1}
          className="gap-1.5"
        >
          {currentIndex < total - 1 ? techStackDetails[currentIndex + 1]?.name : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Tech Stack Component
// ============================================================================

export default function TechStack() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const techs = techStackDetails;
  const currentIndex = techs.findIndex((t) => t.id === selectedId);
  const selectedTech = currentIndex >= 0 ? techs[currentIndex] : null;

  const categories = [...new Set(techs.map((t) => t.category))];

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedId(techs[currentIndex - 1]?.id ?? null);
    }
  }, [currentIndex, techs]);

  const handleNext = useCallback(() => {
    if (currentIndex < techs.length - 1) {
      setSelectedId(techs[currentIndex + 1]?.id ?? null);
    }
  }, [currentIndex, techs]);

  return (
    <section id="tech-stack" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Technology Stack
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {selectedTech
              ? 'Explore technology details, code examples, and configuration'
              : 'Modern data engineering tools, containerized and production-ready'}
          </p>
          {!selectedTech && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground/70 mt-2 flex items-center justify-center gap-1.5"
            >
              <span>Click any technology to explore</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>
            </motion.p>
          )}
        </motion.div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {!selectedTech ? (
              /* Overview Mode */
              <motion.div
                key="overview"
                variants={overviewVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  key={String(selectedId)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {techs.map((tech, index) => (
                      <motion.div
                        key={tech.id}
                        variants={cardVariants}
                        className={getCardSize(index)}
                      >
                        <TechCard
                          tech={tech}
                          onClick={() => handleSelect(tech.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Category Legend */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-3 mt-10"
                >
                  {categories.map((cat) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className={`text-xs px-3 py-1 rounded-full ${categoryColorMap[cat] || 'bg-muted text-muted-foreground'}`}
                    >
                      {cat}
                    </Badge>
                  ))}
                </motion.div>
              </motion.div>
            ) : selectedTech ? (
              /* Detail Mode */
              <motion.div
                key={`detail-${selectedId}`}
                className="max-w-5xl mx-auto"
              >
                <DetailView
                  tech={selectedTech}
                  currentIndex={currentIndex}
                  total={techs.length}
                  onBack={handleBack}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

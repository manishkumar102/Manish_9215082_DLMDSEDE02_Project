'use client';

import { useState, useCallback, type LucideIcon } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  Zap,
  HardDrive,
  Activity,
  GitBranch,
  Database,
  BarChart3,
  ChevronRight,
  ArrowDown,
  Layers,
  Shield,
  Trophy,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  FileCode,
  FileText,
  FlaskConical,
  Terminal,
  BookOpen,
  FolderCog,
  Box,
  Globe,
  HeartPulse,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { architectureComponentDetails } from '@/data/architecture-details';
import type { ArchitectureComponentDetail } from '@/data/architecture-details';

// ============================================================================
// Color Mapping
// ============================================================================

const colorMap: Record<string, { text: string; bg: string; border: string; accent: string; light: string }> = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', accent: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/20' },
  teal: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800', accent: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-950/20' },
  orange: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800', accent: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-950/20' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', accent: 'bg-rose-500', light: 'bg-rose-50 dark:bg-rose-950/20' },
  fuchsia: { text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/40', border: 'border-fuchsia-200 dark:border-fuchsia-800', accent: 'bg-fuchsia-500', light: 'bg-fuchsia-50 dark:bg-fuchsia-950/20' },
  sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800', accent: 'bg-sky-500', light: 'bg-sky-50 dark:bg-sky-950/20' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', accent: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-950/20' },
  cyan: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800', accent: 'bg-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-950/20' },
};

// ============================================================================
// Icon Mapping
// ============================================================================

const iconMap: Record<string, LucideIcon> = {
  FileSpreadsheet,
  Zap,
  HardDrive,
  Activity,
  GitBranch,
  Database,
  BarChart3,
  Layers,
  Shield,
  Trophy,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] ?? FileSpreadsheet;
  return <Comp className={className} />;
}

// ============================================================================
// File Type Icon & Color Mapping
// ============================================================================

const fileTypeConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  config: { icon: FolderCog, color: 'text-amber-600 dark:text-amber-400', label: 'Config' },
  source: { icon: FileCode, color: 'text-emerald-600 dark:text-emerald-400', label: 'Source' },
  test: { icon: FlaskConical, color: 'text-rose-600 dark:text-rose-400', label: 'Test' },
  script: { icon: Terminal, color: 'text-cyan-600 dark:text-cyan-400', label: 'Script' },
  doc: { icon: BookOpen, color: 'text-fuchsia-600 dark:text-fuchsia-400', label: 'Doc' },
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
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

const arrowVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
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

function OverviewTabContent({ component }: { component: ArchitectureComponentDetail }) {
  const colors = colorMap[component.colorScheme.primary] ?? colorMap.emerald;

  return (
    <div className="space-y-6">
      <motion.div
        custom={0}
        variants={staggerItemVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className={`rounded-xl border-l-4 border-l-[${colors.accent?.replace('bg-', '')}] shadow-sm`} style={{ borderLeftColor: 'var(--accent-color)' }}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} flex-shrink-0`}>
                <DynamicIcon name={component.icon} className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{component.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {component.overview.description}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responsibilities */}
        <motion.div custom={1} variants={staggerItemVariants} initial="hidden" animate="visible">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2.5">
                {component.overview.responsibilities.map((resp, i) => (
                  <motion.li
                    key={i}
                    custom={i + 2}
                    variants={staggerItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <span>{resp}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics + Input/Output */}
        <motion.div custom={2} variants={staggerItemVariants} initial="hidden" animate="visible" className="space-y-4">
          {/* Key Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {component.overview.keyMetrics.map((metric, i) => (
                  <motion.div
                    key={i}
                    custom={i + 3}
                    variants={staggerItemVariants}
                    initial="hidden"
                    animate="visible"
                    className={`rounded-lg p-3 ${colors.light} border ${colors.border}`}
                  >
                    <div className="text-xs text-muted-foreground mb-0.5">{metric.label}</div>
                    <div className={`font-semibold text-sm ${colors.text}`}>{metric.value}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input/Output Flow */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Box className="w-4 h-4 text-sky-500" />
                Data Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">Input</span>
                </div>
                <p className="text-sm pl-5.5 text-muted-foreground">{component.overview.input}</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 rotate-180" />
                  <span className="text-xs font-medium text-muted-foreground">Output</span>
                </div>
                <p className="text-sm pl-5.5 text-muted-foreground">{component.overview.output}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// Files Tab Content
// ============================================================================

function FilesTabContent({ component }: { component: ArchitectureComponentDetail }) {
  const grouped = component.files.reduce<Record<string, typeof component.files>>((acc, file) => {
    if (!acc[file.type]) acc[file.type] = [];
    acc[file.type].push(file);
    return acc;
  }, {});

  const typeOrder: string[] = ['source', 'config', 'test', 'script', 'doc'];

  return (
    <div className="space-y-5">
      {typeOrder
        .filter((t) => grouped[t]?.length)
        .map((type, groupIdx) => {
          const files = grouped[type];
          const cfg = fileTypeConfig[type];
          const TypeIcon = cfg.icon;

          return (
            <motion.div
              key={type}
              custom={groupIdx}
              variants={staggerItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
                    {cfg.label} Files
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {files.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5">
                    {files.map((file, i) => (
                      <motion.li
                        key={file.path}
                        custom={groupIdx * 10 + i}
                        variants={staggerItemVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-start gap-3 py-1.5"
                      >
                        <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
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
          );
        })}
    </div>
  );
}

// ============================================================================
// Configuration Tab Content
// ============================================================================

function ConfigurationTabContent({ component }: { component: ArchitectureComponentDetail }) {
  const colors = colorMap[component.colorScheme.primary] ?? colorMap.emerald;

  return (
    <div className="space-y-5">
      {/* Docker Service & Port */}
      <motion.div custom={0} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className={`shadow-sm border ${colors.border}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className={`w-4 h-4 ${colors.text}`} />
              Service Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Docker Service</div>
                <code className={`text-sm font-mono font-medium ${colors.text}`}>{component.configuration.dockerService}</code>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Port(s)</div>
                <code className="text-sm font-mono font-medium text-muted-foreground">{component.configuration.port}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Health Check */}
      <motion.div custom={1} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-500" />
              Health Check
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded-md px-3 py-2 block overflow-x-auto">
              {component.configuration.healthCheck}
            </code>
          </CardContent>
        </Card>
      </motion.div>

      {/* Environment Variables */}
      <motion.div custom={2} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-500" />
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
                  {component.configuration.environment.map((env, i) => (
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

      {/* Dependencies */}
      <motion.div custom={3} variants={staggerItemVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-fuchsia-500" />
              Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {component.configuration.dependencies.map((dep) => (
                <Badge key={dep} variant="secondary" className="text-xs font-mono">
                  {dep}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Pipeline Stage Card (used in overview)
// ============================================================================

interface StageCardData {
  component: ArchitectureComponentDetail;
  onClick: () => void;
}

function StageCard({ component, onClick }: StageCardData) {
  const colors = colorMap[component.colorScheme.primary] ?? colorMap.emerald;

  return (
    <Card
      className={`
        w-52 rounded-xl border ${colors.border} shadow-md cursor-pointer
        hover:shadow-xl hover:scale-[1.04] active:scale-[0.98]
        transition-all duration-300 ease-out py-5
        group relative overflow-hidden
      `}
      onClick={onClick}
    >
      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl scale-110
          ${colors.bg}
        `}
        style={{ opacity: 0 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.15'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
      />
      <CardContent className="flex flex-col items-center text-center gap-3 p-4">
        <div
          className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center ${colors.text} group-hover:scale-110 transition-transform duration-300`}
        >
          <DynamicIcon name={component.icon} className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-sm group-hover:text-foreground transition-colors">{component.title}</h3>
        <p className="text-xs text-muted-foreground leading-snug">{component.subtitle}</p>
        <Badge variant="outline" className={`text-[10px] ${colors.text} ${colors.border}`}>
          Stage {component.stageNumber}
        </Badge>
      </CardContent>
    </Card>
  );
}

function StageCardMobile({ component, onClick }: StageCardData) {
  const colors = colorMap[component.colorScheme.primary] ?? colorMap.emerald;

  return (
    <Card
      className={`
        rounded-xl border ${colors.border} shadow-md cursor-pointer
        hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]
        transition-all duration-300 ease-out py-5 w-full max-w-sm
        group
      `}
      onClick={onClick}
    >
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={`w-11 h-11 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 ${colors.text} group-hover:scale-110 transition-transform duration-300`}
        >
          <DynamicIcon name={component.icon} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{component.title}</h3>
          <p className="text-xs text-muted-foreground leading-snug mb-2">{component.subtitle}</p>
          <Badge variant="outline" className={`text-[10px] ${colors.text} ${colors.border}`}>
            Stage {component.stageNumber}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Detail View Component
// ============================================================================

function DetailView({
  component,
  currentIndex,
  total,
  onBack,
  onPrev,
  onNext,
}: {
  component: ArchitectureComponentDetail;
  currentIndex: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const colors = colorMap[component.colorScheme.primary] ?? colorMap.emerald;

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
          <div className={`w-6 h-6 rounded-md ${colors.bg} flex items-center justify-center ${colors.text}`}>
            <DynamicIcon name={component.icon} className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">System Architecture</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">{component.title}</span>
        </div>
      </div>

      {/* Component Title */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
          <DynamicIcon name={component.icon} className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold">{component.title}</h3>
          <p className="text-sm text-muted-foreground">{component.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTabContent component={component} />
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <div className="space-y-8">
            {component.codeExamples.map((example, idx) => (
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

        <TabsContent value="files" className="mt-4">
          <FilesTabContent component={component} />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <ConfigurationTabContent component={component} />
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
          {currentIndex > 0 ? architectureComponentDetails[currentIndex - 1]?.title : 'Previous'}
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
          {currentIndex < total - 1 ? architectureComponentDetails[currentIndex + 1]?.title : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Architecture Component
// ============================================================================

export default function Architecture() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const components = architectureComponentDetails;
  const currentIndex = components.findIndex((c) => c.id === selectedId);
  const selectedComponent = currentIndex >= 0 ? components[currentIndex] : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedId(components[currentIndex - 1]?.id ?? null);
    }
  }, [currentIndex, components]);

  const handleNext = useCallback(() => {
    if (currentIndex < components.length - 1) {
      setSelectedId(components[currentIndex + 1]?.id ?? null);
    }
  }, [currentIndex, components]);

  return (
    <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8">
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
            System Architecture
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {selectedComponent
              ? 'Explore component details, code examples, and configuration'
              : 'End-to-end data flow from ingestion to visualization'}
          </p>
          {!selectedComponent && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground/70 mt-2 flex items-center justify-center gap-1.5"
            >
              <span>Click any component to explore</span>
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
            {!selectedComponent ? (
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
                  {/* Desktop horizontal flow */}
                  <div className="hidden lg:block overflow-x-auto pb-4">
                    <div className="flex items-center justify-center gap-2 min-w-max px-4">
                      {components.map((comp, idx) => (
                        <div key={comp.id} className="flex items-center gap-2">
                          <motion.div variants={itemVariants}>
                            <StageCard
                              component={comp}
                              onClick={() => handleSelect(comp.id)}
                            />
                          </motion.div>
                          {idx < components.length - 1 && (
                            <motion.div variants={arrowVariants} className="flex-shrink-0 text-muted-foreground">
                              <ChevronRight className="w-5 h-5 animate-pulse" />
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile / tablet vertical flow */}
                  <div className="lg:hidden flex flex-col items-center gap-3">
                    {components.map((comp, idx) => (
                      <div key={comp.id} className="flex flex-col items-center gap-2">
                        <motion.div variants={itemVariants} className="w-full max-w-sm">
                          <StageCardMobile
                            component={comp}
                            onClick={() => handleSelect(comp.id)}
                          />
                        </motion.div>
                        {idx < components.length - 1 && (
                          <motion.div variants={arrowVariants} className="text-muted-foreground">
                            <ArrowDown className="w-5 h-5 animate-pulse" />
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Data Layers Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-16"
                >
                  <h3 className="text-xl font-semibold text-center mb-8">Data Layers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
                    {[
                      {
                        icon: Layers,
                        label: 'Bronze Layer',
                        desc: 'Raw data as-is (CSV)',
                        color: 'text-orange-600',
                        bg: 'bg-orange-100 dark:bg-orange-950/40',
                        border: 'border-orange-200 dark:border-orange-800',
                      },
                      {
                        icon: Shield,
                        label: 'Silver Layer',
                        desc: 'Cleaned & validated (Parquet)',
                        color: 'text-fuchsia-600',
                        bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/40',
                        border: 'border-fuchsia-200 dark:border-fuchsia-800',
                      },
                      {
                        icon: Trophy,
                        label: 'Gold Layer',
                        desc: 'Business-ready aggregates (Star Schema)',
                        color: 'text-amber-600',
                        bg: 'bg-amber-100 dark:bg-amber-950/40',
                        border: 'border-amber-200 dark:border-amber-800',
                      },
                    ].map((layer) => (
                      <Card
                        key={layer.label}
                        className={`rounded-xl border ${layer.border} shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <CardContent className="flex flex-col items-center text-center gap-3 p-5">
                          <div className={`w-12 h-12 rounded-full ${layer.bg} flex items-center justify-center ${layer.color}`}>
                            <layer.icon className="w-6 h-6" />
                          </div>
                          <h4 className="font-semibold">{layer.label}</h4>
                          <p className="text-sm text-muted-foreground">{layer.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : selectedComponent ? (
              /* Detail Mode */
              <motion.div
                key={`detail-${selectedId}`}
                className="max-w-5xl mx-auto"
              >
                <DetailView
                  component={selectedComponent}
                  currentIndex={currentIndex}
                  total={components.length}
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

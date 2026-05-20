'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container, FileCode, Terminal, Network, HardDrive, Database,
  Play, CheckCircle2, Copy, Check, ChevronDown, ChevronRight,
  Server, Settings, GitBranch, RefreshCw, Package,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const dockerServices = [
  {
    name: 'fastapi-ingestion',
    image: 'python:3.11-slim',
    port: '8000',
    status: 'running',
    health: '/health',
    memory: '512MB',
    cpu: '0.5',
    network: 'ingestion-net',
    dependsOn: ['minio-bronze'],
    volumes: ['./app/api:/app', './data:/data'],
    envVars: [
      { key: 'MINIO_ENDPOINT', value: 'minio-bronze:9000' },
      { key: 'MINIO_ACCESS_KEY', value: '${MINIO_ACCESS_KEY}' },
      { key: 'MINIO_SECRET_KEY', value: '${MINIO_SECRET_KEY}' },
      { key: 'PYTHONDONTWRITEBYTECODE', value: '1' },
    ],
    description: 'REST API for clickstream data ingestion with Pydantic validation',
    buildContext: './services/api',
  },
  {
    name: 'minio-bronze',
    image: 'minio/minio:latest',
    port: '9000/9001',
    status: 'running',
    health: '/minio/health/live',
    memory: '256MB',
    cpu: '0.25',
    network: 'ingestion-net, processing-net',
    dependsOn: [],
    volumes: ['bronze-data:/data', './config/minio:/etc/minio'],
    envVars: [
      { key: 'MINIO_ROOT_USER', value: '${MINIO_ACCESS_KEY}' },
      { key: 'MINIO_ROOT_PASSWORD', value: '${MINIO_SECRET_KEY}' },
      { key: 'MINIO_BROWSER', value: 'on' },
    ],
    description: 'Bronze data lake — raw ingested CSV/JSON landing zone',
    buildContext: null,
  },
  {
    name: 'spark-processing',
    image: 'bitnami/spark:3.5',
    port: '4040',
    status: 'running',
    health: null,
    memory: '2GB',
    cpu: '1.0',
    network: 'processing-net',
    dependsOn: ['minio-bronze', 'minio-silver'],
    volumes: ['./jobs/spark:/opt/bitnami/spark/jobs', './config/spark:/opt/bitnami/spark/conf'],
    envVars: [
      { key: 'SPARK_MODE', value: 'master' },
      { key: 'SPARK_DRIVER_MEMORY', value: '1G' },
      { key: 'SPARK_EXECUTOR_MEMORY', value: '1G' },
    ],
    description: 'Distributed data processing — clean, deduplicate, validate',
    buildContext: null,
  },
  {
    name: 'minio-silver',
    image: 'minio/minio:latest',
    port: '9002/9003',
    status: 'running',
    health: '/minio/health/live',
    memory: '256MB',
    cpu: '0.25',
    network: 'processing-net, transform-net',
    dependsOn: [],
    volumes: ['silver-data:/data'],
    envVars: [
      { key: 'MINIO_ROOT_USER', value: '${MINIO_ACCESS_KEY}' },
      { key: 'MINIO_ROOT_PASSWORD', value: '${MINIO_SECRET_KEY}' },
    ],
    description: 'Silver data lake — cleaned Parquet files ready for transformation',
    buildContext: null,
  },
  {
    name: 'dbt-transform',
    image: 'python:3.11-slim',
    port: null,
    status: 'running',
    health: null,
    memory: '1GB',
    cpu: '0.5',
    network: 'transform-net, serving-net',
    dependsOn: ['minio-silver', 'postgres-warehouse'],
    volumes: ['./transform/dbt:/dbt', './config/dbt:/root/.dbt'],
    envVars: [
      { key: 'POSTGRES_HOST', value: 'postgres-warehouse' },
      { key: 'POSTGRES_PORT', value: '5432' },
      { key: 'POSTGRES_USER', value: '${POSTGRES_USER}' },
      { key: 'POSTGRES_PASSWORD', value: '${POSTGRES_PASSWORD}' },
    ],
    description: 'SQL-based transformation — staging, intermediate, and mart models',
    buildContext: './transform/dbt',
  },
  {
    name: 'postgres-warehouse',
    image: 'postgres:16-alpine',
    port: '5432',
    status: 'running',
    health: 'pg_isready',
    memory: '1GB',
    cpu: '0.5',
    network: 'serving-net',
    dependsOn: [],
    volumes: ['warehouse-data:/var/lib/postgresql/data', './init.sql:/docker-entrypoint-initdb.d'],
    envVars: [
      { key: 'POSTGRES_USER', value: '${POSTGRES_USER}' },
      { key: 'POSTGRES_PASSWORD', value: '${POSTGRES_PASSWORD}' },
      { key: 'POSTGRES_DB', value: 'clickstream_warehouse' },
    ],
    description: 'Gold layer — star schema warehouse with materialized views',
    buildContext: null,
  },
  {
    name: 'metabase',
    image: 'metabase/metabase:latest',
    port: '3000',
    status: 'running',
    health: '/api/health',
    memory: '1GB',
    cpu: '0.5',
    network: 'serving-net',
    dependsOn: ['postgres-warehouse'],
    volumes: ['metabase-data:/metabase-data'],
    envVars: [
      { key: 'MB_DB_FILE', value: '/metabase-data/metabase.db' },
      { key: 'MB_JETTY_PORT', value: '3000' },
    ],
    description: 'Business intelligence dashboards for analytics visualization',
    buildContext: null,
  },
  {
    name: 'airflow-scheduler',
    image: 'apache/airflow:2.8.0-python3.11',
    port: '8080',
    status: 'running',
    health: '/health',
    memory: '1GB',
    cpu: '0.5',
    network: 'processing-net, transform-net, serving-net',
    dependsOn: ['postgres-warehouse'],
    volumes: ['./dags:/opt/airflow/dags', './plugins:/opt/airflow/plugins', 'airflow-data:/opt/airflow'],
    envVars: [
      { key: 'AIRFLOW__CORE__EXECUTOR', value: 'LocalExecutor' },
      { key: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN', value: 'postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-warehouse/airflow' },
    ],
    description: 'Workflow orchestration — scheduled DAGs for ETL pipeline',
    buildContext: null,
  },
];

const dockerComposeSnippet = `version: "3.8"

networks:
  ingestion-net:
    driver: bridge
  processing-net:
    driver: bridge
  transform-net:
    driver: bridge
  serving-net:
    driver: bridge

volumes:
  bronze-data:
  silver-data:
  warehouse-data:
  metabase-data:
  airflow-data:

services:
  fastapi-ingestion:
    build: ./services/api
    container_name: fastapi-ingestion
    restart: unless-stopped
    ports:
      - "8000:8000"
    networks:
      - ingestion-net
    env_file: .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      minio-bronze:
        condition: service_healthy

  postgres-warehouse:
    image: postgres:16-alpine
    container_name: postgres-warehouse
    restart: unless-stopped
    ports:
      - "5432:5432"
    networks:
      - serving-net
    volumes:
      - warehouse-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    env_file: .env
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5`;

const dockerFileSnippet = `# Multi-stage Dockerfile for FastAPI Ingestion Service
FROM python:3.11-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim

COPY --from=builder /install /usr/local
WORKDIR /app

COPY app/ ./app/
COPY config/ ./config/

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`;

const reproducibilitySteps = [
  { step: 1, title: 'Clone Repository', cmd: 'git clone https://github.com/user/clickstream-pipeline.git && cd clickstream-pipeline', icon: GitBranch },
  { step: 2, title: 'Configure Environment', cmd: 'cp .env.example .env && nano .env  # Set your credentials', icon: Settings },
  { step: 3, title: 'Build Images', cmd: 'docker compose build  # Build custom images (FastAPI, dbt)', icon: Package },
  { step: 4, title: 'Start All Services', cmd: 'docker compose up -d  # Start 8 services across 4 networks', icon: Play },
  { step: 5, title: 'Verify Health', cmd: 'docker compose ps  # All services should show "healthy"', icon: CheckCircle2 },
  { step: 6, title: 'Run Ingestion', cmd: 'docker compose exec fastapi-ingestion python -m app.ingest sample_data.csv', icon: RefreshCw },
  { step: 7, title: 'Trigger Pipeline', cmd: 'docker compose exec airflow-scheduler airflow dags trigger clickstream_etl', icon: Play },
  { step: 8, title: 'Access Dashboard', cmd: 'open http://localhost:3000  # Metabase dashboard ready', icon: Database },
];

function CodeBlock({ code, language = 'yaml' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-slate-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono bg-white/5 text-slate-400 border-0">
            {language}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-slate-400 hover:text-white hover:bg-white/10"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar text-xs font-mono text-slate-300 leading-relaxed max-h-80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function IaCDockerShowcase() {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const totalMemory = dockerServices.reduce((sum, s) => {
    const gb = parseFloat(s.memory) / 1024;
    return sum + gb;
  }, 0);

  return (
    <section id="iac" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-teal-400 border-teal-500/30">
            <Container className="h-3 w-3 mr-1.5" />
            University Requirement
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Infrastructure as Code
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Fully reproducible Docker-based data pipeline — transferable and executable
            on any machine using containerized microservices
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: 'Docker Services', value: '8', sub: 'Microservices', color: 'text-emerald-400' },
            { label: 'Isolated Networks', value: '4', sub: 'Bridge Networks', color: 'text-teal-400' },
            { label: 'Total Memory', value: `${totalMemory.toFixed(1)}GB`, sub: 'Allocated', color: 'text-amber-400' },
            { label: 'File Count', value: '97', sub: 'Pipeline Files', color: 'text-cyan-400' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border border-border/50">
              <CardContent className="p-4 text-center">
                <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                <p className="text-xs font-medium text-foreground mt-1">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Tabs: Overview / Docker Compose / Dockerfile / Reproduce */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Service Architecture</TabsTrigger>
            <TabsTrigger value="compose" className="text-xs sm:text-sm">Docker Compose</TabsTrigger>
            <TabsTrigger value="dockerfile" className="text-xs sm:text-sm">Dockerfile</TabsTrigger>
            <TabsTrigger value="reproduce" className="text-xs sm:text-sm">Quick Start</TabsTrigger>
          </TabsList>

          {/* Tab 1: Service Architecture */}
          <TabsContent value="overview" className="mt-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dockerServices.map((service, i) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={cn(
                      'border cursor-pointer transition-all duration-200',
                      expandedService === service.name
                        ? 'border-teal-500/50 shadow-md'
                        : 'border-border/50 hover:border-border',
                    )}
                    onClick={() => setExpandedService(expandedService === service.name ? null : service.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
                          service.status === 'running'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400',
                        )}>
                          <Container className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold truncate">{service.name}</span>
                            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                              {service.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{service.description}</p>
                        </div>
                        <ChevronRight className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
                          expandedService === service.name && 'rotate-90',
                        )} />
                      </div>

                      {/* Quick stats */}
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                        {service.port && (
                          <span className="flex items-center gap-1">
                            <Network className="h-3 w-3" />
                            :{service.port}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {service.memory}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {service.cpu} CPU
                        </span>
                        <Badge variant="secondary" className="text-[9px] bg-muted/50 ml-auto">
                          {service.network}
                        </Badge>
                      </div>
                    </CardContent>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedService === service.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3">
                            {/* Env Vars */}
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Environment Variables
                              </p>
                              <div className="space-y-1">
                                {service.envVars.map((env) => (
                                  <div key={env.key} className="flex items-center gap-2 text-[11px] font-mono">
                                    <span className="text-amber-400">{env.key}</span>
                                    <span className="text-muted-foreground">=</span>
                                    <span className={env.value.startsWith('${') ? 'text-rose-400' : 'text-emerald-400'}>
                                      {env.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Volumes & Dependencies */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                  Volumes
                                </p>
                                {service.volumes.map((v, idx) => (
                                  <p key={idx} className="text-[11px] font-mono text-muted-foreground">{v}</p>
                                ))}
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                  Depends On
                                </p>
                                {service.dependsOn.length > 0 ? (
                                  service.dependsOn.map((d) => (
                                    <p key={d} className="text-[11px] font-mono text-cyan-400">{d}</p>
                                  ))
                                ) : (
                                  <p className="text-[11px] text-muted-foreground">None (root service)</p>
                                )}
                              </div>
                            </div>
                            {/* Health Check */}
                            {service.health && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-[11px] font-mono text-muted-foreground">
                                  Health check: <span className="text-emerald-400">{service.health}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Tab 2: Docker Compose */}
          <TabsContent value="compose" className="mt-0">
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-teal-400" />
                  docker-compose.yml
                </CardTitle>
                <CardDescription>
                  Orchestration file defining all 8 services across 4 isolated networks with 5 persistent volumes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={dockerComposeSnippet} language="yaml" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Dockerfile */}
          <TabsContent value="dockerfile" className="mt-0">
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-400" />
                  Dockerfile (FastAPI)
                </CardTitle>
                <CardDescription>
                  Multi-stage build pattern — minimal final image with only runtime dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={dockerFileSnippet} language="dockerfile" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Quick Start / Reproduce */}
          <TabsContent value="reproduce" className="mt-0">
            <Card className="border border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  Reproduce on Any Machine
                </CardTitle>
                <CardDescription>
                  Complete 8-step guide to deploy the entire pipeline from zero to dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reproducibilitySteps.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 flex-shrink-0 text-xs font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <step.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{step.title}</span>
                        </div>
                        <code className="block text-xs font-mono text-emerald-400 bg-slate-950 rounded-md px-3 py-2 overflow-x-auto">
                          {step.cmd}
                        </code>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium">
                    ✓ Prerequisites: Docker 24+, Docker Compose v2+, Git, 8GB RAM minimum
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total setup time: ~5 minutes on a modern machine with decent internet
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

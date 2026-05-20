'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Upload, HardDrive, Zap, GitBranch, Database,
  BarChart3, CalendarClock, ArrowRight, ArrowLeft,
  CheckCircle2, AlertTriangle, Shield, MessageSquare,
  Globe, Lock, FileText, Server, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServiceNode {
  id: string;
  name: string;
  icon: typeof Network;
  color: string;
  role: string;
  network: string;
  ports: string[];
  protocol: string;
  description: string;
}

interface Connection {
  from: string;
  to: string;
  protocol: string;
  dataFormat: string;
  description: string;
  encrypted: boolean;
}

const services: ServiceNode[] = [
  { id: 'fastapi', name: 'FastAPI', icon: Upload, color: 'emerald', role: 'Ingestion', network: 'ingestion-net', ports: ['8000'], protocol: 'HTTP/REST', description: 'REST API for clickstream data ingestion with Pydantic validation and bulk upload support' },
  { id: 'minio-bronze', name: 'MinIO Bronze', icon: HardDrive, color: 'rose', role: 'Raw Storage', network: 'ingestion-net, processing-net', ports: ['9000', '9001'], protocol: 'S3 API', description: 'Bronze data lake — raw CSV/JSON files landing zone with 90-day lifecycle policy' },
  { id: 'spark', name: 'Spark', icon: Zap, color: 'orange', role: 'Processing', network: 'processing-net', ports: ['4040', '8081'], protocol: 'Thrift/RPC', description: 'Distributed data processing engine — cleaning, deduplication, validation, sessionization' },
  { id: 'minio-silver', name: 'MinIO Silver', icon: HardDrive, color: 'fuchsia', role: 'Clean Storage', network: 'processing-net, transform-net', ports: ['9002', '9003'], protocol: 'S3 API', description: 'Silver data lake — cleaned Parquet files partitioned by date, ready for transformation' },
  { id: 'dbt', name: 'dbt', icon: GitBranch, color: 'sky', role: 'Transform', network: 'transform-net, serving-net', ports: [], protocol: 'CLI', description: 'SQL-based transformation engine — staging, intermediate, and mart models with tests' },
  { id: 'postgres', name: 'PostgreSQL', icon: Database, color: 'amber', role: 'Warehouse', network: 'serving-net', ports: ['5432'], protocol: 'PostgreSQL Wire', description: 'Gold layer — star schema data warehouse with materialized views and RLS policies' },
  { id: 'metabase', name: 'Metabase', icon: BarChart3, color: 'cyan', role: 'Visualization', network: 'serving-net', ports: ['3000'], protocol: 'HTTP', description: 'Business intelligence dashboards for analytics, reporting, and ad-hoc queries' },
  { id: 'airflow', name: 'Airflow', icon: CalendarClock, color: 'teal', role: 'Orchestration', network: 'processing-net, transform-net, serving-net', ports: ['8080'], protocol: 'HTTP', description: 'Workflow orchestrator — scheduled DAGs coordinating the entire ETL pipeline' },
];

const connections: Connection[] = [
  { from: 'fastapi', to: 'minio-bronze', protocol: 'S3 API (HTTPS)', dataFormat: 'CSV / JSON', description: 'Validated clickstream events uploaded as raw files to Bronze bucket', encrypted: true },
  { from: 'minio-bronze', to: 'spark', protocol: 'S3 API (HTTPS)', dataFormat: 'CSV / JSON', description: 'Spark reads raw files from Bronze for cleaning and validation', encrypted: true },
  { from: 'spark', to: 'minio-silver', protocol: 'S3 API (HTTPS)', dataFormat: 'Parquet', description: 'Spark writes cleaned, validated data as partitioned Parquet to Silver', encrypted: true },
  { from: 'minio-silver', to: 'dbt', protocol: 'S3 API (HTTPS)', dataFormat: 'Parquet → SQL', description: 'dbt reads Parquet via DuckDB/spark-connector for SQL transformation', encrypted: true },
  { from: 'dbt', to: 'postgres', protocol: 'PostgreSQL (SSL)', dataFormat: 'SQL (INSERT/UPSERT)', description: 'dbt loads transformed data into star schema tables in PostgreSQL', encrypted: true },
  { from: 'postgres', to: 'metabase', protocol: 'JDBC (SSL)', dataFormat: 'SQL queries', description: 'Metabase runs analytical SQL queries against the Gold warehouse layer', encrypted: true },
  { from: 'airflow', to: 'spark', protocol: 'HTTP API', dataFormat: 'DAG triggers', description: 'Airflow triggers Spark jobs via REST API on schedule (daily/quarterly)', encrypted: true },
  { from: 'airflow', to: 'dbt', protocol: 'CLI subprocess', dataFormat: 'CLI execution', description: 'Airflow runs dbt models as BashOperator tasks in the DAG', encrypted: false },
  { from: 'postgres', to: 'airflow', protocol: 'PostgreSQL (SSL)', dataFormat: 'Metadata queries', description: 'Airflow stores DAG metadata, task state, and logs in shared PostgreSQL instance', encrypted: true },
];

const dockerNetworks = [
  { name: 'ingestion-net', services: ['FastAPI', 'MinIO Bronze'], color: 'emerald', description: 'Isolated network for data ingestion — only API and raw storage communicate here' },
  { name: 'processing-net', services: ['MinIO Bronze', 'Spark', 'MinIO Silver', 'Airflow'], color: 'orange', description: 'Processing network — Spark reads/writes between Bronze and Silver layers' },
  { name: 'transform-net', services: ['MinIO Silver', 'dbt', 'Airflow'], color: 'sky', description: 'Transform network — dbt reads from Silver and writes to PostgreSQL' },
  { name: 'serving-net', services: ['dbt', 'PostgreSQL', 'Metabase', 'Airflow'], color: 'cyan', description: 'Serving network — dashboards query the warehouse, orchestration coordinates all' },
];

function ServiceCard({ service, isSelected, onClick }: {
  service: ServiceNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = service.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 border',
          isSelected
            ? 'ring-2 ring-emerald-500/40 shadow-lg border-emerald-500/50'
            : 'border-border/50 hover:shadow-md hover:border-border',
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', `bg-${service.color}-500/10 text-${service.color}-400`)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{service.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="text-[9px]">{service.role}</Badge>
                <Badge variant="outline" className="text-[9px]">{service.protocol}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Server className="h-3 w-3" />
            {service.network.split(',').map((n) => (
              <Badge key={n.trim()} variant="outline" className="text-[8px] font-mono">{n.trim()}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConnectionBadge({ connection }: { connection: Connection }) {
  return (
    <div className={cn(
      'flex items-center gap-2 p-2.5 rounded-lg border text-[11px] transition-colors',
      connection.encrypted
        ? 'bg-emerald-500/5 border-emerald-500/20'
        : 'bg-amber-500/5 border-amber-500/20',
    )}>
      {connection.encrypted ? (
        <Lock className="h-3 w-3 text-emerald-400 flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-medium text-foreground">{services.find(s => s.id === connection.from)?.name}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-foreground">{services.find(s => s.id === connection.to)?.name}</span>
          <Badge variant="outline" className="text-[8px] ml-auto flex-shrink-0">{connection.dataFormat}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{connection.description}</p>
      </div>
    </div>
  );
}

export default function MicroservicesMap() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const upstreamConnections = connections.filter(c => c.to === selectedService);
  const downstreamConnections = connections.filter(c => c.from === selectedService);
  const relatedServices = new Set<string>();
  upstreamConnections.forEach(c => relatedServices.add(c.from));
  downstreamConnections.forEach(c => relatedServices.add(c.to));
  if (selectedService) relatedServices.add(selectedService);

  return (
    <section id="microservices" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-cyan-400 border-cyan-500/30">
            <Network className="h-3 w-3 mr-1.5" />
            University Requirement
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Microservices Communication
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            How the 8 isolated Docker microservices communicate through defined protocols,
            data contracts, and network boundaries
          </p>
        </motion.div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedService === service.id}
              onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
            />
          ))}
        </div>

        {/* Selected Service Detail */}
        <AnimatePresence>
          {selectedService && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <Card className="border border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const svc = services.find(s => s.id === selectedService);
                      if (!svc) return null;
                      const Icon = svc.icon;
                      return (
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', `bg-${svc.color}-500/10 text-${svc.color}-400`)}>
                          <Icon className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <div>
                      <CardTitle className="text-base">
                        {services.find(s => s.id === selectedService)?.name}
                      </CardTitle>
                      <CardDescription>{services.find(s => s.id === selectedService)?.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upstream */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ArrowLeft className="h-3 w-3" />
                      Upstream (receives from)
                    </h4>
                    {upstreamConnections.length > 0 ? (
                      <div className="space-y-2">
                        {upstreamConnections.map((conn, i) => (
                          <ConnectionBadge key={i} connection={conn} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Root service — no upstream dependencies</p>
                    )}
                  </div>

                  {/* Downstream */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3" />
                      Downstream (sends to)
                    </h4>
                    {downstreamConnections.length > 0 ? (
                      <div className="space-y-2">
                        {downstreamConnections.map((conn, i) => (
                          <ConnectionBadge key={i} connection={conn} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Terminal service — no downstream consumers</p>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/30">
                    {[
                      { label: 'Network', value: services.find(s => s.id === selectedService)?.network },
                      { label: 'Ports', value: services.find(s => s.id === selectedService)?.ports.join(', ') || 'None (CLI only)' },
                      { label: 'Protocol', value: services.find(s => s.id === selectedService)?.protocol },
                      { label: 'Role', value: services.find(s => s.id === selectedService)?.role },
                    ].map((info) => (
                      <div key={info.label} className="p-2 rounded-lg bg-background border border-border/30">
                        <p className="text-[10px] text-muted-foreground">{info.label}</p>
                        <p className="text-[11px] font-mono font-medium mt-0.5">{info.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Connections Table */}
        <Card className="border border-border/50 mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Service Communication Matrix
            </CardTitle>
            <CardDescription>
              All 9 inter-service connections with protocols, data formats, and encryption status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 font-semibold">Source</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Target</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Protocol</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Data Format</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Encrypted</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((conn, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3 font-medium">{services.find(s => s.id === conn.from)?.name}</td>
                      <td className="py-2 px-3 font-medium">{services.find(s => s.id === conn.to)?.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{conn.protocol}</td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-[9px]">{conn.dataFormat}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {conn.encrypted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Docker Network Isolation */}
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Docker Network Isolation
            </CardTitle>
            <CardDescription>
              4 isolated bridge networks enforce service boundaries and limit blast radius
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dockerNetworks.map((net) => (
                <div key={net.name} className="p-4 rounded-xl border border-border/30 bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className={cn('h-4 w-4', `text-${net.color}-400`)} />
                    <h4 className="text-xs font-mono font-semibold">{net.name}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">{net.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {net.services.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-[11px] text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  <strong>Security benefit:</strong> Services on different networks cannot communicate directly.
                  Only MinIO Bronze (shared between ingestion-net and processing-net) and MinIO Silver (shared between
                  processing-net and transform-net) act as controlled bridge points.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

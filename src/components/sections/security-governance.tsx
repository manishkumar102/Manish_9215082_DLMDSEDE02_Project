'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Eye, FileCheck, UserCheck, AlertTriangle,
  Database, HardDrive, Server, Key, Scan, Fingerprint,
  ChevronRight, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const securityLayers = [
  {
    id: 'encryption',
    title: 'Encryption',
    icon: Lock,
    color: 'emerald',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Data encrypted at rest and in transit across all pipeline stages',
    details: {
      atRest: {
        title: 'Encryption at Rest',
        items: [
          { label: 'MinIO Bronze/Silver', detail: 'AES-256-GCM server-side encryption on all Parquet files' },
          { label: 'PostgreSQL Warehouse', detail: 'pgcrypto extension with AES-256 for sensitive columns (user_id, session_id)' },
          { label: 'Docker Volumes', detail: 'LUKS2 encrypted volumes for persistent data directories' },
          { label: 'Backup Archives', detail: 'AES-256 encrypted backup files stored with checksums' },
        ],
      },
      inTransit: {
        title: 'Encryption in Transit',
        items: [
          { label: 'FastAPI → MinIO', detail: 'TLS 1.3 with mTLS mutual authentication for S3 protocol' },
          { label: 'Spark → MinIO', detail: 'HTTPS with certificate pinning for Parquet read/write' },
          { label: 'dbt → PostgreSQL', detail: 'SSL connection with verify-full mode and client certs' },
          { label: 'Metabase → PostgreSQL', detail: 'Encrypted JDBC connection with SSL requirement' },
        ],
      },
    },
  },
  {
    id: 'access-control',
    title: 'Access Control',
    icon: UserCheck,
    color: 'teal',
    colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    description: 'Role-based access control (RBAC) with principle of least privilege',
    details: {
      roles: {
        title: 'RBAC Roles',
        items: [
          { label: 'admin', detail: 'Full system access, Docker management, user provisioning' },
          { label: 'data_engineer', detail: 'Read/write to all data layers, run Spark/dbt jobs, no admin ops' },
          { label: 'analyst', detail: 'Read-only access to Gold layer & Metabase dashboards' },
          { label: 'service_account', detail: 'Automated job execution with scoped API tokens, no interactive access' },
        ],
      },
      policies: {
        title: 'Access Policies',
        items: [
          { label: 'PostgreSQL RLS', detail: 'Row-Level Security policies restrict analysts to their department data only' },
          { label: 'MinIO Bucket Policy', detail: 'IP-based allowlist + signed URLs for time-limited object access' },
          { label: 'API Rate Limiting', detail: 'FastAPI rate limits: 1000 req/min per user, 100 req/min for anonymous' },
          { label: 'Token Rotation', detail: 'JWT tokens expire every 24h, refresh tokens every 7d, auto-revocation on compromise' },
        ],
      },
    },
  },
  {
    id: 'data-governance',
    title: 'Data Governance',
    icon: FileCheck,
    color: 'amber',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'Schema validation, naming conventions, audit trails, and data lineage tracking',
    details: {
      validation: {
        title: 'Schema Validation',
        items: [
          { label: 'Pydantic Models', detail: 'Strict type validation at FastAPI ingestion with field constraints' },
          { label: 'dbt Tests', detail: 'not_null, unique, accepted_values, relationships tests on all models' },
          { label: 'Great Expectations', detail: '12 expectation suites validating data quality at Bronze→Silver transition' },
          { label: 'Custom Checks', detail: 'Timestamp ordering, session duration bounds, event sequence validation' },
        ],
      },
      governance: {
        title: 'Governance Framework',
        items: [
          { label: 'Naming Convention', detail: 'snake_case for all tables/columns, prefixed by layer: raw_, clean_, agg_' },
          { label: 'Data Catalog', detail: 'dbt docs auto-generated data dictionary with column descriptions' },
          { label: 'Lineage Tracking', detail: 'dbt lineage graph + custom metadata tables for source-to-target mapping' },
          { label: 'Change Log', detail: 'Git-based changelog on all schema migrations with approval workflow' },
        ],
      },
    },
  },
  {
    id: 'data-protection',
    title: 'Data Protection',
    icon: Shield,
    color: 'rose',
    colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    description: 'GDPR compliance, PII masking, right-to-erasure, and data retention policies',
    details: {
      gdpr: {
        title: 'GDPR Compliance',
        items: [
          { label: 'PII Detection', detail: 'Automated scanning for email, IP, user-agent patterns in raw data' },
          { label: 'Data Masking', detail: 'user_id hashed (SHA-256), IP addresses anonymized to /24 CIDR, user-agents generalized' },
          { label: 'Right to Erasure', detail: 'Automated deletion pipeline: user_id lookup → cascade delete across all layers' },
          { label: 'Consent Tracking', detail: 'Consent flag column in dim_user, only consent=true events processed' },
        ],
      },
      retention: {
        title: 'Retention Policies',
        items: [
          { label: 'Bronze Layer', detail: '90-day retention, auto-purged via lifecycle policy' },
          { label: 'Silver Layer', detail: '365-day retention, archived to cold storage after 180 days' },
          { label: 'Gold Layer', detail: 'Indefinite retention for aggregated/anonymized analytics data' },
          { label: 'Logs', detail: 'Application logs retained 30 days, audit logs retained 2 years' },
        ],
      },
    },
  },
  {
    id: 'audit-logging',
    title: 'Audit & Monitoring',
    icon: Eye,
    color: 'cyan',
    colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    description: 'Comprehensive audit trails and real-time security monitoring with alerting',
    details: {
      audit: {
        title: 'Audit Trail',
        items: [
          { label: 'Data Access Logs', detail: 'Every query/transform logged with user, timestamp, rows affected, source IP' },
          { label: 'Schema Changes', detail: 'All DDL operations logged with before/after schema diff and approval chain' },
          { label: 'Pipeline Runs', detail: 'Each Spark/dbt job logged: start/end time, rows processed, error details' },
          { label: 'Authentication', detail: 'Login attempts, token issuance/revocation, privilege escalation events' },
        ],
      },
      monitoring: {
        title: 'Security Monitoring',
        items: [
          { label: 'Prometheus Alerts', detail: 'Failed login >5/min, unusual data volume spikes, query timeout bursts' },
          { label: 'Anomaly Detection', detail: 'Statistical anomaly detection on ingestion rates, schema drift alerts' },
          { label: 'Vulnerability Scanning', detail: 'Weekly Trivy scans on all Docker images, auto-block on critical CVEs' },
          { label: 'Compliance Dashboard', detail: 'Real-time compliance score: encryption status, access review, PII scan results' },
        ],
      },
    },
  },
  {
    id: 'network-security',
    title: 'Network Security',
    icon: Fingerprint,
    color: 'fuchsia',
    colorClass: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    description: 'Docker network isolation, firewall rules, and inter-service communication security',
    details: {
      isolation: {
        title: 'Network Isolation',
        items: [
          { label: 'Docker Networks', detail: '3 isolated bridge networks: ingestion, processing, serving — no cross-network traffic' },
          { label: 'Service Firewall', detail: 'Internal iptables rules: each container exposes only required ports' },
          { label: 'DNS Resolution', detail: 'Docker embedded DNS for service discovery, no external DNS queries needed' },
          { label: 'No Internet Access', detail: 'Processing containers have no external internet access (DROP outbound)' },
        ],
      },
      ports: {
        title: 'Port Exposure',
        items: [
          { label: 'FastAPI (8000)', detail: 'Exposed to host only, behind Nginx reverse proxy with WAF rules' },
          { label: 'MinIO (9000/9001)', detail: 'Internal network only, API (9000) + Console (9001) on separate interfaces' },
          { label: 'PostgreSQL (5432)', detail: 'Internal only, SSL required, max_connections=100 with pgbouncer pooling' },
          { label: 'Metabase (3000)', detail: 'Exposed via reverse proxy with SSO integration, no direct host access' },
        ],
      },
    },
  },
];

const complianceScore = [
  { category: 'Encryption', score: 95, icon: Lock },
  { category: 'Access Control', score: 88, icon: UserCheck },
  { category: 'Data Governance', score: 92, icon: FileCheck },
  { category: 'GDPR Compliance', score: 85, icon: Shield },
  { category: 'Audit Logging', score: 90, icon: Eye },
  { category: 'Network Security', score: 87, icon: Fingerprint },
];

function ComplianceRing({ score, size = 72, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? 'text-emerald-400' : score >= 80 ? 'text-amber-400' : 'text-rose-400';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn('transition-all duration-1000', color)}
      />
      <text
        x={size / 2}
        y={size / 2}
        className={cn('fill-current text-sm font-bold', color)}
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {score}%
      </text>
    </svg>
  );
}

function DetailPanel({ layer }: { layer: typeof securityLayers[0] }) {
  const [activeTab, setActiveTab] = useState('tab1');

  const detailKeys = Object.keys(layer.details) as (keyof typeof layer.details)[];
  const tabLabels: Record<string, string> = {
    atRest: 'At Rest',
    inTransit: 'In Transit',
    roles: 'RBAC Roles',
    policies: 'Access Policies',
    validation: 'Schema Validation',
    governance: 'Governance',
    gdpr: 'GDPR',
    retention: 'Retention',
    audit: 'Audit Trail',
    monitoring: 'Monitoring',
    isolation: 'Network Isolation',
    ports: 'Port Exposure',
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={layer.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-border/50 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', layer.colorClass)}>
                <layer.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{layer.title}</CardTitle>
                <CardDescription>{layer.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {detailKeys.map((key, i) => (
                  <TabsTrigger key={key} value={`tab${i + 1}`} className="text-xs">
                    {tabLabels[key] || key}
                  </TabsTrigger>
                ))}
              </TabsList>
              {detailKeys.map((key, i) => (
                <TabsContent key={key} value={`tab${i + 1}`} className="mt-0">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      {layer.details[key].title}
                    </h4>
                    {layer.details[key].items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                      >
                        <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-[11px] font-mono whitespace-nowrap">
                          {item.label}
                        </Badge>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.detail}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default function SecurityGovernance() {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const selected = securityLayers.find((l) => l.id === selectedLayer);

  return (
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 text-emerald-400 border-emerald-500/30">
            <Shield className="h-3 w-3 mr-1.5" />
            University Requirement
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Data Security & Governance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Comprehensive security framework addressing encryption, access control, GDPR compliance,
            audit logging, and network isolation across all pipeline stages
          </p>
        </motion.div>

        {/* Compliance Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <Card className="bg-card border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scan className="h-4 w-4 text-emerald-400" />
                Security Compliance Score
              </CardTitle>
              <CardDescription>
                Overall compliance across 6 security domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {complianceScore.map((item, i) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/30"
                  >
                    <ComplianceRing score={item.score} />
                    <div className="flex items-center gap-1.5">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                        {item.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Layer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {securityLayers.map((layer, i) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-300 border',
                  selectedLayer === layer.id
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'border-border/50 hover:border-border hover:shadow-md',
                )}
                onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl border flex-shrink-0',
                      layer.colorClass,
                    )}>
                      <layer.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{layer.title}</h3>
                        <ChevronRight className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform duration-200',
                          selectedLayer === layer.id && 'rotate-90 text-emerald-400',
                        )} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {layer.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Expanded Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <DetailPanel layer={selected} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Principles Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <Card className="bg-muted/20 border border-border/50">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-400" />
                Core Security Principles Applied
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { principle: 'Defense in Depth', desc: 'Multiple overlapping security layers at every pipeline stage' },
                  { principle: 'Least Privilege', desc: 'Each service and user has minimum required permissions' },
                  { principle: 'Zero Trust', desc: 'All inter-service communication authenticated and encrypted' },
                  { principle: 'Privacy by Design', desc: 'PII protected from ingestion, anonymization built into ETL' },
                ].map((item) => (
                  <div key={item.principle} className="flex items-start gap-2.5 p-3 rounded-lg bg-background border border-border/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{item.principle}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

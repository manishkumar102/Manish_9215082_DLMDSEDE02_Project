'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Search, Eye, EyeOff, Server, FileCode2, Activity,
  Lock, FolderOpen, ArrowUpDown, Layers, Cpu, HardDrive, Wifi,
  Upload, Zap, Database, GitBranch, BarChart3, CalendarClock,
  Shield, MonitorDot,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnvVar {
  key: string;
  value: string;
  description: string;
  secret?: boolean;
}

interface ConfigFile {
  name: string;
  type: 'docker' | 'config' | 'env' | 'code' | 'sql' | 'yaml';
  description: string;
  lines?: number;
}

interface PortInfo {
  port: string;
  protocol: string;
  purpose: string;
}

interface HealthCheck {
  endpoint: string;
  interval: string;
  timeout: string;
  retries: number;
}

interface ResourceLimit {
  resource: string;
  limit: string;
  reservation: string;
}

interface Service {
  id: string;
  name: string;
  icon: typeof Server;
  color: string;
  ports: string;
  description: string;
  envVars: EnvVar[];
  configFiles: ConfigFile[];
  portsInfo: PortInfo[];
  healthCheck?: HealthCheck;
  resourceLimits: ResourceLimit[];
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const services: Service[] = [
  {
    id: 'fastapi',
    name: 'FastAPI Ingestion',
    icon: Upload,
    color: 'teal',
    ports: '8000',
    description: 'REST API service for ingesting clickstream data with Pydantic validation, bulk upload support, and CORS handling.',
    envVars: [
      { key: 'FASTAPI_HOST', value: '0.0.0.0', description: 'Bind address for the FastAPI application server' },
      { key: 'FASTAPI_PORT', value: '8000', description: 'Application listening port', secret: false },
      { key: 'CORS_ORIGINS', value: '["http://localhost:3000","http://localhost:3001"]', description: 'Allowed CORS origins for browser requests' },
      { key: 'LOG_LEVEL', value: 'INFO', description: 'Python logging verbosity (DEBUG/INFO/WARNING/ERROR)' },
      { key: 'WORKERS', value: '4', description: 'Number of Uvicorn worker processes' },
      { key: 'REQUEST_TIMEOUT', value: '30', description: 'Max seconds to wait for a request to complete' },
      { key: 'MAX_UPLOAD_SIZE', value: '10485760', description: 'Maximum file upload size in bytes (10 MB)' },
      { key: 'MINIO_ENDPOINT', value: 'http://minio:9000', description: 'MinIO S3-compatible endpoint for raw data storage' },
      { key: 'MINIO_ACCESS_KEY', value: 'ingestion_service', description: 'Service account for MinIO Bronze bucket access' },
      { key: 'MINIO_SECRET_KEY', value: 's3cr3t-ing3st10n-k3y-x9f2', description: 'Secret key for MinIO service account', secret: true },
      { key: 'MINIO_BUCKET', value: 'bronze-raw', description: 'Target MinIO bucket for raw event data' },
      { key: 'MINIO_SECURE', value: 'false', description: 'Use HTTPS for MinIO connections (false in dev)' },
      { key: 'INGESTION_BATCH_SIZE', value: '1000', description: 'Number of events per batch write to MinIO' },
      { key: 'RATE_LIMIT_PER_MINUTE', value: '1000', description: 'Maximum API requests per minute per IP' },
      { key: 'API_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Bearer token for authenticated API access', secret: true },
      { key: 'ENABLE_SWAGGER', value: 'true', description: 'Enable Swagger UI at /docs endpoint' },
      { key: 'DB_CONNECTION_POOL', value: '10', description: 'Connection pool size for temporary ingestion logging DB' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'Multi-stage build: Python 3.11 slim → pip install → Uvicorn entrypoint', lines: 42 },
      { name: 'requirements.txt', type: 'code', description: 'fastapi, uvicorn[standard], pydantic, boto3, python-dotenv, httpx', lines: 8 },
      { name: '.env.example', type: 'env', description: 'Template environment file with all required variables documented', lines: 18 },
      { name: 'app/main.py', type: 'code', description: 'FastAPI application factory with CORS, routers, and exception handlers', lines: 96 },
      { name: 'alembic.ini', type: 'config', description: 'Database migration configuration for the ingestion metadata DB', lines: 24 },
    ],
    portsInfo: [
      { port: '8000', protocol: 'HTTP/TCP', purpose: 'REST API — ingest, health, Swagger docs' },
      { port: '8000', protocol: 'HTTP', purpose: '/docs — Swagger UI interactive documentation' },
      { port: '8000', protocol: 'HTTP', purpose: '/health — Liveness & readiness probe endpoint' },
    ],
    healthCheck: { endpoint: 'GET /health', interval: '30s', timeout: '5s', retries: 3 },
    resourceLimits: [
      { resource: 'CPU', limit: '1.0', reservation: '0.25' },
      { resource: 'Memory', limit: '512M', reservation: '128M' },
    ],
  },
  {
    id: 'spark-master',
    name: 'Spark Master',
    icon: Zap,
    color: 'orange',
    ports: '7077 / 8080',
    description: 'Apache Spark cluster master node coordinating distributed data processing across worker instances.',
    envVars: [
      { key: 'SPARK_MODE', value: 'master', description: 'Spark deployment mode (master/worker/history)' },
      { key: 'SPARK_MASTER_HOST', value: 'spark-master', description: 'Container hostname resolvable by workers' },
      { key: 'SPARK_MASTER_PORT', value: '7077', description: 'Internal RPC port for worker & driver communication' },
      { key: 'SPARK_MASTER_WEBUI_PORT', value: '8080', description: 'Web UI port for cluster monitoring dashboard' },
      { key: 'SPARK_DAEMON_MEMORY', value: '1g', description: 'JVM heap memory allocated to the master daemon' },
      { key: 'SPARK_WORKER_CORES', value: '4', description: 'Default cores assigned per worker node' },
      { key: 'SPARK_EXECUTOR_MEMORY', value: '2g', description: 'Default memory per executor instance' },
      { key: 'SPARK_DRIVER_MEMORY', value: '1g', description: 'Default memory for the driver program' },
      { key: 'SPARK_EVENTLOG_ENABLED', value: 'true', description: 'Enable Spark event logging to shared storage' },
      { key: 'SPARK_EVENTLOG_DIR', value: '/opt/spark/events', description: 'Directory for event log files (shared volume)' },
      { key: 'SPARK_HISTORY_FS_LOGDIRECTORY', value: '/opt/spark/logs', description: 'History server log directory for completed apps' },
      { key: 'SPARK_LOG_LEVEL', value: 'WARN', description: 'Default log4j2 logging verbosity' },
      { key: 'SPARK_RPC_MESSAGE_MAXSIZE', value: '256', description: 'Max RPC message size in MB' },
      { key: 'SPARK_NETWORK_TIMEOUT', value: '120s', description: 'Default network timeout for all RPC calls' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'OpenJDK 17 slim base with Spark 3.5.0 pre-built for Hadoop 3', lines: 38 },
      { name: 'spark-defaults.conf', type: 'config', description: 'Spark runtime: serializer, shuffle, dynamic allocation, memory fraction', lines: 26 },
      { name: 'log4j2.properties', type: 'config', description: 'Logging configuration — console appender with pattern layout', lines: 32 },
      { name: 'entrypoint.sh', type: 'code', description: 'Shell entrypoint that starts master or worker based on SPARK_MODE', lines: 18 },
    ],
    portsInfo: [
      { port: '7077', protocol: 'TCP/RPC', purpose: 'Spark internal — master↔worker & driver communication' },
      { port: '8080', protocol: 'HTTP', purpose: 'Spark Master Web UI — cluster status, workers, applications' },
    ],
    healthCheck: { endpoint: 'GET /api/v1/applications (8080)', interval: '30s', timeout: '10s', retries: 3 },
    resourceLimits: [
      { resource: 'CPU', limit: '2.0', reservation: '0.5' },
      { resource: 'Memory', limit: '2G', reservation: '512M' },
    ],
  },
  {
    id: 'spark-worker',
    name: 'Spark Worker',
    icon: Cpu,
    color: 'orange',
    ports: '8081',
    description: 'Apache Spark worker node executing distributed data transformation tasks assigned by the master.',
    envVars: [
      { key: 'SPARK_MODE', value: 'worker', description: 'Spark deployment mode for this container' },
      { key: 'SPARK_MASTER_URL', value: 'spark://spark-master:7077', description: 'Master URL this worker registers with' },
      { key: 'SPARK_WORKER_CORES', value: '4', description: 'Number of CPU cores exposed to executors' },
      { key: 'SPARK_WORKER_MEMORY', value: '4g', description: 'Total memory this worker can allocate to executors' },
      { key: 'SPARK_WORKER_WEBUI_PORT', value: '8081', description: 'Worker Web UI for local monitoring' },
      { key: 'SPARK_EXECUTOR_CORES', value: '2', description: 'Cores per executor (2 executors × 2 cores)' },
      { key: 'SPARK_EXECUTOR_MEMORY', value: '2g', description: 'Memory per executor JVM instance' },
      { key: 'SPARK_LOCAL_DIRS', value: '/opt/spark/tmp', description: 'Local scratch directory for shuffle data' },
      { key: 'SPARK_LOG_LEVEL', value: 'WARN', description: 'Worker process logging verbosity' },
      { key: 'SPARK_WORKER_TIMEOUT', value: '60', description: 'Seconds before master considers a worker lost' },
      { key: 'SPARK_SHUFFLE_SERVICE_ENABLED', value: 'true', description: 'Enable external shuffle service for executor reuse' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'Same OpenJDK 17 + Spark 3.5.0 image as master (shared build context)', lines: 38 },
      { name: 'spark-defaults.conf', type: 'config', description: 'Worker-specific: shuffle partitions, memory overhead, serializer', lines: 22 },
      { name: 'log4j2.properties', type: 'config', description: 'Worker logging — console appender with WARN threshold', lines: 30 },
      { name: 'entrypoint.sh', type: 'code', description: 'Entrypoint script: resolves master URL and starts worker daemon', lines: 15 },
    ],
    portsInfo: [
      { port: '8081', protocol: 'HTTP', purpose: 'Spark Worker Web UI — executor status, logs, thread dumps' },
      { port: 'random', protocol: 'TCP', purpose: 'Dynamic port(s) — executor communication (assigned at runtime)' },
    ],
    healthCheck: { endpoint: 'Heartbeat to master (7077)', interval: '15s', timeout: '5s', retries: 3 },
    resourceLimits: [
      { resource: 'CPU', limit: '4.0', reservation: '1.0' },
      { resource: 'Memory', limit: '4G', reservation: '1G' },
    ],
  },
  {
    id: 'minio',
    name: 'MinIO',
    icon: HardDrive,
    color: 'rose',
    ports: '9000 / 9001',
    description: 'High-performance S3-compatible object storage serving as the Bronze and Silver data lake layers.',
    envVars: [
      { key: 'MINIO_ROOT_USER', value: 'admin', description: 'Root administrator username for MinIO' },
      { key: 'MINIO_ROOT_PASSWORD', value: 'Str0ngP@ssw0rd!MinIO2024#xK7m', description: 'Root administrator password (min 8 chars)', secret: true },
      { key: 'MINIO_BROWSER', value: 'on', description: 'Enable the MinIO Console web interface' },
      { key: 'MINIO_SERVER_URL', value: 'http://minio:9000', description: 'Internal server URL accessible within Docker network' },
      { key: 'MINIO_BROWSER_REDIRECT_URL', value: 'http://localhost:9001', description: 'External URL for browser-based console redirects' },
      { key: 'MINIO_VOLUMES', value: '/data', description: 'Storage backend path (single-drive or erasure coding)' },
      { key: 'MINIO_API_PORT', value: '9000', description: 'S3 API listen port for client connections' },
      { key: 'MINIO_CONSOLE_PORT', value: '9001', description: 'Web management console listen port' },
      { key: 'AWS_ACCESS_KEY_ID', value: 'admin', description: 'AWS SDK-compatible access key (mirrors MINIO_ROOT_USER)' },
      { key: 'AWS_SECRET_ACCESS_KEY', value: 'Str0ngP@ssw0rd!MinIO2024#xK7m', description: 'AWS SDK-compatible secret key (mirrors MINIO_ROOT_PASSWORD)', secret: true },
      { key: 'AWS_DEFAULT_REGION', value: 'us-east-1', description: 'Default region for S3 API compatibility' },
      { key: 'MINIO_DOMAIN', value: 'minio', description: 'Domain for virtual-host-style bucket access' },
      { key: 'MINIO_UPDATE', value: 'off', description: 'Disable automatic MinIO version update checks' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'MinIO official image (minio/minio:latest) with health check binary', lines: 12 },
      { name: '.env', type: 'env', description: 'Credentials, ports, and storage path configuration', lines: 14 },
      { name: 'entrypoint.sh', type: 'code', description: 'Bootstraps default buckets (bronze-raw, silver-clean) and IAM policies', lines: 34 },
      { name: 'mc-config.json', type: 'config', description: 'MinIO Client (mc) alias configuration for automated setup', lines: 10 },
    ],
    portsInfo: [
      { port: '9000', protocol: 'HTTP/TCP', purpose: 'S3 API — object PUT/GET/LIST/DELETE operations' },
      { port: '9001', protocol: 'HTTP', purpose: 'MinIO Console — web-based bucket browser & admin UI' },
    ],
    healthCheck: { endpoint: 'GET /minio/health/live & /minio/health/ready', interval: '30s', timeout: '5s', retries: 3 },
    resourceLimits: [
      { resource: 'CPU', limit: '2.0', reservation: '0.5' },
      { resource: 'Memory', limit: '2G', reservation: '512M' },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: Database,
    color: 'amber',
    ports: '5432',
    description: 'Primary relational database serving as the Gold data warehouse (star schema) and Airflow metadata backend.',
    envVars: [
      { key: 'POSTGRES_USER', value: 'analytics_admin', description: 'Superuser username for database administration' },
      { key: 'POSTGRES_PASSWORD', value: 'P0stgr3s!Str0ngAdm1n2024#rT9w', description: 'Superuser password for the analytics admin account', secret: true },
      { key: 'POSTGRES_DB', value: 'data_warehouse', description: 'Default database created at first initialization' },
      { key: 'POSTGRES_PORT', value: '5432', description: 'PostgreSQL listen port inside the container' },
      { key: 'POSTGRES_HOST_AUTH_METHOD', value: 'scram-sha-256', description: 'Password authentication method (SCRAM-SHA-256)' },
      { key: 'PGDATA', value: '/var/lib/postgresql/data/pgdata', description: 'Data directory for PostgreSQL storage engine' },
      { key: 'POSTGRES_MAX_CONNECTIONS', value: '100', description: 'Maximum concurrent database connections' },
      { key: 'POSTGRES_SHARED_BUFFERS', value: '256MB', description: 'Shared memory buffers for query caching' },
      { key: 'POSTGRES_WORK_MEM', value: '16MB', description: 'Memory available per sort/hash operation' },
      { key: 'POSTGRES_EFFECTIVE_CACHE_SIZE', value: '1GB', description: 'Estimate of OS + PostgreSQL disk cache' },
      { key: 'POSTGRES_MAINTENANCE_WORK_MEM', value: '128MB', description: 'Memory for VACUUM, CREATE INDEX operations' },
      { key: 'POSTGRES_LOG_MIN_DURATION', value: '500', description: 'Log queries slower than this many milliseconds' },
      { key: 'POSTGRES_WAL_LEVEL', value: 'logical', description: 'WAL level enabling logical replication for CDC' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'PostgreSQL 16 Alpine image with init scripts and extensions', lines: 18 },
      { name: 'init-db.sql', type: 'sql', description: 'Creates data_warehouse and airflow_db databases with schemas', lines: 86 },
      { name: 'postgresql.conf', type: 'config', description: 'Custom PostgreSQL tuning: connections, WAL, parallelism, autovacuum', lines: 45 },
      { name: 'pg_hba.conf', type: 'config', description: 'Client authentication config: scram-sha-256 for Docker network', lines: 22 },
      { name: '.env', type: 'env', description: 'Credentials and connection parameters for local development', lines: 12 },
    ],
    portsInfo: [
      { port: '5432', protocol: 'TCP', purpose: 'PostgreSQL wire protocol — data warehouse + Airflow metadata' },
    ],
    healthCheck: { endpoint: 'pg_isready -U analytics_admin', interval: '10s', timeout: '5s', retries: 5 },
    resourceLimits: [
      { resource: 'CPU', limit: '2.0', reservation: '0.5' },
      { resource: 'Memory', limit: '2G', reservation: '512M' },
    ],
  },
  {
    id: 'dbt',
    name: 'dbt',
    icon: GitBranch,
    color: 'fuchsia',
    ports: 'CLI only',
    description: 'SQL-based transformation engine running staging, intermediate, and mart models with automated testing.',
    envVars: [
      { key: 'DBT_PROFILES_DIR', value: '/root/.dbt', description: 'Directory containing the profiles.yml connection config' },
      { key: 'DBT_TARGET', value: 'prod', description: 'Active profile target (dev / staging / prod)' },
      { key: 'DBT_MODELS_DIR', value: 'models', description: 'Relative path to the dbt models directory' },
      { key: 'DBT_SEEDS_DIR', value: 'seeds', description: 'Relative path to static CSV seed data files' },
      { key: 'DBT_MACRO_DIR', value: 'macros', description: 'Relative path to reusable Jinja macro definitions' },
      { key: 'DBT_ANALYSIS_DIR', value: 'analyses', description: 'Relative path to one-off SQL analysis queries' },
      { key: 'DBT_TEST_DIR', value: 'tests', description: 'Relative path to custom dbt test definitions' },
      { key: 'DBT_LOG_FORMAT', value: 'text', description: 'Log output format (text / json / pretty)' },
      { key: 'DBT_LOG_LEVEL', value: 'INFO', description: 'dbt process logging verbosity' },
      { key: 'DBT_MAX_THREADS', value: '4', description: 'Maximum concurrent model materialization threads' },
      { key: 'DBT_PRINT_STREAMLINE', value: 'true', description: 'Print model streamline graph in CLI output' },
      { key: 'POSTGRES_HOST', value: 'postgres', description: 'PostgreSQL host for the warehouse connection profile' },
      { key: 'POSTGRES_PORT', value: '5432', description: 'PostgreSQL port for the warehouse connection profile' },
      { key: 'POSTGRES_USER', value: 'dbt_transformer', description: 'Dedicated dbt service account for transformations' },
      { key: 'POSTGRES_PASSWORD', value: 'dbt_Tr4nsf0rm!2024#qW3e', description: 'Password for the dbt transformer service account', secret: true },
    ],
    configFiles: [
      { name: 'dbt_project.yml', type: 'yaml', description: 'Project definition: name, version, model paths, target-path, vars', lines: 52 },
      { name: 'profiles.yml', type: 'yaml', description: 'Connection profiles: PostgreSQL target with host, port, creds, schema', lines: 18 },
      { name: 'packages.yml', type: 'yaml', description: 'dbt package dependencies (dbt-utils, dbt-expectations, etc.)', lines: 12 },
      { name: 'requirements.txt', type: 'code', description: 'Python dependencies: dbt-postgres==1.7.0, agate, Jinja2', lines: 6 },
      { name: 'models/staging/_staging__models.yml', type: 'yaml', description: 'YML tests and column docs for all staging models', lines: 40 },
      { name: 'models/marts/_marts__schema.yml', type: 'yaml', description: 'Star schema table documentation and freshness checks', lines: 34 },
    ],
    portsInfo: [
      { port: 'N/A', protocol: 'CLI', purpose: 'dbt runs as a CLI tool invoked by Airflow BashOperator — no exposed ports' },
    ],
    resourceLimits: [
      { resource: 'CPU', limit: '1.0', reservation: '0.25' },
      { resource: 'Memory', limit: '512M', reservation: '128M' },
    ],
  },
  {
    id: 'airflow-webserver',
    name: 'Airflow Webserver',
    icon: CalendarClock,
    color: 'cyan',
    ports: '8082',
    description: 'Apache Airflow web UI providing DAG visualization, task monitoring, trigger controls, and log inspection.',
    envVars: [
      { key: 'AIRFLOW__CORE__EXECUTOR', value: 'CeleryExecutor', description: 'Executor type for parallel task execution across workers' },
      { key: 'AIRFLOW__CORE__FERNET_KEY', value: 'cF6bM9x2K8pN3vQ7wR5tY1uA4jL0eHsDfGgIiBbZz=', description: 'Fernet symmetric key for encrypted connection credentials', secret: true },
      { key: 'AIRFLOW__CORE__LOAD_EXAMPLES', value: 'False', description: 'Skip loading example DAGs on startup' },
      { key: 'AIRFLOW__CORE__DAGS_FOLDER', value: '/opt/airflow/dags', description: 'Directory path containing DAG Python files' },
      { key: 'AIRFLOW__CORE__DEFAULT_TIMEZONE', value: 'UTC', description: 'Default timezone for DAG scheduling and display' },
      { key: 'AIRFLOW__CORE__PARALLELISM', value: '32', description: 'Max task instances that can run concurrently per scheduler' },
      { key: 'AIRFLOW__WEBSERVER__WEB_SERVER_HOST', value: '0.0.0.0', description: 'Webserver bind address (all interfaces)' },
      { key: 'AIRFLOW__WEBSERVER__WEB_SERVER_PORT', value: '8082', description: 'Webserver HTTP listen port' },
      { key: 'AIRFLOW__WEBSERVER__SECRET_KEY', value: 'w3bs3rv3r-s3cr3t-A1rf10w2024!mN7b', description: 'Flask secret key for session encryption', secret: true },
      { key: 'AIRFLOW__WEBSERVER__EXPOSE_CONFIG', value: 'False', description: 'Hide configuration from the web UI for security' },
      { key: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN', value: 'postgresql://analytics_admin:***@postgres:5432/airflow_db', description: 'SQLAlchemy connection string for Airflow metadata DB', secret: true },
      { key: 'AIRFLOW__API__AUTH_BACKENDS', value: 'airflow.api.auth.backend.basic_auth', description: 'API authentication backend for REST endpoints' },
      { key: 'AIRFLOW__CELERY__BROKER_URL', value: 'redis://redis:6379/0', description: 'Redis broker URL for Celery task queue communication' },
      { key: 'AIRFLOW__CELERY__RESULT_BACKEND', value: 'db+postgresql://analytics_admin:***@postgres:5432/airflow_db', description: 'Celery result backend for task state tracking', secret: true },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'Python 3.11 slim with Airflow 2.8.0, Celery, and provider packages', lines: 48 },
      { name: 'airflow.cfg', type: 'config', description: 'Full Airflow configuration (overridden by env vars in production)', lines: 180 },
      { name: 'requirements.txt', type: 'code', description: 'Airflow extras: celery, postgres, redis, ssh, kubernetes', lines: 10 },
      { name: 'dags/etl_pipeline.py', type: 'code', description: 'Main ETL DAG: ingestion → Spark → dbt → quality checks', lines: 124 },
      { name: 'dags/data_quality.py', type: 'code', description: 'Data quality DAG: schema validation, null checks, freshness', lines: 68 },
      { name: 'plugins/custom_operators.py', type: 'code', description: 'Custom SparkSubmitOperator and MinIO sensor operators', lines: 52 },
    ],
    portsInfo: [
      { port: '8082', protocol: 'HTTP', purpose: 'Airflow Web UI — DAG browser, task logs, trigger controls' },
      { port: '8082', protocol: 'HTTP', purpose: '/api/v1 — Airflow REST API for programmatic DAG management' },
      { port: '8082', protocol: 'HTTP', purpose: '/health — Gunicorn health check endpoint' },
    ],
    healthCheck: { endpoint: 'GET /health', interval: '30s', timeout: '10s', retries: 5 },
    resourceLimits: [
      { resource: 'CPU', limit: '1.0', reservation: '0.25' },
      { resource: 'Memory', limit: '1G', reservation: '256M' },
    ],
  },
  {
    id: 'airflow-scheduler',
    name: 'Airflow Scheduler',
    icon: MonitorDot,
    color: 'cyan',
    ports: 'Background',
    description: 'Background process parsing DAG files, scheduling task instances, and queuing them to Celery for execution.',
    envVars: [
      { key: 'AIRFLOW__SCHEDULER__SCHEDULER_HEARTBEAT_SEC', value: '5', description: 'Seconds between scheduler heartbeat to the DB' },
      { key: 'AIRFLOW__SCHEDULER__CATCHUP_BY_DEFAULT', value: 'False', description: 'Disable automatic backfill for missed DAG runs' },
      { key: 'AIRFLOW__SCHEDULER__MAX_RUNNING_TASKS', value: '16', description: 'Maximum concurrent running task instances' },
      { key: 'AIRFLOW__SCHEDULER__POLL_INTERVAL', value: '10', description: 'Seconds between DAG folder polling for file changes' },
      { key: 'AIRFLOW__SCHEDULER__DAG_DIR_LIST_INTERVAL', value: '30', description: 'Seconds between full directory rescans for new DAGs' },
      { key: 'AIRFLOW__SCHEDULER__PARSING_PROCESSES', value: '2', description: 'Number of parallel DAG file parsing processes' },
      { key: 'AIRFLOW__CORE__EXECUTOR', value: 'CeleryExecutor', description: 'Executor type — must match webserver configuration' },
      { key: 'AIRFLOW__CORE__FERNET_KEY', value: 'cF6bM9x2K8pN3vQ7wR5tY1uA4jL0eHsDfGgIiBbZz=', description: 'Fernet key (must match webserver)', secret: true },
      { key: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN', value: 'postgresql://analytics_admin:***@postgres:5432/airflow_db', description: 'Metadata DB connection (must match webserver)', secret: true },
      { key: 'AIRFLOW__CELERY__BROKER_URL', value: 'redis://redis:6379/0', description: 'Redis broker URL (must match webserver)' },
      { key: 'AIRFLOW__CORE__DAGS_FOLDER', value: '/opt/airflow/dags', description: 'DAGs directory path (must match webserver)' },
      { key: 'AIRFLOW__CORE__LOAD_EXAMPLES', value: 'False', description: 'Skip example DAGs (must match webserver)' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'Same base image as webserver — scheduler command entrypoint override', lines: 48 },
      { name: 'airflow.cfg', type: 'config', description: 'Shared Airflow config with scheduler-specific tuning overrides', lines: 180 },
      { name: 'logs/logging_config.py', type: 'config', description: 'Custom Python logging config for scheduler process logs', lines: 28 },
    ],
    portsInfo: [
      { port: 'N/A', protocol: 'Background', purpose: 'Scheduler runs as a daemon process — no exposed network ports' },
    ],
    resourceLimits: [
      { resource: 'CPU', limit: '1.0', reservation: '0.25' },
      { resource: 'Memory', limit: '1G', reservation: '256M' },
    ],
  },
  {
    id: 'metabase',
    name: 'Metabase',
    icon: BarChart3,
    color: 'emerald',
    ports: '3001',
    description: 'Business intelligence dashboard for exploring the Gold data warehouse, running ad-hoc queries, and sharing reports.',
    envVars: [
      { key: 'MB_DB_HOST', value: 'postgres', description: 'PostgreSQL host for Metabase application metadata' },
      { key: 'MB_DB_PORT', value: '5432', description: 'PostgreSQL port for Metabase metadata DB' },
      { key: 'MB_DB_USER', value: 'metabase_app', description: 'Dedicated PostgreSQL user for Metabase metadata schema' },
      { key: 'MB_DB_PASS', value: 'M3t4b4s3!AppP@ss2024#jK5n', description: 'Password for the Metabase application DB user', secret: true },
      { key: 'MB_DB_NAME', value: 'metabase', description: 'PostgreSQL database name for Metabase configuration' },
      { key: 'MB_JETTY_PORT', value: '3001', description: 'Jetty embedded web server listen port' },
      { key: 'MB_JETTY_HOST', value: '0.0.0.0', description: 'Jetty bind address (accessible from Docker network)' },
      { key: 'MB_ADMIN_EMAIL', value: 'admin@pipeline.local', description: 'Initial admin user email address for setup wizard' },
      { key: 'MB_ADMIN_PASSWORD', value: 'Adm1nM3t4b4s3!2024#pL2m', description: 'Initial admin user password for setup wizard', secret: true },
      { key: 'JAVA_TIMEZONE', value: 'UTC', description: 'JVM timezone for consistent timestamp handling' },
      { key: 'MB_ANON_TRACKING_ENABLED', value: 'false', description: 'Disable anonymous usage analytics to Metabase servers' },
      { key: 'MB_EMOJI_IN_LOGS', value: 'false', description: 'Disable emoji characters in log output' },
      { key: 'MB_SITE_URL', value: 'http://localhost:3001', description: 'Canonical site URL for email links and integrations' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'Metabase official image (metabase/metabase:latest) with env config', lines: 8 },
      { name: 'setup.sh', type: 'code', description: 'Post-setup script: syncs warehouse schema, creates sample dashboards', lines: 26 },
      { name: '.env', type: 'env', description: 'Metabase environment variables for database and admin config', lines: 14 },
      { name: 'metabase.db.migrate.sql', type: 'sql', description: 'Pre-seeds the metabase PostgreSQL schema for faster startup', lines: 18 },
    ],
    portsInfo: [
      { port: '3001', protocol: 'HTTP', purpose: 'Metabase Web UI — dashboards, SQL editor, collections' },
      { port: '3001', protocol: 'HTTP', purpose: '/api/health — Health check for container orchestration' },
    ],
    healthCheck: { endpoint: 'GET /api/health', interval: '30s', timeout: '10s', retries: 3 },
    resourceLimits: [
      { resource: 'CPU', limit: '2.0', reservation: '0.5' },
      { resource: 'Memory', limit: '2G', reservation: '512M' },
    ],
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    icon: Shield,
    color: 'rose',
    ports: '9090',
    description: 'Metrics collection and alerting engine scraping all service endpoints for observability and SLA monitoring.',
    envVars: [
      { key: 'PROMETHEUS_PORT', value: '9090', description: 'HTTP server listen port for UI and API' },
      { key: 'PROMETHEUS_RETENTION_TIME', value: '15d', description: 'Duration to retain time-series data before automatic deletion' },
      { key: 'PROMETHEUS_STORAGE_TSDB_RETENTION_SIZE', value: '10GB', description: 'Maximum on-disk storage for TSDB before oldest data is pruned' },
      { key: 'PROMETHEUS_STORAGE_TSDB_PATH', value: '/prometheus', description: 'Filesystem path for the TSDB data directory' },
      { key: 'PROMETHEUS_CONFIG_FILE', value: '/etc/prometheus/prometheus.yml', description: 'Path to the main Prometheus configuration file' },
      { key: 'PROMETHEUS_WEB_CONSOLE_LIBRARIES', value: '/usr/share/prometheus/console_libraries', description: 'Console template library path for custom UI pages' },
      { key: 'PROMETHEUS_WEB_CONSOLE_TEMPLATES', value: '/usr/share/prometheus/consoles', description: 'Console HTML template directory path' },
      { key: 'PROMETHEUS_WEB_PAGE_TITLE', value: 'Pipeline Prometheus', description: 'Browser tab title for the Prometheus web UI' },
      { key: 'PROMETHEUS_GLOBAL_SCRAPE_INTERVAL', value: '15s', description: 'Default interval between target scrapes' },
      { key: 'PROMETHEUS_GLOBAL_EVALUATION_INTERVAL', value: '15s', description: 'Default interval between alerting rule evaluations' },
      { key: 'PROMETHEUS_LOG_LEVEL', value: 'info', description: 'Prometheus server logging verbosity' },
      { key: 'PROMETHEUS_ENABLE_LIFECYCLE', value: 'true', description: 'Enable /-/reload and /-/quit HTTP lifecycle endpoints' },
    ],
    configFiles: [
      { name: 'Dockerfile', type: 'docker', description: 'Prometheus official image (prom/prometheus:latest) with custom config', lines: 10 },
      { name: 'prometheus.yml', type: 'yaml', description: 'Main config: scrape configs for all 10 services, retention, rules', lines: 86 },
      { name: 'alerts.yml', type: 'yaml', description: 'Alerting rules: service down, high latency, disk usage, OOM risk', lines: 54 },
      { name: 'rules/etl_rules.yml', type: 'yaml', description: 'Custom recording rules: ingestion rate, Spark job duration, dbt freshness', lines: 32 },
      { name: 'rules/pipeline_rules.yml', type: 'yaml', description: 'Pipeline SLA rules: end-to-end latency, data freshness, error budget', lines: 28 },
    ],
    portsInfo: [
      { port: '9090', protocol: 'HTTP', purpose: 'Prometheus Web UI — PromQL queries, graph, status, targets' },
      { port: '9090', protocol: 'HTTP', purpose: '/api/v1 — Prometheus HTTP API for remote queries' },
      { port: '9090', protocol: 'HTTP', purpose: '/-/reload — Runtime configuration reload endpoint (lifecycle)' },
    ],
    healthCheck: { endpoint: 'GET /api/v1/status/config', interval: '30s', timeout: '5s', retries: 3 },
    resourceLimits: [
      { resource: 'CPU', limit: '1.0', reservation: '0.25' },
      { resource: 'Memory', limit: '1G', reservation: '512M' },
    ],
  },
];

// ─── Helper: classify value type for badge color ────────────────────────────

type ValueCategory = 'secret' | 'port' | 'url' | 'number' | 'bool' | 'string';

function classifyValue(envVar: EnvVar): ValueCategory {
  if (envVar.secret) return 'secret';
  const key = envVar.key.toLowerCase();
  const val = envVar.value.toLowerCase();

  if (key.includes('port') || key.includes('_port')) return 'port';
  if (val === 'true' || val === 'false') return 'bool';
  if (/^\d+$/.test(envVar.value)) return 'number';
  if (
    val.startsWith('http') ||
    val.includes('/') ||
    val.includes('://') ||
    val.includes('.yml') ||
    val.includes('.conf') ||
    val.includes('.json') ||
    val.includes('.ini')
  )
    return 'url';
  return 'string';
}

function getCategoryBadge(category: ValueCategory, value: string, revealed: boolean) {
  switch (category) {
    case 'secret':
      return (
        <Badge
          className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15 font-mono text-[11px]"
        >
          {revealed ? value : '••••••••'}
        </Badge>
      );
    case 'port':
      return (
        <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/15 font-mono text-[11px]">
          {value}
        </Badge>
      );
    case 'url':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15 font-mono text-[11px] max-w-[280px] truncate">
          {value}
        </Badge>
      );
    case 'number':
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15 font-mono text-[11px]">
          {value}
        </Badge>
      );
    case 'bool':
      return (
        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/15 font-mono text-[11px]">
          {value}
        </Badge>
      );
    default:
      return (
        <span className="text-xs text-foreground/80 font-mono">{value}</span>
      );
  }
}

function getConfigTypeBadge(type: ConfigFile['type']) {
  const map: Record<ConfigFile['type'], string> = {
    docker: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    config: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    env: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    code: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    sql: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yaml: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return (
    <Badge className={cn('text-[10px] font-medium', map[type])}>
      {type.toUpperCase()}
    </Badge>
  );
}

function getServiceColorClasses(color: string) {
  const map: Record<string, { bg: string; text: string; ring: string; border: string; badgeBg: string; badgeText: string }> = {
    teal: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      ring: 'ring-teal-500/40',
      border: 'border-teal-500/50',
      badgeBg: 'bg-teal-500/10',
      badgeText: 'text-teal-400',
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      ring: 'ring-orange-500/40',
      border: 'border-orange-500/50',
      badgeBg: 'bg-orange-500/10',
      badgeText: 'text-orange-400',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      ring: 'ring-rose-500/40',
      border: 'border-rose-500/50',
      badgeBg: 'bg-rose-500/10',
      badgeText: 'text-rose-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      ring: 'ring-amber-500/40',
      border: 'border-amber-500/50',
      badgeBg: 'bg-amber-500/10',
      badgeText: 'text-amber-400',
    },
    fuchsia: {
      bg: 'bg-fuchsia-500/10',
      text: 'text-fuchsia-400',
      ring: 'ring-fuchsia-500/40',
      border: 'border-fuchsia-500/50',
      badgeBg: 'bg-fuchsia-500/10',
      badgeText: 'text-fuchsia-400',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      ring: 'ring-cyan-500/40',
      border: 'border-cyan-500/50',
      badgeBg: 'bg-cyan-500/10',
      badgeText: 'text-cyan-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/40',
      border: 'border-emerald-500/50',
      badgeBg: 'bg-emerald-500/10',
      badgeText: 'text-emerald-400',
    },
  };
  return map[color] || map.teal;
}

// ─── Animated Stat Card ──────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: typeof Server;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  const colors = getServiceColorClasses(color);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="border-border/50 hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-lg font-bold', colors.text)}>{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Service Selector Card ──────────────────────────────────────────────────

function ServiceSelectorCard({ service, isSelected, onClick, index }: {
  service: Service;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const Icon = service.icon;
  const colors = getServiceColorClasses(service.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 border py-4',
          isSelected
            ? cn('ring-2 shadow-lg', colors.ring, colors.border)
            : 'border-border/50 hover:shadow-md hover:border-border',
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold leading-tight">{service.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn('text-[9px] font-medium', colors.badgeBg, colors.badgeText, 'border-transparent')}
                >
                  {service.ports}
                </Badge>
                <Badge variant="secondary" className="text-[9px]">
                  {service.envVars.length} vars
                </Badge>
              </div>
            </div>
            <Wifi
              className={cn(
                'h-4 w-4 transition-colors',
                isSelected ? colors.text : 'text-muted-foreground/30',
              )}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Environment Variables Table ────────────────────────────────────────────

function EnvVarsTable({ vars, searchQuery }: { vars: EnvVar[]; searchQuery: string }) {
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return vars;
    const q = searchQuery.toLowerCase();
    return vars.filter(
      (v) =>
        v.key.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.value.toLowerCase().includes(q),
    );
  }, [vars, searchQuery]);

  const toggleSecret = (key: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground w-[280px]">
              <div className="flex items-center gap-1.5">
                <span>Key</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground w-[300px]">Value</th>
            <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((envVar) => {
            const category = classifyValue(envVar);
            const isRevealed = revealedSecrets.has(envVar.key);
            return (
              <motion.tr
                key={envVar.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="border-b border-border/30 hover:bg-muted/20 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <code className="font-mono text-[11px] font-semibold text-foreground">
                    {envVar.key}
                  </code>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(category, envVar.value, isRevealed)}
                    {category === 'secret' && (
                      <button
                        onClick={() => toggleSecret(envVar.key)}
                        className="p-1 rounded hover:bg-muted/50 transition-colors"
                        aria-label={isRevealed ? 'Hide secret' : 'Reveal secret'}
                      >
                        {isRevealed ? (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground max-w-[400px]">
                  <p className="line-clamp-2">{envVar.description}</p>
                </td>
              </motion.tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                <Search className="h-5 w-5 mx-auto mb-2 opacity-40" />
                No environment variables match &ldquo;{searchQuery}&rdquo;
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {filtered.length > 0 && (
        <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border/30">
          Showing {filtered.length} of {vars.length} variables
        </div>
      )}
    </div>
  );
}

// ─── Config Files List ──────────────────────────────────────────────────────

function ConfigFilesList({ files }: { files: ConfigFile[] }) {
  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <motion.div
          key={file.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-shrink-0 mt-0.5">
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono font-semibold text-foreground">{file.name}</code>
              {getConfigTypeBadge(file.type)}
              {file.lines && (
                <span className="text-[10px] text-muted-foreground">{file.lines} lines</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{file.description}</p>
          </div>
        </motion.div>
      ))}
      <div className="pt-1 text-[10px] text-muted-foreground">
        {files.length} configuration file{files.length !== 1 ? 's' : ''} in this service
      </div>
    </div>
  );
}

// ─── Ports & Health Panel ───────────────────────────────────────────────────

function PortsHealthPanel({ service }: { service: Service }) {
  return (
    <div className="space-y-6">
      {/* Ports */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Wifi className="h-3 w-3" />
          Exposed Ports
        </h4>
        <div className="space-y-2">
          {service.portsInfo.map((portInfo, i) => (
            <motion.div
              key={`${portInfo.port}-${i}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/10"
            >
              <div className="flex h-9 w-16 items-center justify-center rounded-lg bg-teal-500/10 flex-shrink-0">
                <span className="text-[11px] font-mono font-bold text-teal-400">{portInfo.port}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-muted text-muted-foreground text-[9px] border-border/30 hover:bg-muted">
                    {portInfo.protocol}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{portInfo.purpose}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Health Check */}
      {service.healthCheck && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Health Check
          </h4>
          <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Endpoint</p>
                <p className="text-[11px] font-mono font-medium text-emerald-400">{service.healthCheck.endpoint}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Interval</p>
                <p className="text-[11px] font-mono font-medium">{service.healthCheck.interval}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Timeout</p>
                <p className="text-[11px] font-mono font-medium">{service.healthCheck.timeout}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Retries</p>
                <p className="text-[11px] font-mono font-medium">{service.healthCheck.retries}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Limits */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Layers className="h-3 w-3" />
          Resource Limits
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {service.resourceLimits.map((res) => (
            <div key={res.resource} className="p-3 rounded-lg border border-border/30 bg-muted/10">
              <p className="text-[10px] text-muted-foreground mb-1">{res.resource}</p>
              <div className="flex items-baseline gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground">Limit: </span>
                  <span className="text-xs font-mono font-bold text-amber-400">{res.limit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Res: </span>
                  <span className="text-xs font-mono font-medium text-cyan-400">{res.reservation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ConfigExplorer() {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('fastapi');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const totalVars = useMemo(() => services.reduce((sum, s) => sum + s.envVars.length, 0), []);
  const totalConfigFiles = useMemo(() => services.reduce((sum, s) => sum + s.configFiles.length, 0), []);
  const exposedPorts = useMemo(
    () =>
      new Set(
        services.flatMap((s) =>
          s.portsInfo
            .map((p) => p.port)
            .filter((p) => p !== 'N/A' && p !== 'random'),
        ),
      ).size,
    [],
  );

  return (
    <section id="config-explorer" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-4 text-teal-400 border-teal-500/30">
            <Settings className="h-3 w-3 mr-1.5" />
            Environment Variables & Configuration
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Configuration Explorer
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            10 Docker Microservices • 120+ Environment Variables
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Server} label="Total Services" value="10" color="teal" delay={0} />
          <StatCard icon={Activity} label="Total Variables" value={`${totalVars}+`} color="amber" delay={0.05} />
          <StatCard icon={FileCode2} label="Config Files" value={`${totalConfigFiles}+`} color="fuchsia" delay={0.1} />
          <StatCard icon={Wifi} label="Exposed Ports" value={`${exposedPorts}`} color="emerald" delay={0.15} />
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search environment variables, configs, or settings across all services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-border/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>

        {/* Service Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {services.map((service, index) => (
            <ServiceSelectorCard
              key={service.id}
              service={service}
              isSelected={selectedServiceId === service.id}
              onClick={() => setSelectedServiceId(service.id)}
              index={index}
            />
          ))}
        </div>

        {/* Selected Service Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedServiceId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = selectedService.icon;
                    const colors = getServiceColorClasses(selectedService.color);
                    return (
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', colors.bg)}>
                        <Icon className={cn('h-5 w-5', colors.text)} />
                      </div>
                    );
                  })()}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedService.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedService.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="env-vars" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="env-vars" className="text-xs sm:text-sm">
                      <Activity className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
                      Environment Variables
                      <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
                        {selectedService.envVars.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="config-files" className="text-xs sm:text-sm">
                      <FolderOpen className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
                      Config Files
                      <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
                        {selectedService.configFiles.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="ports-health" className="text-xs sm:text-sm">
                      <Layers className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
                      Ports & Health
                      <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
                        {selectedService.portsInfo.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="env-vars">
                    <EnvVarsTable vars={selectedService.envVars} searchQuery={searchQuery} />
                  </TabsContent>

                  <TabsContent value="config-files">
                    <ConfigFilesList files={selectedService.configFiles} />
                  </TabsContent>

                  <TabsContent value="ports-health">
                    <PortsHealthPanel service={selectedService} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 p-4 rounded-lg border border-border/30 bg-muted/5"
        >
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Value Type Legend
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              { label: 'Secret / Password', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
              { label: 'Port', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
              { label: 'URL / Path', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'Number', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { label: 'Boolean', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <Badge className={cn('text-[9px] px-1.5 py-0 border', item.color)}>
                  {item.label}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

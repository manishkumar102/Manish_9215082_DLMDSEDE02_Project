// ============================================================================
// E-Commerce Clickstream Analytics Pipeline - Technology Stack Details
// ============================================================================
// Rich detail data for each of the 9 technologies used in the pipeline.
// Used to render interactive detail pages when users click on tech stack cards.
// ============================================================================

export interface TechStackDetail {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  version: string;
  license: string;
  website: string;

  overview: {
    tagline: string;
    description: string;
    keyFeatures: string[];
    strengths: string[];
    useCases: string[];
  };

  codeExamples: {
    title: string;
    language: string;
    filename: string;
    description: string;
    code: string;
  }[];

  configuration: {
    dockerImage?: string;
    configFiles: { path: string; description: string }[];
    environmentVars: { key: string; description: string; defaultValue: string }[];
    ports?: string;
    resources?: string;
  };

  integrations: {
    name: string;
    description: string;
    direction: 'upstream' | 'downstream' | 'bidirectional';
  }[];
}

// ============================================================================
// 1. FastAPI
// ============================================================================

const fastapi: TechStackDetail = {
  id: 'fastapi',
  name: 'FastAPI',
  icon: 'Upload',
  color: 'emerald',
  category: 'ingestion',
  version: '0.109+',
  license: 'MIT',
  website: 'https://fastapi.tiangolo.com',

  overview: {
    tagline: 'High-performance async Python web framework for building APIs',
    description:
      'FastAPI is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints. It leverages Starlette for the async web layer and Pydantic for data validation, delivering near-native performance through async I/O and automatic OpenAPI documentation generation.',
    keyFeatures: [
      'Automatic OpenAPI 3.1 and JSON Schema documentation',
      'Built-in request validation with Pydantic v2 models',
      'Native async/await support with uvicorn ASGI server',
      'Dependency injection system for clean code organization',
      'Background task queue support for long-running operations',
      'WebSocket support with automatic connection management',
    ],
    strengths: [
      '2-3x faster than Flask/Django for I/O-bound workloads',
      'Minimal boilerplate with automatic type inference and docs',
      'Rich ecosystem of middleware (CORS, auth, rate limiting)',
    ],
    useCases: [
      'CSV clickstream ingestion endpoint with schema validation and MinIO upload',
      'Health check and readiness probes for Kubernetes/Docker deployments',
      'Prometheus metrics exposition for pipeline monitoring',
    ],
  },

  codeExamples: [
    {
      title: 'FastAPI Application with Lifespan',
      language: 'Python',
      filename: 'ingestion/app/main.py',
      description: 'Entry point defining the application lifecycle, CORS middleware, and Prometheus metrics setup.',
      code: `from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_asgi_app
import time

from app.config import settings
from app.routes.upload import router as upload_router
from app.routes.health import router as health_router

# Prometheus metrics
ingestion_total = Counter(
    "ingestion_rows_total",
    "Total rows ingested",
    ["status"]
)
ingestion_duration = Histogram(
    "ingestion_duration_seconds",
    "Upload processing time"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    print(f"Starting ingestion service on port {settings.PORT}")
    # Warm up MinIO connection
    from app.services.minio_client import get_minio_client
    get_minio_client()
    print("MinIO connection verified")
    yield
    print("Shutting down ingestion service")

app = FastAPI(
    title="Clickstream Ingestion API",
    description="Validates and ingests CSV data into MinIO bronze layer",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(health_router, prefix="/api/v1", tags=["Health"])

# Mount Prometheus metrics endpoint
metrics_app = generate_asgi_app()
app.mount("/metrics", metrics_app)`,
    },
    {
      title: 'Pydantic Schema & Upload Endpoint',
      language: 'Python',
      filename: 'ingestion/app/routes/upload.py',
      description: 'CSV upload endpoint with Pydantic validation, deduplication, and MinIO upload.',
      code: `import hashlib
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from io import BytesIO
import csv as csv_mod

from app.services.validator import validate_csv_rows
from app.services.minio_client import upload_to_bronze
from app.models.response import IngestionResponse

router = APIRouter()

@router.post("/ingest/csv", response_model=IngestionResponse)
async def ingest_csv(file: UploadFile = File(...)):
    """Accept CSV upload, validate rows, deduplicate, upload to MinIO."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read()
    raw_text = content.decode("utf-8")

    # Validate against Pydantic schema
    valid_rows, errors = validate_csv_rows(raw_text)
    if not valid_rows:
        raise HTTPException(status_code=422, detail="All rows failed validation")

    # Deduplicate by event_id SHA-256 hash
    seen, deduped = set(), []
    for row in valid_rows:
        h = hashlib.sha256(row["event_id"].encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            deduped.append(row)

    # Build date-partitioned object key
    now = datetime.utcnow()
    partition = f"year={now.year}/month={now.month:02d}/day={now.day:02d}"
    obj = f"clickstream/{partition}/clickstream_{now.strftime('%Y%m%d_%H%M%S')}.csv"

    # Write deduplicated CSV to buffer
    buffer = BytesIO()
    wrapper = TextIOWrapper(buffer, encoding="utf-8", newline="")
    fields = [
        "event_id", "user_id", "item_id", "category_id",
        "behavior_type", "timestamp", "session_id",
        "page_url", "referrer", "device_type",
        "user_agent", "geolocation",
    ]
    writer = csv_mod.DictWriter(wrapper, fieldnames=fields)
    writer.writeheader()
    writer.writerows(deduped)
    wrapper.detach()
    buffer.seek(0)

    # Upload to MinIO bronze bucket
    path = upload_to_bronze(obj, buffer)

    return IngestionResponse(
        status="success",
        total_rows=len(valid_rows) + len(errors),
        valid_rows=len(valid_rows),
        duplicate_rows=len(valid_rows) - len(deduped),
        error_rows=len(errors),
        object_key=path,
        errors=errors[:10],
    )`,
    },
  ],

  configuration: {
    dockerImage: 'python:3.12-slim',
    configFiles: [
      { path: 'ingestion/app/config.py', description: 'Application configuration with pydantic-settings' },
      { path: 'ingestion/app/main.py', description: 'FastAPI entry point with lifespan and middleware' },
      { path: 'ingestion/requirements.txt', description: 'Python dependencies (fastapi, uvicorn, minio, pydantic)' },
      { path: 'ingestion/Dockerfile', description: 'Multi-stage Docker image for the ingestion service' },
    ],
    environmentVars: [
      { key: 'PORT', description: 'Uvicorn listen port', defaultValue: '8000' },
      { key: 'WORKERS', description: 'Number of uvicorn worker processes', defaultValue: '4' },
      { key: 'MINIO_ENDPOINT', description: 'MinIO S3-compatible endpoint', defaultValue: 'minio:9000' },
      { key: 'MINIO_ACCESS_KEY', description: 'MinIO access key for authentication', defaultValue: 'minioadmin' },
      { key: 'MINIO_SECRET_KEY', description: 'MinIO secret key for authentication', defaultValue: 'minioadmin' },
      { key: 'MINIO_BUCKET', description: 'Target bucket name for raw data', defaultValue: 'bronze' },
      { key: 'MAX_UPLOAD_SIZE_MB', description: 'Maximum CSV upload size in megabytes', defaultValue: '512' },
    ],
    ports: '8000 (API) / 8000/metrics (Prometheus)',
    resources: '512 MB RAM / 0.5 vCPU per worker',
  },

  integrations: [
    { name: 'CSV Source Files', description: 'Receives raw clickstream CSV uploads via REST API', direction: 'upstream' },
    { name: 'MinIO', description: 'Writes validated CSV to bronze bucket with date partitioning', direction: 'downstream' },
    { name: 'Prometheus', description: 'Exposes ingestion metrics (rows/sec, errors, latency)', direction: 'bidirectional' },
  ],
};

// ============================================================================
// 2. MinIO
// ============================================================================

const minio: TechStackDetail = {
  id: 'minio',
  name: 'MinIO',
  icon: 'HardDrive',
  color: 'rose',
  category: 'processing',
  version: 'RELEASE.2024-01+',
  license: 'AGPL v3',
  website: 'https://min.io',

  overview: {
    tagline: 'S3-compatible high-performance object storage for data lakes',
    description:
      'MinIO is a high-performance, S3-compatible object storage server designed for AI/ML and data lake workloads. It delivers industry-leading throughput with minimal overhead, supporting features like erasure coding, versioning, lifecycle management, and encryption — making it the ideal on-premise or private cloud storage backbone for the medallion data lake architecture.',
    keyFeatures: [
      'Full S3 API compatibility with boto3, spark-s3a, and mc CLI',
      'Erasure coding for data durability and protection against drive failures',
      'Object versioning for audit trails and point-in-time recovery',
      'Lifecycle policies for automated tiering and expiration',
      'Web console at port 9001 for visual bucket management',
      'Server-side encryption (SSE-S3, SSE-KMS) for data-at-rest security',
    ],
    strengths: [
      '10-100 GB/sec throughput with distributed deployment mode',
      'Zero vendor lock-in with standard S3 API — swap with AWS S3 anytime',
      'Lightweight single-binary deployment ideal for Docker environments',
    ],
    useCases: [
      'Bronze layer: stores raw CSV files with immutable append-only semantics',
      'Silver layer: stores cleaned Parquet files with event_date partitioning',
      'Lifecycle management: auto-archive after 90 days, delete after 365 days',
    ],
  },

  codeExamples: [
    {
      title: 'Bucket Setup & Lifecycle Configuration',
      language: 'Shell',
      filename: 'scripts/setup_minio_buckets.sh',
      description: 'Creates bronze and silver buckets, enables versioning, and configures lifecycle policies.',
      code: `#!/bin/bash
set -euo pipefail

# Configure mc client alias
mc alias set myminio http://minio:9000 minioadmin minioadmin

# --- Bronze Bucket (Raw Data) ---
mc mb myminio/bronze --ignore-existing
mc version enable myminio/bronze

# Lifecycle: transition to WARM tier after 90 days
mc ilm rule add myminio/bronze \\\\
  --transition-days 90 \\\\
  --transition-tier "WARM" \\\\
  --prefix "clickstream/"

# Lifecycle: permanent delete after 365 days
mc ilm rule add myminio/bronze \\\\
  --expiry-days 365 \\\\
  --prefix "clickstream/"

echo "Bronze bucket configured:"
mc version info myminio/bronze
mc ilm rule list myminio/bronze

# --- Silver Bucket (Cleaned Data) ---
mc mb myminio/silver --ignore-existing
mc version enable myminio/silver

# Lifecycle: keep silver data longer (180 days hot, 730 total)
mc ilm rule add myminio/silver \\\\
  --transition-days 180 \\\\
  --transition-tier "WARM" \\\\
  --prefix "clickstream/"

mc ilm rule add myminio/silver \\\\
  --expiry-days 730 \\\\
  --prefix "clickstream/"

echo "Silver bucket configured:"
mc ilm rule list myminio/silver

echo "All buckets setup complete!"`,
    },
    {
      title: 'Python S3 Client for MinIO',
      language: 'Python',
      filename: 'ingestion/app/services/minio_client.py',
      description: 'MinIO S3 client wrapper with connection pooling, retry logic, and upload/download.',
      code: `from minio import Minio
from minio.error import S3Error
from io import BytesIO
import logging

logger = logging.getLogger(__name__)
_client: Minio | None = None

def get_minio_client() -> Minio:
    """Get or create a singleton MinIO client instance."""
    global _client
    if _client is None:
        _client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False,  # HTTP in Docker network
            region="us-east-1",
        )
        # Ensure bucket exists
        if not _client.bucket_exists(settings.MINIO_BUCKET):
            _client.make_bucket(settings.MINIO_BUCKET)
            logger.info(f"Created bucket: {settings.MINIO_BUCKET}")
    return _client

def upload_to_bronze(
    object_name: str,
    data: BytesIO,
    content_type: str = "text/csv",
) -> str:
    """Upload data to the bronze bucket with retry."""
    client = get_minio_client()
    result = client.put_object(
        bucket_name=settings.MINIO_BUCKET,
        object_name=object_name,
        data=data,
        length=data.getbuffer().nbytes,
        content_type=content_type,
    )
    path = f"s3://{settings.MINIO_BUCKET}/{object_name}"
    size_mb = data.getbuffer().nbytes / (1024 * 1024)
    logger.info(f"Uploaded {size_mb:.2f} MB to {path}")
    return path

def list_bronze_files(prefix: str = "") -> list[dict]:
    """List objects in the bronze bucket with metadata."""
    client = get_minio_client()
    objects = client.list_objects(
        settings.MINIO_BUCKET, prefix=prefix, recursive=True
    )
    return [
        {
            "key": obj.object_name,
            "size": obj.size,
            "modified": obj.last_modified.isoformat(),
            "etag": obj.etag,
        }
        for obj in objects
    ]`,
    },
  ],

  configuration: {
    dockerImage: 'minio/minio:RELEASE.2024-01-28',
    configFiles: [
      { path: 'docker-compose.yml', description: 'MinIO service with volume, port, and environment config' },
      { path: 'scripts/setup_minio_buckets.sh', description: 'Bucket creation, versioning, and lifecycle setup script' },
      { path: '.env', description: 'MINIO_ROOT_USER and MINIO_ROOT_PASSWORD credentials' },
    ],
    environmentVars: [
      { key: 'MINIO_ROOT_USER', description: 'MinIO root access key (min 3 chars)', defaultValue: 'minioadmin' },
      { key: 'MINIO_ROOT_PASSWORD', description: 'MinIO root secret key (min 8 chars)', defaultValue: 'minioadmin' },
      { key: 'MINIO_BROWSER', description: 'Enable built-in web console', defaultValue: 'on' },
      { key: 'MINIO_VOLUME', description: 'Docker volume for persistent data storage', defaultValue: 'minio-data:/data' },
      { key: 'MINIO_API_PORT', description: 'S3 API listen port', defaultValue: '9000' },
      { key: 'MINIO_CONSOLE_PORT', description: 'Web management console port', defaultValue: '9001' },
    ],
    ports: '9000 (S3 API) / 9001 (Web Console)',
    resources: '1 GB RAM / 1 vCPU (minimum), 4 GB RAM recommended for production',
  },

  integrations: [
    { name: 'FastAPI', description: 'Receives validated CSV uploads from ingestion service', direction: 'upstream' },
    { name: 'Apache Spark', description: 'Reads bronze CSV via S3A connector, writes silver Parquet', direction: 'downstream' },
    { name: 'mc CLI', description: 'Command-line tool for bucket management and data inspection', direction: 'bidirectional' },
  ],
};

// ============================================================================
// 3. Apache Spark
// ============================================================================

const spark: TechStackDetail = {
  id: 'spark',
  name: 'Apache Spark',
  icon: 'Zap',
  color: 'orange',
  category: 'processing',
  version: '3.5.0+',
  license: 'Apache 2.0',
  website: 'https://spark.apache.org',

  overview: {
    tagline: 'Unified engine for large-scale distributed data processing',
    description:
      'Apache Spark is the industry-standard distributed computing engine for big data workloads. Using PySpark in this pipeline, it transforms raw bronze-layer CSVs into clean, validated silver-layer Parquet files. With in-memory processing, adaptive query execution, and a 4-worker cluster, Spark handles ~1.5 million events per day in under 12 minutes with 70% storage compression via Snappy.',
    keyFeatures: [
      'Distributed data processing with resilient distributed datasets (RDDs) and DataFrames',
      'Spark SQL for structured data with Catalyst query optimizer',
      'Adaptive Query Execution (AQE) for automatic query plan optimization',
      'S3A connector for direct read/write to S3-compatible storage (MinIO)',
      'Kryo serialization for efficient cross-node data shuffling',
      'Built-in data quality functions and schema enforcement',
    ],
    strengths: [
      '100x faster than Hadoop MapReduce for in-memory workloads',
      'Fault-tolerant with automatic task retry and lineage-based recovery',
      'Unified API for batch (ETL), streaming, ML, and graph processing',
    ],
    useCases: [
      'CSV-to-Parquet ETL: dedup, null handling, type casting, derived columns',
      'Data quality validation: null ratio checks, event distribution analysis',
      'Event enrichment: sessionization, hour_of_day, is_mobile, page_category',
    ],
  },

  codeExamples: [
    {
      title: 'SparkSession Factory with S3A Config',
      language: 'Python',
      filename: 'spark/utils/spark_session.py',
      description: 'Configures a SparkSession with S3A connector for MinIO, Hive support, and optimized settings.',
      code: `from pyspark.sql import SparkSession

def create_spark_session(
    app_name: str = "clickstream-etl"
) -> SparkSession:
    """Create a configured SparkSession for ETL jobs."""
    return (
        SparkSession.builder
        .appName(app_name)
        .master("spark://spark-master:7077")
        # S3A connector configuration for MinIO
        .config("spark.hadoop.fs.s3a.endpoint", "http://minio:9000")
        .config("spark.hadoop.fs.s3a.access.key", "minioadmin")
        .config("spark.hadoop.fs.s3a.secret.key", "minioadmin")
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        # Performance tuning
        .config("spark.sql.shuffle.partitions", "8")
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
        .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
        # Resource allocation
        .config("spark.executor.memory", "2g")
        .config("spark.driver.memory", "1g")
        .config("spark.executor.cores", "2")
        # Output format
        .config("spark.sql.parquet.compression.codec", "snappy")
        .enableHiveSupport()
        .getOrCreate()
    )`,
    },
    {
      title: 'Clickstream Cleaning ETL Job',
      language: 'Python',
      filename: 'spark/jobs/clean_clickstream.py',
      description: 'Main ETL job: reads bronze CSV, deduplicates, handles nulls, writes Parquet to silver.',
      code: `from pyspark.sql import functions as F
from spark.utils.spark_session import create_spark_session
from spark.utils.quality_checks import run_quality_checks

def clean_clickstream(processing_date: str) -> None:
    """ETL: bronze CSV -> clean silver Parquet."""
    spark = create_spark_session("clean-clickstream")

    # Build partitioned S3 paths
    year = processing_date[:4]
    month = int(processing_date[5:7])
    day = int(processing_date[8:10])

    bronze_path = (
        f"s3a://bronze/clickstream/year={year}/"
        f"month={month:02d}/day={day:02d}/"
    )
    silver_path = f"s3a://silver/clickstream/event_date={processing_date}/"

    # Read raw CSV from bronze
    df = (
        spark.read
        .option("header", "true")
        .option("timestampFormat", "yyyy-MM-dd HH:mm:ss")
        .csv(bronze_path)
    )
    bronze_count = df.count()
    print(f"Bronze rows read: {bronze_count:,}")

    # Deduplicate by event_id
    df = df.dropDuplicates(["event_id"])

    # Impute null values
    df = df.fillna({
        "user_agent": "unknown",
        "referrer": "direct",
        "geolocation": "unknown",
    })

    # Business constraint: filter invalid records
    df = df.filter(
        F.col("user_id").isNotNull()
        & (F.col("user_id") > 0)
    )

    # Derived columns
    df = (
        df
        .withColumn(
            "is_mobile",
            F.when(F.col("device_type") == "mobile", True).otherwise(False)
        )
        .withColumn("hour_of_day", F.hour(F.col("timestamp")))
        .withColumn("event_date", F.to_date(F.col("timestamp")))
    )

    # Write to silver as partitioned Parquet
    df.write.mode("overwrite").partitionBy("event_date").parquet(silver_path)

    # Run data quality checks
    run_quality_checks(spark, silver_path, processing_date)

    silver_count = df.count()
    print(f"Silver rows written: {silver_count:,}")
    print(f"Dedup rate: {((bronze_count - silver_count) / bronze_count * 100):.1f}%")
    spark.stop()`,
    },
  ],

  configuration: {
    dockerImage: 'bitnami/spark:3.5.0',
    configFiles: [
      { path: 'spark/utils/spark_session.py', description: 'SparkSession factory with S3A and memory configuration' },
      { path: 'spark/jobs/clean_clickstream.py', description: 'Main ETL job for CSV-to-Parquet cleaning' },
      { path: 'spark/entrypoint.sh', description: 'Docker entrypoint for spark-submit execution' },
      { path: 'spark/Dockerfile', description: 'Custom Spark image with Python dependencies' },
      { path: 'spark/requirements.txt', description: 'Python packages (pyspark, minio, boto3)' },
    ],
    environmentVars: [
      { key: 'SPARK_MASTER', description: 'Spark master URL for worker registration', defaultValue: 'spark://spark-master:7077' },
      { key: 'SPARK_MASTER_PORT', description: 'Master bind port for worker communication', defaultValue: '7077' },
      { key: 'SPARK_MASTER_WEBUI_PORT', description: 'Spark Master web UI port', defaultValue: '8080' },
      { key: 'SPARK_WORKER_CORES', description: 'CPU cores allocated per Spark worker', defaultValue: '2' },
      { key: 'SPARK_WORKER_MEMORY', description: 'Memory allocated per Spark worker', defaultValue: '2g' },
      { key: 'SPARK_WORKER_INSTANCES', description: 'Number of Spark worker containers', defaultValue: '4' },
      { key: 'SPARK_SHUFFLE_PARTITIONS', description: 'Default shuffle partition count', defaultValue: '8' },
    ],
    ports: '7077 (Master) / 8080 (Master WebUI) / 8081 (Worker WebUI)',
    resources: '2 GB RAM / 2 cores per worker (4 workers total = 8 GB / 8 cores)',
  },

  integrations: [
    { name: 'MinIO Bronze', description: 'Reads raw CSV files via S3A filesystem connector', direction: 'upstream' },
    { name: 'MinIO Silver', description: 'Writes cleaned Parquet files with Snappy compression', direction: 'downstream' },
    { name: 'Airflow', description: 'Triggered as SparkSubmitOperator task in the ETL DAG', direction: 'bidirectional' },
  ],
};

// ============================================================================
// 4. Apache Airflow
// ============================================================================

const airflow: TechStackDetail = {
  id: 'airflow',
  name: 'Apache Airflow',
  icon: 'CalendarClock',
  color: 'cyan',
  category: 'orchestration',
  version: '2.8+',
  license: 'Apache 2.0',
  website: 'https://airflow.apache.org',

  overview: {
    tagline: 'Programmatic workflow orchestration for data pipelines',
    description:
      'Apache Airflow is the central orchestration platform that schedules, monitors, and manages the entire ETL pipeline. Using Python-based DAGs (Directed Acyclic Graphs), it defines task dependencies between ingestion, Spark processing, dbt transformations, and PostgreSQL loading — ensuring reliable, reproducible execution with automatic retries and alerting on failures.',
    keyFeatures: [
      'Python-based DAG definitions with rich operator ecosystem',
      'Built-in web UI for DAG visualization, task logging, and manual triggers',
      'Automatic retry with configurable exponential backoff policies',
      'Task concurrency control with pool management and priority weights',
      'XCom system for lightweight inter-task data passing',
      'Extensible plugin system for custom operators and sensors',
    ],
    strengths: [
      'Declarative pipeline-as-code: DAGs are version-controlled Python files',
      'Battle-tested at scale by Airbnb, Lyft, and thousands of enterprises',
      'Rich UI with Gantt charts, task duration graphs, and real-time logging',
    ],
    useCases: [
      'Daily ETL orchestration: ingestion → Spark → dbt → PostgreSQL loading',
      'Data quality DAG: scheduled quality checks with Slack/email alerts',
      'dbt run orchestration: model materialization with incremental strategy',
    ],
  },

  codeExamples: [
    {
      title: 'Main Clickstream Pipeline DAG',
      language: 'Python',
      filename: 'airflow/dags/clickstream_pipeline.py',
      description: 'Primary DAG orchestrating the full data pipeline from ingestion to warehouse loading.',
      code: `from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.utils.task_group import TaskGroup

default_args = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=2),
}

with DAG(
    dag_id="clickstream_pipeline",
    default_args=default_args,
    description="End-to-end clickstream ETL pipeline",
    schedule_interval="0 6 * * *",  # Daily at 6 AM
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["production", "clickstream", "etl"],
) as dag:

    # Task 1: Ingest CSV data
    ingest = PythonOperator(
        task_id="ingest_csv",
        python_callable=run_ingestion,
        op_kwargs={"date": "{{ ds }}"},
    )

    # Task 2: Spark ETL (clean + enrich)
    spark_etl = SparkSubmitOperator(
        task_id="spark_clean_clickstream",
        application="/opt/spark/jobs/clean_clickstream.py",
        application_args=["{{ ds }}"],
        conn_id="spark_default",
        conf={
            "spark.executor.memory": "2g",
            "spark.executor.cores": "2",
        },
        verbose=True,
    )

    # Task 3: dbt transformations
    with TaskGroup("dbt_transform") as dbt_group:
        dbt_run_staging = BashOperator(
            task_id="dbt_run_staging",
            bash_command="cd /opt/dbt && dbt run --select staging",
        )
        dbt_run_intermediate = BashOperator(
            task_id="dbt_run_intermediate",
            bash_command="cd /opt/dbt && dbt run --select intermediate",
        )
        dbt_run_marts = BashOperator(
            task_id="dbt_run_marts",
            bash_command="cd /opt/dbt && dbt run --select marts",
        )
        dbt_test = BashOperator(
            task_id="dbt_test",
            bash_command="cd /opt/dbt && dbt test",
        )
        # Dependency chain within group
        dbt_run_staging >> dbt_run_intermediate >> dbt_run_marts >> dbt_test

    # Task 4: Refresh materialized views
    refresh_views = BashOperator(
        task_id="refresh_materialized_views",
        bash_command="psql $POSTGRES_URI -f /opt/sql/materialized_views/refresh_all.sql",
    )

    # Pipeline dependency chain
    ingest >> spark_etl >> dbt_group >> refresh_views`,
    },
  ],

  configuration: {
    dockerImage: 'apache/airflow:2.8.1-python3.11',
    configFiles: [
      { path: 'airflow/dags/clickstream_pipeline.py', description: 'Main ETL DAG with task groups and dependencies' },
      { path: 'airflow/dags/data_quality_dag.py', description: 'Scheduled data quality check DAG with alerting' },
      { path: 'airflow/plugins/operators/spark_submit.py', description: 'Custom Spark submit operator with MinIO config' },
      { path: 'airflow/entrypoint.sh', description: 'Docker entrypoint for Airflow scheduler and webserver' },
    ],
    environmentVars: [
      { key: 'AIRFLOW_HOME', description: 'Airflow home directory path', defaultValue: '/opt/airflow' },
      { key: 'AIRFLOW__CORE__EXECUTOR', description: 'Executor type for task execution', defaultValue: 'CeleryExecutor' },
      { key: 'AIRFLOW__DATABASE__SQL_ALCHEMY_CONN', description: 'PostgreSQL connection for metadata DB', defaultValue: 'postgresql://airflow:airflow@postgres/airflow' },
      { key: 'AIRFLOW__WEBSERVER__WEB_SERVER_PORT', description: 'Airflow web server UI port', defaultValue: '8080' },
      { key: 'AIRFLOW__WEBSERVER__RBAC', description: 'Enable role-based access control', defaultValue: 'True' },
      { key: 'AIRFLOW__CORE__DAG_CONCURRENCY', description: 'Max concurrent DAG runs', defaultValue: '4' },
      { key: 'AIRFLOW__SCHEDULER__CATCHUP_BY_DEFAULT', description: 'Enable backfill on missed runs', defaultValue: 'False' },
    ],
    ports: '8080 (Web UI) / 8793 (Flower - Celery monitor)',
    resources: '2 GB RAM / 1 vCPU (scheduler) + 1 GB RAM per worker',
  },

  integrations: [
    { name: 'FastAPI', description: 'Triggers CSV ingestion via PythonOperator HTTP call', direction: 'downstream' },
    { name: 'Apache Spark', description: 'Submits ETL jobs via SparkSubmitOperator', direction: 'downstream' },
    { name: 'dbt', description: 'Runs dbt models and tests via BashOperator', direction: 'downstream' },
    { name: 'PostgreSQL', description: 'Stores Airflow metadata DB and pipeline results', direction: 'bidirectional' },
    { name: 'Prometheus', description: 'Exports DAG run metrics, task durations, and failure counts', direction: 'downstream' },
  ],
};

// ============================================================================
// 5. dbt
// ============================================================================

const dbt: TechStackDetail = {
  id: 'dbt',
  name: 'dbt',
  icon: 'GitBranch',
  color: 'fuchsia',
  category: 'transformation',
  version: '1.7+',
  license: 'Apache 2.0',
  website: 'https://www.getdbt.com',

  overview: {
    tagline: 'SQL-first transformation tool for analytics engineering',
    description:
      'dbt (data build tool) enables analytics engineers to transform data in the warehouse using pure SQL. In this pipeline, dbt reads from the silver Parquet layer and produces a well-structured star schema with 40+ models organized into staging, intermediate, and mart layers. Every model is tested, documented, and version-controlled — providing a reliable, auditable transformation layer.',
    keyFeatures: [
      'SQL-only transformations with Jinja templating for DRY code',
      'Three-layer architecture: staging (stg_), intermediate (int_), marts (mart_)',
      'Built-in testing framework: unique, not_null, accepted_ranges, relationships',
      'Incremental materialization for efficient processing of new data only',
      'Auto-generated documentation with dbt docs (data lineage, column descriptions)',
      'Package management via dbt Hub for sharing reusable macros and models',
    ],
    strengths: [
      'Version-controlled SQL transformations — diff and review like application code',
      'Test coverage ensures data quality at every transformation layer',
      'Incremental models reduce processing time by 80%+ for daily runs',
    ],
    useCases: [
      'Star schema construction: 4 dimension tables + 5 fact/aggregate tables',
      'User sessionization and event enrichment in intermediate models',
      'Conversion funnel and retention cohort aggregations for BI dashboards',
    ],
  },

  codeExamples: [
    {
      title: 'dbt Project Configuration',
      language: 'YAML',
      filename: 'dbt/dbt_project.yml',
      description: 'Root project configuration defining models, materialization, and directories.',
      code: `name: "ecommerce_clickstream"
version: "1.0.0"
config-version: 2

profile: "clickstream"

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

models:
  ecommerce_clickstream:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: ephemeral
    marts:
      core:
        +materialized: table
        +schema: warehouse
      aggregates:
        +materialized: table
        +schema: analytics

vars:
  lookback_days: 90`,
    },
    {
      title: 'Staging Model — stg_clickstream',
      language: 'SQL',
      filename: 'dbt/models/staging/stg_clickstream.sql',
      description: 'Staging model that reads silver Parquet with standardized column naming.',
      code: `-- Staging model: 1:1 mapping from silver Parquet
-- Standardizes column names and applies basic filtering

{{ config(
    materialized = "view",
    schema = "staging"
) }}

SELECT
    event_id,
    user_id,
    item_id,
    category_id,
    behavior_type,
    timestamp AS event_timestamp,
    session_id,
    page_url,
    COALESCE(referrer, 'direct') AS referrer,
    device_type,
    COALESCE(user_agent, 'unknown') AS user_agent,
    COALESCE(geolocation, 'unknown') AS geolocation,
    is_mobile,
    hour_of_day,
    event_date
FROM silver.clickstream
WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL {{ var('lookback_days') }} DAY)
  AND event_date <= CURRENT_DATE`,
    },
    {
      title: 'Intermediate Model — User Sessions',
      language: 'SQL',
      filename: 'dbt/models/intermediate/int_user_sessions.sql',
      description: 'Joins clickstream events into session-level aggregates for user behavior analysis.',
      code: `-- Intermediate model: session-level user behavior
-- Each row represents a user session with aggregated metrics

{{ config(
    materialized = "ephemeral"
) }}

WITH session_events AS (
    SELECT
        session_id,
        user_id,
        event_date,
        MIN(event_timestamp) AS session_start,
        MAX(event_timestamp) AS session_end,
        COUNT(DISTINCT item_id) AS items_viewed,
        COUNTIF(behavior_type = 'pv') AS page_views,
        COUNTIF(behavior_type = 'fav') AS favorites,
        COUNTIF(behavior_type = 'cart') AS cart_adds,
        COUNTIF(behavior_type = 'buy') AS purchases,
        COUNT(DISTINCT category_id) AS categories_explored,
        device_type,
        is_mobile
    FROM {{ ref('stg_clickstream') }}
    GROUP BY 1, 2, 3, 10, 11
),

session_metrics AS (
    SELECT
        *,
        TIMESTAMPDIFF(MINUTE, session_start, session_end) AS session_duration_min,
        CASE WHEN purchases > 0 THEN TRUE ELSE FALSE END AS is_converting,
        CASE
            WHEN purchases > 0 THEN 'power_buyer'
            WHEN cart_adds > 0 THEN 'intent_shopper'
            WHEN favorites > 0 THEN 'casual'
            ELSE 'browser'
        END AS user_segment
    FROM session_events
)

SELECT * FROM session_metrics`,
    },
  ],

  configuration: {
    dockerImage: 'ghcr.io/dbt-labs/dbt-spark:1.7.4',
    configFiles: [
      { path: 'dbt/dbt_project.yml', description: 'Root project config: models, materialization, variables' },
      { path: 'dbt/profiles.yml', description: 'Connection profiles for Spark (dev) and PostgreSQL (prod)' },
      { path: 'dbt/models/staging/schema.yml', description: 'Schema documentation and tests for staging models' },
      { path: 'dbt/models/marts/core/schema.yml', description: 'Star schema table documentation and relationships' },
      { path: 'dbt/packages.yml', description: 'dbt package dependencies (e.g., dbt-utils, dbt_expectations)' },
    ],
    environmentVars: [
      { key: 'DBT_PROFILES_DIR', description: 'Directory containing profiles.yml', defaultValue: '/opt/dbt' },
      { key: 'DBT_TARGET', description: 'Active profile target (dev / staging / prod)', defaultValue: 'prod' },
      { key: 'DBT_SPARK_ENDPOINT', description: 'Spark Thrift server endpoint for dev mode', defaultValue: 'spark-master:10001' },
      { key: 'DBT_POSTGRES_HOST', description: 'PostgreSQL warehouse host', defaultValue: 'postgres' },
      { key: 'DBT_POSTGRES_PORT', description: 'PostgreSQL warehouse port', defaultValue: '5432' },
      { key: 'DBT_POSTGRES_USER', description: 'PostgreSQL warehouse user', defaultValue: 'dbt_runner' },
      { key: 'DBT_POSTGRES_DB', description: 'PostgreSQL warehouse database', defaultValue: 'clickstream_warehouse' },
    ],
    ports: 'No exposed port (CLI tool invoked by Airflow)',
    resources: '1 GB RAM / 1 vCPU during dbt run execution',
  },

  integrations: [
    { name: 'Apache Spark (Silver)', description: 'Reads silver Parquet data via dbt-spark adapter in dev mode', direction: 'upstream' },
    { name: 'PostgreSQL', description: 'Writes star schema tables via dbt-postgres adapter in production', direction: 'downstream' },
    { name: 'Airflow', description: 'Invoked as BashOperator tasks for dbt run and dbt test', direction: 'upstream' },
  ],
};

// ============================================================================
// 6. PostgreSQL
// ============================================================================

const postgres: TechStackDetail = {
  id: 'postgresql',
  name: 'PostgreSQL',
  icon: 'Database',
  color: 'sky',
  category: 'warehouse',
  version: '16',
  license: 'PostgreSQL License',
  website: 'https://www.postgresql.org',

  overview: {
    tagline: 'Advanced open-source relational database for analytical workloads',
    description:
      'PostgreSQL serves as the analytical data warehouse, storing the star schema produced by dbt. With 4 dimension tables and 5 fact/aggregate tables, it powers sub-second dashboard queries across 90+ days of historical data. Leveraging B-tree and BRIN indexes, materialized views, and connection pooling, PostgreSQL delivers p99 query latency under 2 seconds for Metabase dashboard workloads.',
    keyFeatures: [
      'Advanced indexing: B-tree, BRIN, GiST, GIN for different query patterns',
      'Materialized views with concurrent refresh for dashboard pre-aggregation',
      'SCD Type 2 support via trigger-based slow-changing dimensions',
      'Window functions for retention cohorts, sessionization, and ranking',
      'Foreign data wrappers (FDW) for federated queries to external sources',
      'Point-in-time recovery (PITR) and WAL-based replication for HA',
    ],
    strengths: [
      'ACID compliance ensures data integrity for analytical results',
      'Rich SQL dialect with advanced analytics functions (percentile, lag/lead)',
      'Massive ecosystem: pgAdmin, pg_dump, connection poolers, monitoring tools',
    ],
    useCases: [
      'Star schema warehouse: dim_user, dim_item, dim_category, dim_date + fact tables',
      'Materialized views: mv_daily_kpi, mv_category_performance for fast dashboard queries',
      'Aggregate tables: daily metrics, conversion funnels, retention cohorts',
    ],
  },

  codeExamples: [
    {
      title: 'Star Schema DDL — Fact & Dimension Tables',
      language: 'SQL',
      filename: 'sql/migrations/001_initial_schema.sql',
      description: 'Creates the core star schema with dimension and fact tables, indexes, and constraints.',
      code: `-- =============================================
-- Star Schema: E-Commerce Clickstream Warehouse
-- =============================================

-- Dimension Tables
CREATE TABLE IF NOT EXISTS warehouse.dim_user (
    user_sk      SERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    username     VARCHAR(64),
    email        VARCHAR(128),
    signup_date  DATE,
    country      VARCHAR(64),
    device_type  VARCHAR(32),
    is_active    BOOLEAN DEFAULT TRUE,
    user_segment VARCHAR(32),
    valid_from   TIMESTAMPTZ DEFAULT NOW(),
    valid_to     TIMESTAMPTZ DEFAULT '9999-12-31',
    is_current   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS warehouse.dim_item (
    item_sk         SERIAL PRIMARY KEY,
    item_id         BIGINT NOT NULL,
    item_name       VARCHAR(256),
    category_sk     INTEGER REFERENCES warehouse.dim_category(category_sk),
    brand           VARCHAR(128),
    price_range     VARCHAR(32),
    avg_rating      DECIMAL(3,2),
    is_available    BOOLEAN DEFAULT TRUE,
    first_seen_date DATE
);

CREATE TABLE IF NOT EXISTS warehouse.dim_date (
    date_sk    SERIAL PRIMARY KEY,
    full_date  DATE NOT NULL UNIQUE,
    day_of_week INTEGER,
    day_name   VARCHAR(16),
    week_of_year INTEGER,
    month      INTEGER,
    month_name VARCHAR(16),
    quarter    INTEGER,
    year       INTEGER,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

-- Core Fact Table
CREATE TABLE IF NOT EXISTS warehouse.fact_clickstream (
    event_id        BIGINT PRIMARY KEY,
    user_sk         INTEGER NOT NULL REFERENCES warehouse.dim_user(user_sk),
    item_sk         INTEGER NOT NULL REFERENCES warehouse.dim_item(item_sk),
    date_sk         INTEGER NOT NULL REFERENCES warehouse.dim_date(date_sk),
    event_type      VARCHAR(32) NOT NULL,
    session_id      VARCHAR(64),
    page_url        TEXT,
    referrer        TEXT,
    device_type     VARCHAR(32),
    user_agent      VARCHAR(256),
    event_timestamp TIMESTAMPTZ NOT NULL,
    price           DECIMAL(12,2)
);

-- Indexes for query performance
CREATE INDEX idx_fact_user_sk ON warehouse.fact_clickstream(user_sk);
CREATE INDEX idx_fact_item_sk ON warehouse.fact_clickstream(item_sk);
CREATE INDEX idx_fact_date_sk ON warehouse.fact_clickstream(date_sk);
CREATE INDEX idx_fact_event_ts ON warehouse.fact_clickstream(event_timestamp);
CREATE INDEX idx_fact_event_type ON warehouse.fact_clickstream(event_type);

-- BRIN index for time-range queries (compact, fast for ordered data)
CREATE INDEX idx_fact_date_brin ON warehouse.fact_clickstream USING BRIN (event_timestamp)
    WITH (pages_per_range = 32);`,
    },
    {
      title: 'Materialized View — Daily KPI Dashboard',
      language: 'SQL',
      filename: 'sql/materialized_views/mv_daily_kpi.sql',
      description: 'Pre-aggregated materialized view for the Metabase executive dashboard.',
      code: `-- Daily KPI materialized view for executive dashboard
-- Refreshed daily after dbt run completes

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_daily_kpi AS
SELECT
    d.full_date,
    d.day_name,
    d.is_weekend,
    COUNT(DISTINCT f.user_sk) AS unique_users,
    COUNT(*) AS total_events,
    COUNTIF(f.event_type = 'pv') AS page_views,
    COUNTIF(f.event_type = 'fav') AS favorites,
    COUNTIF(f.event_type = 'cart') AS cart_adds,
    COUNTIF(f.event_type = 'buy') AS purchases,
    ROUND(
        COUNTIF(f.event_type = 'buy')::DECIMAL
        / NULLIF(COUNTIF(f.event_type = 'pv'), 0) * 100, 2
    ) AS conversion_rate,
    COUNT(DISTINCT f.session_id) AS sessions,
    ROUND(AVG(session_duration), 1) AS avg_session_min
FROM warehouse.fact_clickstream f
JOIN warehouse.dim_date d ON f.date_sk = d.date_sk
WHERE d.full_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY 1, 2, 3
ORDER BY d.full_date DESC
WITH DATA;

-- Unique index for concurrent refresh support
CREATE UNIQUE INDEX idx_mv_daily_kpi_date
    ON analytics.mv_daily_kpi(full_date);

-- Refresh command (called by Airflow after dbt run)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_daily_kpi;`,
    },
  ],

  configuration: {
    dockerImage: 'postgres:16-alpine',
    configFiles: [
      { path: 'sql/migrations/001_initial_schema.sql', description: 'Initial star schema DDL with all tables and indexes' },
      { path: 'sql/materialized_views/mv_daily_kpi.sql', description: 'Daily KPI materialized view for dashboards' },
      { path: 'sql/create_schemas.sql', description: 'Creates warehouse and analytics schemas' },
      { path: 'sql/seed_dimensions.sql', description: 'Seed data for dim_date (10 years of calendar entries)' },
    ],
    environmentVars: [
      { key: 'POSTGRES_DB', description: 'Default database name', defaultValue: 'clickstream_warehouse' },
      { key: 'POSTGRES_USER', description: 'Superuser username', defaultValue: 'postgres' },
      { key: 'POSTGRES_PASSWORD', description: 'Superuser password', defaultValue: 'postgres' },
      { key: 'POSTGRES_PORT', description: 'PostgreSQL listen port', defaultValue: '5432' },
      { key: 'POSTGRES_SHARED_BUFFERS', description: 'Shared memory buffer size', defaultValue: '512MB' },
      { key: 'POSTGRES_WORK_MEM', description: 'Work memory per sort/hash operation', defaultValue: '64MB' },
      { key: 'POSTGRES_MAX_CONNECTIONS', description: 'Maximum concurrent connections', defaultValue: '100' },
      { key: 'POSTGRES_VOLUME', description: 'Docker volume for persistent data storage', defaultValue: 'postgres-data:/var/lib/postgresql/data' },
    ],
    ports: '5432',
    resources: '2 GB RAM / 1 vCPU minimum, 8 GB RAM recommended for production',
  },

  integrations: [
    { name: 'dbt', description: 'Writes star schema tables via dbt-postgres adapter', direction: 'upstream' },
    { name: 'Metabase', description: 'Reads warehouse data for dashboard queries via JDBC', direction: 'downstream' },
    { name: 'Airflow', description: 'Metadata DB storage and SQL execution via BashOperator', direction: 'bidirectional' },
  ],
};

// ============================================================================
// 7. Metabase
// ============================================================================

const metabase: TechStackDetail = {
  id: 'metabase',
  name: 'Metabase',
  icon: 'BarChart3',
  color: 'amber',
  category: 'visualization',
  version: '0.49+',
  license: 'AGPL v3',
  website: 'https://www.metabase.com',

  overview: {
    tagline: 'Open-source business intelligence for interactive dashboards',
    description:
      'Metabase is the business intelligence layer that turns the PostgreSQL warehouse data into actionable insights. With 20+ interactive dashboards covering executive KPIs, user behavior analytics, conversion funnels, product performance, and retention cohorts, Metabase empowers both technical and non-technical stakeholders to explore data without writing SQL — while still offering a full SQL editor for advanced queries.',
    keyFeatures: [
      'Visual query builder for non-technical users (drag-and-drop filters)',
      'Native SQL editor with schema browser and auto-complete',
      'Dashboard creation with 15+ visualization types (line, bar, pie, map, funnel)',
      'Scheduled email pulses for automated report delivery',
      'Drill-through analysis: click any chart to explore underlying data',
      'Embeddable dashboards via iframe or API for white-label integration',
    ],
    strengths: [
      'Zero-config setup: connect to PostgreSQL in under 5 minutes',
      'Beautiful default themes with custom branding and color options',
      'Permission system: collection-level access control for teams',
    ],
    useCases: [
      'Executive Overview dashboard: DAU/MAU, revenue, conversion rate KPI cards',
      'Product Analytics dashboard: top categories, item performance, category trends',
      'Retention Analysis dashboard: cohort tables with 1/3/7/14/30-day retention rates',
    ],
  },

  codeExamples: [
    {
      title: 'DAU Trend Dashboard SQL',
      language: 'SQL',
      filename: 'metabase/dashboards/dau_trend.sql',
      description: 'SQL query powering the Daily Active Users trend chart on the executive dashboard.',
      code: `-- Daily Active Users (DAU) Trend — Last 30 Days
-- Used in: Executive Overview Dashboard

SELECT
    full_date AS "Date",
    unique_users AS "DAU",
    page_views AS "Page Views",
    purchases AS "Purchases",
    ROUND(conversion_rate, 2) AS "Conversion Rate %",
    sessions AS "Sessions",
    avg_session_min AS "Avg Session (min)"
FROM analytics.mv_daily_kpi
WHERE full_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY full_date ASC;`,
    },
    {
      title: 'Conversion Funnel Dashboard SQL',
      language: 'SQL',
      filename: 'metabase/dashboards/conversion_funnel.sql',
      description: 'SQL query for the conversion funnel showing drop-off at each stage.',
      code: `-- Conversion Funnel Analysis — Last 30 Days
-- Used in: Conversion Funnel Dashboard

WITH funnel AS (
    SELECT
        full_date,
        page_views,
        favorites,
        cart_adds,
        purchases
    FROM analytics.mv_daily_kpi
    WHERE full_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
    'Page Views' AS "Stage",
    SUM(page_views) AS "Count",
    100.0 AS "Rate %"
FROM funnel
UNION ALL
SELECT
    'Favorites' AS "Stage",
    SUM(favorites) AS "Count",
    ROUND(SUM(favorites)::DECIMAL / NULLIF(SUM(page_views), 0) * 100, 2) AS "Rate %"
FROM funnel
UNION ALL
SELECT
    'Add to Cart' AS "Stage",
    SUM(cart_adds) AS "Count",
    ROUND(SUM(cart_adds)::DECIMAL / NULLIF(SUM(page_views), 0) * 100, 2) AS "Rate %"
FROM funnel
UNION ALL
SELECT
    'Purchases' AS "Stage",
    SUM(purchases) AS "Count",
    ROUND(SUM(purchases)::DECIMAL / NULLIF(SUM(page_views), 0) * 100, 2) AS "Rate %"
FROM funnel;`,
    },
  ],

  configuration: {
    dockerImage: 'metabase/metabase:v0.49.10',
    configFiles: [
      { path: 'metabase/setup/00_create_dashboards.sql', description: 'Automated dashboard creation via Metabase API' },
      { path: 'metabase/setup/01_create_questions.sql', description: 'Saved questions (SQL queries) for dashboard panels' },
    ],
    environmentVars: [
      { key: 'MB_DB_FILE', description: 'Metabase internal database location', defaultValue: '/metabase-data/metabase.db' },
      { key: 'MB_JETTY_PORT', description: 'Metabase web server port', defaultValue: '3000' },
      { key: 'MB_DB_ENCRYPTION_KEY', description: 'Encryption key for sensitive connection credentials', defaultValue: '' },
      { key: 'MB_ADMIN_EMAIL', description: 'Admin user email address', defaultValue: 'admin@example.com' },
      { key: 'MB_ADMIN_PASSWORD', description: 'Initial admin password (change after first login)', defaultValue: 'Admin123!' },
      { key: 'MB_ANON_TRACKING_ENABLED', description: 'Disable anonymous usage tracking', defaultValue: 'false' },
      { key: 'MB_VOLUME', description: 'Docker volume for persistent Metabase data', defaultValue: 'metabase-data:/metabase-data' },
    ],
    ports: '3000 (Web UI)',
    resources: '1 GB RAM / 1 vCPU minimum, 2 GB RAM for concurrent dashboard users',
  },

  integrations: [
    { name: 'PostgreSQL', description: 'Primary data source for all dashboard queries and ad-hoc analysis', direction: 'upstream' },
    { name: 'Slack / Email', description: 'Sends scheduled dashboard pulses and alert notifications', direction: 'downstream' },
  ],
};

// ============================================================================
// 8. Docker
// ============================================================================

const docker: TechStackDetail = {
  id: 'docker',
  name: 'Docker',
  icon: 'Container',
  color: 'teal',
  category: 'orchestration',
  version: '24+',
  license: 'Apache 2.0',
  website: 'https://www.docker.com',

  overview: {
    tagline: 'Containerization platform for reproducible deployments',
    description:
      'Docker provides the containerization backbone that ensures every service in the pipeline runs in an isolated, reproducible, and portable environment. Using Docker Compose, the entire 9-service stack — including FastAPI, MinIO, Spark, Airflow, PostgreSQL, Metabase, and Prometheus — can be launched with a single command. Docker eliminates "works on my machine" issues and enables consistent deployments across development, staging, and production environments.',
    keyFeatures: [
      'Docker Compose for multi-service orchestration with dependency management',
      'Multi-stage Dockerfiles for optimized production images (smaller size, fewer layers)',
      'Docker volumes for persistent data storage across container restarts',
      'Docker networks for isolated inter-service communication',
      'Health checks for automatic container restart on service failure',
      'Resource constraints (CPU, memory limits) per service for predictable performance',
    ],
    strengths: [
      'One-command deployment: docker compose up -d launches the entire stack',
      'Reproducible builds: Dockerfile-as-code ensures consistent environments',
      'Resource efficiency: containers share the host kernel, using ~5x less overhead than VMs',
    ],
    useCases: [
      'Service isolation: each pipeline component runs in its own container with fixed versions',
      'Development environment: mirrors production setup for local testing and debugging',
      'CI/CD: consistent build and test environment in GitHub Actions pipelines',
    ],
  },

  codeExamples: [
    {
      title: 'Docker Compose — Full Pipeline Stack',
      language: 'YAML',
      filename: 'docker-compose.yml',
      description: 'Multi-service Docker Compose file defining the entire pipeline stack with networking and volumes.',
      code: `version: "3.9"

services:
  # --- Data Lake ---
  minio:
    image: minio/minio:RELEASE.2024-01-28
    container_name: minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks: [pipeline]

  # --- Ingestion ---
  ingestion:
    build: ./ingestion
    container_name: ingestion
    ports:
      - "8000:8000"
    environment:
      PORT: "8000"
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    depends_on:
      minio:
        condition: service_healthy
    networks: [pipeline]

  # --- Processing ---
  spark-master:
    image: bitnami/spark:3.5.0
    container_name: spark-master
    environment:
      SPARK_MODE: master
      SPARK_MASTER_PORT: 7077
    ports:
      - "7077:7077"
      - "8080:8080"
    networks: [pipeline]

  spark-worker-1:
    image: bitnami/spark:3.5.0
    environment:
      SPARK_MODE: worker
      SPARK_MASTER_URL: spark://spark-master:7077
      SPARK_WORKER_CORES: 2
      SPARK_WORKER_MEMORY: 2g
    depends_on: [spark-master]
    networks: [pipeline]

  # --- Warehouse ---
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: clickstream_warehouse
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 5
    networks: [pipeline]

  # --- Orchestration ---
  airflow:
    build: ./airflow
    container_name: airflow
    ports:
      - "8080:8080"
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql://postgres:postgres@postgres/airflow
    depends_on:
      postgres:
        condition: service_healthy
    networks: [pipeline]

  # --- Monitoring ---
  prometheus:
    image: prom/prometheus:v2.48.1
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks: [pipeline]

volumes:
  minio-data:
  postgres-data:

networks:
  pipeline:
    driver: bridge`,
    },
    {
      title: 'Multi-Stage Dockerfile — Ingestion Service',
      language: 'Dockerfile',
      filename: 'ingestion/Dockerfile',
      description: 'Optimized multi-stage Dockerfile for the FastAPI ingestion service.',
      code: `# Stage 1: Dependencies
FROM python:3.12-slim AS deps
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

# Install only runtime dependencies
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

# Copy application code
COPY app/ ./app/
COPY scripts/ ./scripts/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"

# Expose port
EXPOSE 8000

# Start with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]`,
    },
  ],

  configuration: {
    dockerImage: 'docker:24 (Docker Engine)',
    configFiles: [
      { path: 'docker-compose.yml', description: 'Full pipeline stack with 9+ services, volumes, and networking' },
      { path: 'ingestion/Dockerfile', description: 'Multi-stage Dockerfile for FastAPI ingestion' },
      { path: 'spark/Dockerfile', description: 'Custom Spark image with Python dependencies' },
      { path: 'airflow/Dockerfile', description: 'Custom Airflow image with dbt and providers' },
      { path: '.dockerignore', description: 'Excludes .git, node_modules, __pycache__ from builds' },
    ],
    environmentVars: [
      { key: 'COMPOSE_PROJECT_NAME', description: 'Docker Compose project name prefix', defaultValue: 'clickstream-pipeline' },
      { key: 'COMPOSE_FILE', description: 'Path to docker-compose.yml', defaultValue: 'docker-compose.yml' },
      { key: 'DOCKER_BUILDKIT', description: 'Enable BuildKit for parallel and cached builds', defaultValue: '1' },
    ],
    ports: 'Varies per service (8000, 9000, 9001, 8080, 5432, 3000, 9090)',
    resources: 'Host requires 16 GB RAM / 4 vCPU minimum for full stack',
  },

  integrations: [
    { name: 'All Services', description: 'Every pipeline component runs as an isolated Docker container', direction: 'bidirectional' },
    { name: 'Docker Volumes', description: 'Persistent storage for MinIO, PostgreSQL, and Metabase data', direction: 'bidirectional' },
    { name: 'Docker Networks', description: 'Internal bridge network for secure inter-container communication', direction: 'bidirectional' },
  ],
};

// ============================================================================
// 9. Prometheus
// ============================================================================

const prometheus: TechStackDetail = {
  id: 'prometheus',
  name: 'Prometheus',
  icon: 'Activity',
  color: 'rose',
  category: 'orchestration',
  version: '2.48+',
  license: 'Apache 2.0',
  website: 'https://prometheus.io',

  overview: {
    tagline: 'Monitoring and alerting for cloud-native infrastructure',
    description:
      'Prometheus is the central monitoring system that collects, stores, and alerts on time-series metrics from every pipeline service. It scrapes metrics endpoints from FastAPI, Spark, Airflow, MinIO, PostgreSQL, and Metabase — tracking ingestion rates, processing latency, DAG run durations, resource utilization, and data quality KPIs. Alertmanager routes critical alerts to Slack and email for rapid incident response.',
    keyFeatures: [
      'Pull-based metric collection via HTTP scrape with service discovery',
      'PromQL query language for powerful time-series analysis and aggregation',
      'Multi-dimensional time-series data model with labels and annotations',
      'Alertmanager for deduplication, grouping, and routing of alert notifications',
      'Grafana integration for rich visualization dashboards',
      'Prometheus federation for scaling across multiple Prometheus instances',
    ],
    strengths: [
      'Simple deployment: single binary with no external dependencies',
      'Powerful PromQL: complex queries like rate(), histogram_quantile(), and absent()',
      'Reliable storage: local TSDB with remote write support for long-term retention',
    ],
    useCases: [
      'Pipeline health monitoring: ingestion rate, processing latency, error rates',
      'Data quality alerting: null ratio threshold, row count parity checks',
      'Resource monitoring: CPU, memory, and disk usage per container',
    ],
  },

  codeExamples: [
    {
      title: 'Prometheus Scraping Configuration',
      language: 'YAML',
      filename: 'monitoring/prometheus.yml',
      description: 'Prometheus configuration defining scrape targets, intervals, and alerting rules.',
      code: `global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "alert_rules/*.yml"

scrape_configs:
  # Prometheus self-monitoring
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # FastAPI Ingestion
  - job_name: "ingestion"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["ingestion:8000"]
    scrape_interval: 10s

  # Spark Master
  - job_name: "spark-master"
    static_configs:
      - targets: ["spark-master:8080"]

  # Spark Workers
  - job_name: "spark-workers"
    static_configs:
      - targets:
          - "spark-worker-1:8081"

  # PostgreSQL Exporter
  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  # MinIO (if mc-prometheus-exporter available)
  - job_name: "minio"
    static_configs:
      - targets: ["minio:9000"]

  # Airflow
  - job_name: "airflow"
    metrics_path: "/admin/metrics"
    static_configs:
      - targets: ["airflow:8080"]

  # Node Exporter (host metrics)
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]`,
    },
    {
      title: 'Pipeline Health Alert Rules',
      language: 'YAML',
      filename: 'monitoring/alert_rules/pipeline_health.yml',
      description: 'Alerting rules for pipeline health, data quality, and resource thresholds.',
      code: `groups:
  - name: pipeline_health
    rules:
      # Ingestion stopped
      - alert: IngestionStopped
        expr: rate(ingestion_rows_total{status="success"}[5m]) == 0
        for: 30m
        labels:
          severity: critical
        annotations:
          summary: "Ingestion service has not processed rows in 30 minutes"
          runbook: "https://wiki/runbooks/ingestion-stopped"

      # High error rate
      - alert: HighValidationErrorRate
        expr: |
          (
            sum(rate(ingestion_rows_total{status="error"}[5m]))
            / sum(rate(ingestion_rows_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Validation error rate exceeds 5%: {{ $value | humanizePercentage }}"

      # Spark job latency
      - alert: SparkJobSlow
        expr: histogram_quantile(0.95, rate(spark_job_duration_seconds_bucket[10m])) > 1200
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Spark job p95 latency exceeds 20 minutes"

      # DAG run failure
      - alert: AirflowDAGFailed
        expr: airflow_dag_run_status{status="failed"} > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Airflow DAG {{ $labels.dag_id }} has failed"

      # PostgreSQL connection pool exhaustion
      - alert: PostgresConnectionPoolHigh
        expr: pg_stat_activity_count / pg_settings_max_connections > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL connection pool at {{ $value | humanizePercentage }} capacity"

  - name: resource_usage
    rules:
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Node memory usage above 90%"`,
    },
  ],

  configuration: {
    dockerImage: 'prom/prometheus:v2.48.1',
    configFiles: [
      { path: 'monitoring/prometheus.yml', description: 'Main Prometheus config: scrape targets and intervals' },
      { path: 'monitoring/alert_rules/pipeline_health.yml', description: 'Alerting rules for pipeline health and data quality' },
      { path: 'monitoring/alert_rules/resource_usage.yml', description: 'Alerting rules for host resource thresholds' },
      { path: 'monitoring/grafana/provisioning/datasources.yml', description: 'Grafana datasource auto-provisioning config' },
    ],
    environmentVars: [
      { key: 'PROMETHEUS_CONFIG_FILE', description: 'Path to prometheus.yml configuration', defaultValue: '/etc/prometheus/prometheus.yml' },
      { key: 'PROMETHEUS_STORAGE_PATH', description: 'Local TSDB data storage directory', defaultValue: '/prometheus' },
      { key: 'PROMETHEUS_RETENTION_TIME', description: 'Data retention period', defaultValue: '15d' },
      { key: 'PROMETHEUS_WEB_PORT', description: 'Prometheus web UI and API port', defaultValue: '9090' },
      { key: 'PROMETHEUS_SCRAPE_INTERVAL', description: 'Default interval between metric scrapes', defaultValue: '15s' },
      { key: 'PROMETHEUS_VOLUME', description: 'Docker volume for persistent TSDB storage', defaultValue: 'prometheus-data:/prometheus' },
    ],
    ports: '9090 (Web UI & API)',
    resources: '1 GB RAM / 0.5 vCPU (minimum), 4 GB RAM for large metric cardinality',
  },

  integrations: [
    { name: 'FastAPI', description: 'Scrapes /metrics endpoint for ingestion rate, errors, latency', direction: 'upstream' },
    { name: 'Spark', description: 'Scrapes Master/Worker metrics for job duration, executor status', direction: 'upstream' },
    { name: 'Airflow', description: 'Scrapes /admin/metrics for DAG run counts, durations, failures', direction: 'upstream' },
    { name: 'PostgreSQL Exporter', description: 'Collects connection pool, query performance, and lock metrics', direction: 'upstream' },
    { name: 'Grafana', description: 'Serves as data source for Grafana dashboard visualization', direction: 'downstream' },
  ],
};

// ============================================================================
// Export
// ============================================================================

export const techStackDetails: TechStackDetail[] = [
  fastapi,
  minio,
  spark,
  airflow,
  dbt,
  postgres,
  metabase,
  docker,
  prometheus,
];

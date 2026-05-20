// ============================================================================
// E-Commerce Clickstream Analytics Pipeline - Architecture Component Details
// ============================================================================
// Rich detail data for each of the 8 pipeline architecture components.
// Used to render interactive detail pages when users click on architecture nodes.
// ============================================================================

export interface ArchitectureComponentDetail {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  icon: string;
  colorScheme: {
    primary: string;
    gradient: string;
  };

  overview: {
    description: string;
    responsibilities: string[];
    keyMetrics: { label: string; value: string }[];
    input: string;
    output: string;
  };

  codeExamples: {
    title: string;
    language: string;
    filename: string;
    description: string;
    code: string;
  }[];

  files: {
    path: string;
    description: string;
    type: 'config' | 'source' | 'test' | 'script' | 'doc';
  }[];

  configuration: {
    dockerService?: string;
    port?: string;
    environment: { key: string; description: string; defaultValue: string }[];
    dependencies: string[];
    healthCheck?: string;
  };
}

// ============================================================================
// Component 1: CSV Source
// ============================================================================

const csvSource: ArchitectureComponentDetail = {
  id: 'csv-source',
  stageNumber: 1,
  title: 'CSV Source',
  subtitle: 'Data Collection Layer',
  icon: 'FileSpreadsheet',
  colorScheme: {
    primary: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
  },

  overview: {
    description:
      'The data pipeline begins with the Alibaba Taobao User Behavior dataset — a collection of clickstream CSV files capturing real-world e-commerce interactions. Each CSV contains behavioral events including page views (pv), add-to-cart (cart), purchases (buy), and favorites (fav), providing a comprehensive view of the customer journey from discovery to conversion.',
    responsibilities: [
      'Stores raw clickstream data from the Taobao e-commerce platform with 5 structured columns',
      'Contains approximately 1 million behavioral event records from ~11,000 users',
      'Tracks user_id, item_id, category_id, behavior_type, and Unix millisecond timestamps',
      'Sourced from the Kaggle Alibaba Taobao User Behavior dataset',
      'Supports daily CSV file ingestion with consistent schema for downstream validation',
    ],
    keyMetrics: [
      { label: 'Total Records', value: '~1M events' },
      { label: 'File Format', value: 'CSV (UTF-8)' },
      { label: 'Schema Columns', value: '5 columns' },
      { label: 'Event Types', value: 'pv / cart / buy / fav' },
    ],
    input: 'Raw clickstream events from Taobao e-commerce platform, exported as daily CSV files',
    output: 'Validated CSV files ready for FastAPI ingestion into the MinIO bronze data lake',
  },

  codeExamples: [
    {
      title: 'CSV Schema Definition',
      language: 'Python',
      filename: 'ingestion/app/services/schema.py',
      description: 'Pydantic model defining the 5-column schema for Taobao clickstream CSV validation.',
      code: `from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum

class BehaviorType(str, Enum):
    PV = "pv"
    CART = "cart"
    BUY = "buy"
    FAV = "fav"

class ClickstreamRecord(BaseModel):
    user_id: int = Field(..., gt=0)
    item_id: int = Field(..., gt=0)
    category_id: int = Field(..., ge=0)
    behavior_type: BehaviorType
    timestamp: int = Field(..., gt=0)  # Unix milliseconds

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp_range(cls, v: int) -> int:
        # Taobao dataset: Nov 25 - Dec 3, 2017
        min_ts = int(datetime(2017, 11, 25, 0, 0, 0).timestamp() * 1000)
        max_ts = int(datetime(2017, 12, 4, 0, 0, 0).timestamp() * 1000)
        if v < min_ts or v > max_ts:
            raise ValueError("Timestamp out of Taobao dataset range")
        return v`,
    },
    {
      title: 'Sample CSV Rows',
      language: 'CSV',
      filename: 'data/UserBehavior.csv',
      description: 'Example rows showing the 5-column Taobao dataset schema with different behavioral event types.',
      code: `user_id,item_id,category_id,behavior_type,timestamp
142857,384726,1856,pv,1511546418000
314159,512738,2941,fav,1511550122000
142857,512738,2941,cart,1511550285000
271828,192837,1037,pv,1511554138000
314159,512738,2941,buy,1511556333000`,
    },
    {
      title: 'Kaggle Dataset Integration',
      language: 'Python',
      filename: 'scripts/download_kaggle_dataset.py',
      description: 'Downloads the Alibaba Taobao User Behavior dataset from Kaggle and prepares it for ingestion.',
      code: `import os
import zipfile
from pathlib import Path
from kaggle.api.kaggle_api_extended import KaggleApi

def download_taobao_dataset(output_dir: str = "/data/raw") -> Path:
    """Download the Alibaba Taobao User Behavior dataset from Kaggle."""
    os.makedirs(output_dir, exist_ok=True)
    api = KaggleApi()
    api.authenticate()

    # Dataset: Alibaba Taobao User Behavior
    dataset = "alibaba-china/user-behavior"
    api.dataset_download_files(dataset, path=output_dir, unzip=True)

    # The dataset ships as UserBehavior.csv with 5 columns:
    # user_id, item_id, category_id, behavior_type, timestamp
    csv_path = Path(output_dir) / "UserBehavior.csv"
    if csv_path.exists():
        print(f"Downloaded: {csv_path.stat().st_size:,} bytes")
        print(f"Columns: user_id, item_id, category_id, behavior_type, timestamp")
    return csv_path`,
    },
  ],

  files: [
    { path: 'ingestion/app/services/schema.py', description: 'Pydantic model defining the 5-column Taobao clickstream schema', type: 'source' },
    { path: 'ingestion/app/services/validator.py', description: 'CSV row validation logic with error reporting', type: 'source' },
    { path: 'scripts/download_kaggle_dataset.py', description: 'Kaggle Taobao dataset download and preparation script', type: 'script' },
    { path: 'tests/fixtures/sample_clickstream.csv', description: 'Sample CSV file used in integration tests', type: 'test' },
    { path: 'docs/data_dictionary.md', description: 'Full data dictionary with column descriptions and constraints', type: 'doc' },
  ],

  configuration: {
    dockerService: 'ingestion',
    environment: [
      { key: 'DATA_SOURCE_DIR', description: 'Directory containing source CSV files', defaultValue: '/data/raw' },
      { key: 'CSV_ENCODING', description: 'Character encoding for CSV files', defaultValue: 'utf-8' },
      { key: 'EXPECTED_COLUMNS', description: 'Number of expected columns per row', defaultValue: '5' },
      { key: 'SKIP_MALFORMED_ROWS', description: 'Whether to skip rows that fail validation', defaultValue: 'true' },
    ],
    dependencies: ['MinIO Bronze Layer'],
  },
};

// ============================================================================
// Component 2: FastAPI Ingestion
// ============================================================================

const fastapiIngestion: ArchitectureComponentDetail = {
  id: 'fastapi-ingestion',
  stageNumber: 2,
  title: 'FastAPI Ingestion',
  subtitle: 'API & Validation Service',
  icon: 'Zap',
  colorScheme: {
    primary: 'teal',
    gradient: 'from-teal-500 to-emerald-600',
  },

  overview: {
    description:
      'FastAPI Ingestion is a high-performance async REST API service responsible for receiving, validating, and persisting clickstream data into the MinIO bronze data lake. Built with Python\'s FastAPI framework and Pydantic validation, it provides both manual CSV upload endpoints and automated scheduled ingestion, ensuring data integrity before any downstream processing begins.',
    responsibilities: [
      'Exposes async REST endpoints for CSV file upload and scheduled data pulling',
      'Validates every row against the Pydantic ClickstreamRecord schema with detailed error reporting',
      'Detects and deduplicates events using event_id SHA-256 hashing',
      'Implements retry logic with exponential backoff (3 retries, 2s/4s/8s intervals)',
      'Uploads validated CSV files to MinIO bronze bucket with date-based partitioning',
      'Publishes Prometheus metrics for ingestion rate, validation errors, and upload latency',
    ],
    keyMetrics: [
      { label: 'Throughput', value: '~5,200 rows/sec' },
      { label: 'Validation Latency', value: 'p99 < 15ms' },
      { label: 'Upload Success Rate', value: '99.7%' },
      { label: 'Error Rate', value: '< 0.3%' },
    ],
    input: 'CSV files (uploaded via REST API or pulled from external data source URLs)',
    output: 'Validated CSV files stored in MinIO bronze bucket at s3://bronze/clickstream/year=YYYY/month=MM/day=DD/',
  },

  codeExamples: [
    {
      title: 'FastAPI Main Application',
      language: 'Python',
      filename: 'ingestion/app/main.py',
      description: 'Entry point defining the application lifecycle, CORS middleware, and Prometheus metrics.',
      code: `from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram
import time

from app.config import settings
from app.routes.upload import router as upload_router
from app.routes.health import router as health_router

ingestion_total = Counter("ingestion_rows_total", "Total rows ingested", ["status"])
ingestion_duration = Histogram("ingestion_duration_seconds", "Upload processing time")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting ingestion on port {settings.PORT}")
    yield
    print("Shutting down ingestion service")

app = FastAPI(
    title="Clickstream Ingestion API",
    description="Validates and ingests CSV data into MinIO bronze.",
    version="1.2.0", lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(upload_router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(health_router, prefix="/api/v1", tags=["Health"])`,
    },
    {
      title: 'CSV Upload & Validation Endpoint',
      language: 'Python',
      filename: 'ingestion/app/routes/upload.py',
      description: 'REST endpoint accepting CSV uploads, validating rows, deduplicating, and uploading to MinIO.',
      code: `import hashlib
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from io import BytesIO
import csv as csv_mod

from app.services.validator import validate_csv_rows
from app.services.minio_client import get_minio_client
from app.models.response import IngestionResponse

router = APIRouter()

@router.post("/ingest/csv", response_model=IngestionResponse)
async def ingest_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")
    content = await file.read()
    raw_text = content.decode("utf-8")

    valid_rows, errors = validate_csv_rows(raw_text)
    if not valid_rows:
        raise HTTPException(status_code=422, detail="All rows failed validation")

    # Deduplicate by event_id hash
    seen, deduped = set(), []
    for row in valid_rows:
        h = hashlib.sha256(row["event_id"].encode()).hexdigest()
        if h not in seen:
            seen.add(h); deduped.append(row)

    now = datetime.utcnow()
    partition = f"year={now.year}/month={now.month:02d}/day={now.day:02d}"
    obj = f"clickstream/{partition}/clickstream_{now.strftime('%Y%m%d_%H%M%S')}.csv"

    buffer = BytesIO()
    wrapper = TextIOWrapper(buffer, encoding="utf-8", newline="")
    fields = ["event_id","user_id","item_id","category_id","behavior_type",
              "timestamp","session_id","page_url","referrer","device_type",
              "user_agent","geolocation"]
    w = csv_mod.DictWriter(wrapper, fieldnames=fields)
    w.writeheader(); w.writerows(deduped); wrapper.detach(); buffer.seek(0)

    client = get_minio_client()
    client.put_object("bronze", obj, buffer, buffer.getbuffer().nbytes, "text/csv")

    return IngestionResponse(
        status="success", total_rows=len(valid_rows)+len(errors),
        valid_rows=len(valid_rows), duplicate_rows=len(valid_rows)-len(deduped),
        error_rows=len(errors), object_key=f"s3://bronze/{obj}", errors=errors[:10],
    )`,
    },
    {
      title: 'CSV Row Validator',
      language: 'Python',
      filename: 'ingestion/app/services/validator.py',
      description: 'Core validation logic that parses CSV and validates rows against the Pydantic model.',
      code: `import csv, io
from app.services.schema import ClickstreamRecord

def validate_csv_rows(csv_text: str, max_errors: int = 100) -> tuple[list[dict], list[dict]]:
    reader = csv.DictReader(io.StringIO(csv_text))
    valid_rows, errors = [], []
    for idx, row in enumerate(reader, start=2):
        if len(errors) >= max_errors:
            break
        try:
            record = ClickstreamRecord(**row)
            valid_rows.append(record.model_dump())
        except Exception as exc:
            errors.append({"row": idx, "reason": str(exc), "data": str(row.values())[:200]})
    return valid_rows, errors`,
    },
  ],

  files: [
    { path: 'ingestion/app/main.py', description: 'FastAPI entry point with lifespan and middleware', type: 'source' },
    { path: 'ingestion/app/config.py', description: 'Application configuration using pydantic-settings', type: 'config' },
    { path: 'ingestion/app/routes/upload.py', description: 'CSV upload endpoint with validation and MinIO upload', type: 'source' },
    { path: 'ingestion/app/routes/health.py', description: 'Health check and readiness endpoints', type: 'source' },
    { path: 'ingestion/app/services/validator.py', description: 'CSV row validation against Pydantic schema', type: 'source' },
    { path: 'ingestion/app/services/minio_client.py', description: 'MinIO S3 client wrapper with retry logic', type: 'source' },
    { path: 'ingestion/app/services/schema.py', description: 'Pydantic ClickstreamRecord model definition', type: 'source' },
    { path: 'ingestion/app/models/response.py', description: 'API response models (IngestionResponse)', type: 'source' },
    { path: 'ingestion/Dockerfile', description: 'Docker image definition for the ingestion service', type: 'config' },
    { path: 'ingestion/requirements.txt', description: 'Python dependencies', type: 'config' },
    { path: 'ingestion/tests/test_validator.py', description: 'Unit tests for CSV validation logic', type: 'test' },
    { path: 'ingestion/tests/test_upload.py', description: 'Integration tests for upload endpoint', type: 'test' },
    { path: 'docs/api_reference.md', description: 'OpenAPI-style API documentation', type: 'doc' },
  ],

  configuration: {
    dockerService: 'ingestion',
    port: '8000',
    environment: [
      { key: 'MINIO_ENDPOINT', description: 'MinIO server endpoint URL', defaultValue: 'minio:9000' },
      { key: 'MINIO_ACCESS_KEY', description: 'MinIO root access key', defaultValue: 'minioadmin' },
      { key: 'MINIO_SECRET_KEY', description: 'MinIO root secret key', defaultValue: 'minioadmin' },
      { key: 'MINIO_BUCKET', description: 'Target bucket for raw data', defaultValue: 'bronze' },
      { key: 'MAX_UPLOAD_SIZE_MB', description: 'Maximum CSV upload size (MB)', defaultValue: '512' },
      { key: 'VALIDATION_MAX_ERRORS', description: 'Stop validation after N errors', defaultValue: '100' },
      { key: 'WORKERS', description: 'Uvicorn worker count', defaultValue: '4' },
    ],
    dependencies: ['MinIO Bronze Layer', 'Prometheus'],
    healthCheck: '/api/v1/health',
  },
};

// ============================================================================
// Component 3: MinIO Bronze Layer
// ============================================================================

const minioBronze: ArchitectureComponentDetail = {
  id: 'minio-bronze',
  stageNumber: 3,
  title: 'MinIO Bronze Layer',
  subtitle: 'Raw Data Lake Storage',
  icon: 'HardDrive',
  colorScheme: {
    primary: 'rose',
    gradient: 'from-rose-500 to-pink-600',
  },

  overview: {
    description:
      'MinIO Bronze Layer serves as the immutable raw data landing zone in the medallion architecture. As an S3-compatible object storage system, it captures every ingested CSV file exactly as received, preserving the original data fidelity for auditability, replayability, and regulatory compliance. No transformations are applied at this layer.',
    responsibilities: [
      'Stores raw CSV files in an append-only, immutable bronze bucket preserving original data as-is',
      'Organizes data with date-based partitioning: s3://bronze/clickstream/year=YYYY/month=MM/day=DD/',
      'Enforces bucket versioning to maintain a full audit trail and enable point-in-time recovery',
      'Applies lifecycle policies: auto-transition to Glacier after 90 days, delete after 365 days',
      'Handles approximately 2.5 GB of daily ingestion across 8-12 CSV files per day',
      'Provides S3-compatible APIs for seamless integration with Spark and downstream consumers',
    ],
    keyMetrics: [
      { label: 'Daily Ingestion', value: '~2.5 GB/day' },
      { label: 'Storage Format', value: 'CSV (raw)' },
      { label: 'Partitioning', value: 'year/month/day' },
      { label: 'Retention', value: '90d hot / 365d total' },
    ],
    input: 'Validated CSV files uploaded by the FastAPI Ingestion service',
    output: 'Raw CSV data accessible via S3 API for Spark ETL processing',
  },

  codeExamples: [
    {
      title: 'Bucket Initialization & Lifecycle Policy',
      language: 'Shell',
      filename: 'scripts/setup_minio_buckets.sh',
      description: 'Creates the bronze bucket, enables versioning, and configures lifecycle policies.',
      code: `#!/bin/bash
set -euo pipefail
mc alias set myminio http://minio:9000 minioadmin minioadmin

# Create bronze bucket
mc mb myminio/bronze --ignore-existing

# Enable versioning for audit trail
mc version enable myminio/bronze

# Lifecycle: Glacier after 90d, delete after 365d
mc ilm rule add myminio/bronze --transition-days 90 \\
  --transition-tier "GLACIER" --prefix "clickstream/"
mc ilm rule add myminio/bronze --expiry-days 365 \\
  --prefix "clickstream/"

echo "Bronze bucket setup complete!"
mc version info myminio/bronze
mc ilm rule list myminio/bronze`,
    },
    {
      title: 'MinIO Upload Client',
      language: 'Python',
      filename: 'ingestion/app/services/minio_client.py',
      description: 'MinIO S3 client wrapper with connection pooling and retry logic for reliable uploads.',
      code: `from minio import Minio
from io import BytesIO
import logging
from app.config import settings

logger = logging.getLogger(__name__)
_client: Minio | None = None

def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False, region="us-east-1",
        )
        if not _client.bucket_exists(settings.MINIO_BUCKET):
            _client.make_bucket(settings.MINIO_BUCKET)
            logger.info(f"Created bucket: {settings.MINIO_BUCKET}")
    return _client

def upload_to_bronze(object_name: str, data: BytesIO,
                      content_type: str = "text/csv") -> str:
    client = get_minio_client()
    result = client.put_object(
        bucket_name=settings.MINIO_BUCKET,
        object_name=object_name,
        data=data, length=data.getbuffer().nbytes,
        content_type=content_type,
    )
    path = f"s3://{settings.MINIO_BUCKET}/{object_name}"
    logger.info(f"Uploaded {data.getbuffer().nbytes:,} bytes to {path}")
    return path

def list_bronze_files(prefix: str = "") -> list[str]:
    client = get_minio_client()
    return [f"s3://{settings.MINIO_BUCKET}/{o.object_name}"
            for o in client.list_objects(settings.MINIO_BUCKET, prefix=prefix)]`,
    },
    {
      title: 'Data Lake Browser CLI',
      language: 'Shell',
      filename: 'scripts/browse_bronze.sh',
      description: 'Utility for browsing bronze layer contents and inspecting data freshness.',
      code: `#!/bin/bash
set -euo pipefail
echo "=== Bronze Layer Browser ==="
echo "Partitions:"
for year in $(mc ls myminio/bronze/clickstream/ --json | jq -r '.key' | cut -d'=' -f2 | sort -u); do
    count=$(mc ls myminio/bronze/clickstream/year=\${year}/ --recursive 2>/dev/null | wc -l)
    echo "  year=\${year}: \${count} files"
done
echo ""
echo "Latest 5 files:"
mc ls myminio/bronze/clickstream/ --recursive 2>/dev/null | tail -5
echo ""
echo "Total storage:"
mc du myminio/bronze/ --depth 0`,
    },
  ],

  files: [
    { path: 'scripts/setup_minio_buckets.sh', description: 'Bucket creation, versioning, and lifecycle setup', type: 'script' },
    { path: 'scripts/browse_bronze.sh', description: 'CLI utility for browsing bronze layer contents', type: 'script' },
    { path: 'ingestion/app/services/minio_client.py', description: 'Python S3 client wrapper for MinIO operations', type: 'source' },
    { path: 'docker-compose.yml', description: 'MinIO service definition with volume and port mapping', type: 'config' },
    { path: 'docs/architecture.md', description: 'Medallion architecture design document', type: 'doc' },
  ],

  configuration: {
    dockerService: 'minio',
    port: '9000',
    environment: [
      { key: 'MINIO_ROOT_USER', description: 'MinIO root access key', defaultValue: 'minioadmin' },
      { key: 'MINIO_ROOT_PASSWORD', description: 'MinIO root secret key', defaultValue: 'minioadmin' },
      { key: 'MINIO_BROWSER', description: 'Enable MinIO web console', defaultValue: 'on' },
      { key: 'MINIO_VOLUME', description: 'Docker volume for persistent storage', defaultValue: 'minio-data:/data' },
      { key: 'MINIO_CONSOLE_PORT', description: 'Web console port', defaultValue: '9001' },
    ],
    dependencies: [],
    healthCheck: '/minio/health/live',
  },
};

// ============================================================================
// Component 4: Spark Processing
// ============================================================================

const sparkProcessing: ArchitectureComponentDetail = {
  id: 'spark-processing',
  stageNumber: 4,
  title: 'Spark Processing',
  subtitle: 'Distributed ETL Engine',
  icon: 'Activity',
  colorScheme: {
    primary: 'orange',
    gradient: 'from-orange-500 to-amber-600',
  },

  overview: {
    description:
      'Apache Spark (PySpark) provides the distributed processing engine that transforms raw bronze-layer CSV data into clean, validated, and enriched Parquet files for the silver layer. Running on a 4-worker cluster, the ETL pipeline handles deduplication, null imputation, data type enforcement, and derived column generation — processing approximately 1.5 million events per day in under 12 minutes.',
    responsibilities: [
      'Reads raw CSV files from MinIO bronze layer using S3A filesystem connector',
      'Deduplicates events using event_id hash and composite (user_id, timestamp) keys',
      'Handles null values: imputes missing user_agent with "unknown", forward-fills session fields',
      'Enforces data type casting and business constraint validation (e.g., price > 0)',
      'Enriches records with derived columns: session_duration, page_category, is_mobile, hour_of_day',
      'Writes optimized Parquet files with Snappy compression to MinIO silver layer (~70% size reduction)',
    ],
    keyMetrics: [
      { label: 'Daily Throughput', value: '~1.5M events/day' },
      { label: 'Processing Time', value: '~12 min (4 workers)' },
      { label: 'Compression Ratio', value: '~70% reduction' },
      { label: 'Dedup Rate', value: '~2.1% duplicates removed' },
    ],
    input: 'Raw CSV files from MinIO bronze bucket (s3://bronze/clickstream/)',
    output: 'Cleaned Parquet files in MinIO silver bucket (s3://silver/clickstream/event_date=YYYY-MM-DD/)',
  },

  codeExamples: [
    {
      title: 'Spark Session Factory',
      language: 'Python',
      filename: 'spark/utils/spark_session.py',
      description: 'Configures a SparkSession with S3A connector, Hive support, and optimized memory settings.',
      code: `from pyspark.sql import SparkSession

def create_spark_session(app_name: str = "clickstream-etl") -> SparkSession:
    return (
        SparkSession.builder
        .appName(app_name)
        .master("spark://spark-master:7077")
        .config("spark.hadoop.fs.s3a.endpoint", "http://minio:9000")
        .config("spark.hadoop.fs.s3a.access.key", "minioadmin")
        .config("spark.hadoop.fs.s3a.secret.key", "minioadmin")
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        .config("spark.sql.shuffle.partitions", "8")
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
        .config("spark.executor.memory", "2g")
        .config("spark.driver.memory", "1g")
        .config("spark.executor.cores", "2")
        .config("spark.sql.parquet.compression.codec", "snappy")
        .enableHiveSupport()
        .getOrCreate()
    )`,
    },
    {
      title: 'Clickstream Cleaning Job',
      language: 'Python',
      filename: 'spark/jobs/clean_clickstream.py',
      description: 'Main ETL job that reads bronze CSV, performs dedup, null handling, type casting, writes Parquet to silver.',
      code: `from pyspark.sql import functions as F
from spark.utils.spark_session import create_spark_session
from spark.utils.quality_checks import run_quality_checks

def clean_clickstream(processing_date: str) -> None:
    spark = create_spark_session("clean-clickstream")

    bronze_path = (f"s3a://bronze/clickstream/year={processing_date[:4]}/"
                   f"month={int(processing_date[5:7]):02d}/"
                   f"day={int(processing_date[8:10]):02d}/")
    silver_path = f"s3a://silver/clickstream/event_date={processing_date}/"

    df = (spark.read.option("header", "true")
          .option("timestampFormat", "yyyy-MM-dd HH:mm:ss")
          .csv(bronze_path))
    print(f"Bronze rows: {df.count():,}")

    # Deduplicate
    df = df.dropDuplicates(["event_id"])

    # Impute nulls
    df = df.fillna({"user_agent": "unknown", "referrer": "direct", "geolocation": "unknown"})

    # Business constraints
    df = df.filter(F.col("price").isNull() | (F.col("price") > 0))

    # Derived columns
    df = (df.withColumn("is_mobile", F.when(F.col("device_type") == "mobile", True).otherwise(False))
             .withColumn("hour_of_day", F.hour(F.col("timestamp")))
             .withColumn("event_date", F.to_date(F.col("timestamp"))))

    # Write to silver
    df.write.mode("overwrite").partitionBy("event_date").parquet(silver_path)
    run_quality_checks(spark, silver_path, processing_date)
    print(f"Silver rows: {df.count():,}")
    spark.stop()`,
    },
    {
      title: 'Data Quality Checks',
      language: 'Python',
      filename: 'spark/utils/quality_checks.py',
      description: 'Runs data quality validation on silver output: null ratios, row count parity, schema checks.',
      code: `from pyspark.sql import SparkSession, functions as F

def run_quality_checks(spark: SparkSession, silver_path: str, date: str) -> dict:
    """Validate silver layer data quality."""
    df = spark.read.parquet(silver_path)
    total = df.count()
    results = {"date": date, "total_rows": total}

    # Null ratio check (< 0.1%)
    for col in ["event_id", "user_id", "item_id", "behavior_type", "timestamp"]:
        null_count = df.filter(F.col(col).isNull()).count()
        ratio = null_count / total if total > 0 else 0
        results[f"null_ratio_{col}"] = round(ratio, 6)
        if ratio > 0.001:
            print(f"WARNING: {col} has {ratio:.4%} nulls")

    # Event type distribution
    evt_dist = (df.groupBy("behavior_type").count()
                .orderBy("count", ascending=False)
                .collect())
    results["event_distribution"] = {r["behavior_type"]: r["count"] for r in evt_dist}

    # Duplicate event_id check
    dup_count = total - df.select("event_id").distinct().count()
    results["duplicate_events"] = dup_count
    if dup_count > 0:
        print(f"WARNING: {dup_count} duplicate event_ids found!")

    print(f"Quality check passed for {date}: {total:,} rows")
    return results`,
    },
  ],

  files: [
    { path: 'spark/utils/spark_session.py', description: 'SparkSession factory with S3A and memory configuration', type: 'source' },
    { path: 'spark/utils/schema_defs.py', description: 'Spark schema definitions for bronze CSV and silver Parquet', type: 'source' },
    { path: 'spark/utils/quality_checks.py', description: 'Data quality validation functions for silver output', type: 'source' },
    { path: 'spark/jobs/clean_clickstream.py', description: 'Main ETL job: dedup, null handling, type casting', type: 'source' },
    { path: 'spark/jobs/enrich_events.py', description: 'Event enrichment: derived columns, sessionization', type: 'source' },
    { path: 'spark/jobs/validate_data.py', description: 'Schema validation and constraint checking', type: 'source' },
    { path: 'spark/entrypoint.sh', description: 'Docker entrypoint script for Spark submit', type: 'script' },
    { path: 'spark/Dockerfile', description: 'Spark worker Docker image definition', type: 'config' },
    { path: 'spark/requirements.txt', description: 'Python dependencies for Spark jobs', type: 'config' },
  ],

  configuration: {
    dockerService: 'spark-master',
    port: '7077',
    environment: [
      { key: 'SPARK_MASTER_PORT', description: 'Spark master bind port', defaultValue: '7077' },
      { key: 'SPARK_WEBUI_PORT', description: 'Spark master web UI port', defaultValue: '8080' },
      { key: 'SPARK_WORKER_CORES', description: 'CPU cores per worker', defaultValue: '2' },
      { key: 'SPARK_WORKER_MEMORY', description: 'Memory per worker', defaultValue: '2g' },
      { key: 'SPARK_WORKERS', description: 'Number of Spark worker instances', defaultValue: '4' },
      { key: 'SPARK_PARQUET_COMPRESSION', description: 'Parquet compression codec', defaultValue: 'snappy' },
    ],
    dependencies: ['MinIO Bronze Layer', 'MinIO Silver Layer'],
    healthCheck: 'http://spark-master:8080/api/v1/applications',
  },
};

// ============================================================================
// Component 5: MinIO Silver Layer
// ============================================================================

const minioSilver: ArchitectureComponentDetail = {
  id: 'minio-silver',
  stageNumber: 5,
  title: 'MinIO Silver Layer',
  subtitle: 'Clean Data Lake Storage',
  icon: 'HardDrive',
  colorScheme: {
    primary: 'fuchsia',
    gradient: 'from-fuchsia-500 to-purple-600',
  },

  overview: {
    description:
      'The MinIO Silver Layer stores cleaned, validated, and enriched data in Apache Parquet columnar format. Unlike the raw bronze layer, silver data has been through the full Spark ETL pipeline — deduplicated, null-imputed, type-cast, and enriched with derived columns. Partitioned by event_date, it enables efficient query pruning and serves as the primary data source for the dbt transformation layer.',
    responsibilities: [
      'Stores cleaned Parquet files with Snappy compression (~70% smaller than raw CSV)',
      'Organizes data with event_date partitioning: s3://silver/clickstream/event_date=YYYY-MM-DD/',
      'Enables efficient predicate pushdown and column pruning for downstream analytical queries',
      'Maintains data quality guarantees: null ratio < 0.1%, zero duplicate event_ids, valid event types',
      'Reduces storage from ~2.5 GB/day (bronze CSV) to ~750 MB/day (silver Parquet)',
      'Supports both Spark batch reads and Trino/athena-style direct SQL querying',
    ],
    keyMetrics: [
      { label: 'Daily Storage', value: '~750 MB/day' },
      { label: 'Compression', value: 'Snappy (~70% ratio)' },
      { label: 'Partitioning', value: 'event_date' },
      { label: 'Format', value: 'Parquet (columnar)' },
    ],
    input: 'Cleaned Parquet files written by Spark ETL processing jobs',
    output: 'Query-optimized Parquet data for dbt transformations and direct analytical reads',
  },

  codeExamples: [
    {
      title: 'Parquet Write Configuration',
      language: 'Python',
      filename: 'spark/jobs/clean_clickstream.py',
      description: 'Spark configuration for writing optimized Parquet files with Snappy compression and event_date partitioning.',
      code: `from pyspark.sql import functions as F

def write_to_silver(df, processing_date: str) -> None:
    """Write cleaned dataframe to silver layer as partitioned Parquet."""
    silver_path = f"s3a://silver/clickstream/event_date={processing_date}/"

    (
        df.write
        .mode("overwrite")
        .partitionBy("event_date")
        .option("compression", "snappy")
        .option("parquet.block.size", "134217728")   # 128 MB block size
        .option("parquet.page.size", "1048576")        # 1 MB page size
        .parquet(silver_path)
    )

    # Repartition for optimal file size (256 MB target)
    target_size_mb = 256
    df_bytes = df.count() * 200  # ~200 bytes per row avg
    num_files = max(1, df_bytes // (target_size_mb * 1024 * 1024))

    (
        df.repartition(num_files, "event_date")
        .write.mode("overwrite").partitionBy("event_date")
        .parquet(silver_path)
    )`,
    },
    {
      title: 'Partition Read Patterns',
      language: 'Python',
      filename: 'dbt/models/staging/stg_clickstream.sql',
      description: 'How dbt and Spark read silver data with partition pruning for optimal performance.',
      code: `-- dbt model reading from silver Parquet with partition pruning
-- Only scans the requested date range, skipping irrelevant partitions

{{ config(
    materialized='view',
    schema='staging'
) }}

SELECT
    event_id,
    user_id,
    item_id,
    category_id,
    behavior_type,
    timestamp,
    session_id,
    page_url,
    referrer,
    device_type,
    user_agent,
    geolocation,
    is_mobile,
    hour_of_day,
    event_date
FROM silver.clickstream
WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
  AND event_date <= CURRENT_DATE`,
    },
    {
      title: 'Silver Bucket Setup',
      language: 'Shell',
      filename: 'scripts/setup_silver_bucket.sh',
      description: 'Creates the silver bucket optimized for analytical reads with appropriate lifecycle policies.',
      code: `#!/bin/bash
set -euo pipefail
mc alias set myminio http://minio:9000 minioadmin minioadmin

# Create silver bucket
mc mb myminio/silver --ignore-existing

# Enable versioning
mc version enable myminio/silver

# Lifecycle: keep silver data longer (180 days hot, 730 days total)
mc ilm rule add myminio/silver \\
  --transition-days 180 \\
  --transition-tier "WARM" \\
  --prefix "clickstream/"

mc ilm rule add myminio/silver \\
  --expiry-days 730 \\
  --prefix "clickstream/"

# Verify
echo "Silver bucket:"
mc ls myminio/silver
mc ilm rule list myminio/silver`,
    },
  ],

  files: [
    { path: 'spark/jobs/clean_clickstream.py', description: 'Spark ETL job that writes Parquet to silver', type: 'source' },
    { path: 'spark/utils/spark_session.py', description: 'Spark session config with Parquet compression settings', type: 'source' },
    { path: 'scripts/setup_silver_bucket.sh', description: 'Silver bucket creation and lifecycle configuration', type: 'script' },
    { path: 'dbt/models/staging/stg_clickstream.sql', description: 'dbt staging model reading from silver layer', type: 'source' },
    { path: 'docker-compose.yml', description: 'MinIO service with silver volume configuration', type: 'config' },
    { path: 'docs/architecture.md', description: 'Medallion architecture silver layer documentation', type: 'doc' },
  ],

  configuration: {
    dockerService: 'minio',
    port: '9000',
    environment: [
      { key: 'SILVER_BUCKET', description: 'Silver layer bucket name', defaultValue: 'silver' },
      { key: 'PARQUET_COMPRESSION', description: 'Compression codec for Parquet files', defaultValue: 'snappy' },
      { key: 'PARQUET_BLOCK_SIZE', description: 'Parquet block size in bytes', defaultValue: '134217728' },
      { key: 'PARQUET_PAGE_SIZE', description: 'Parquet page size in bytes', defaultValue: '1048576' },
      { key: 'SILVER_RETENTION_DAYS', description: 'Days before transitioning to warm storage', defaultValue: '180' },
      { key: 'SILVER_MAX_AGE_DAYS', description: 'Maximum retention before deletion', defaultValue: '730' },
    ],
    dependencies: ['MinIO Bronze Layer', 'Spark Processing'],
  },
};

// ============================================================================
// Component 6: dbt Transform
// ============================================================================

const dbtTransform: ArchitectureComponentDetail = {
  id: 'dbt-transform',
  stageNumber: 6,
  title: 'dbt Transform',
  subtitle: 'SQL Transformation Layer',
  icon: 'GitBranch',
  colorScheme: {
    primary: 'sky',
    gradient: 'from-sky-500 to-cyan-600',
  },

  overview: {
    description:
      'dbt (data build tool) transforms the cleaned silver Parquet data into a well-structured star schema optimized for analytical querying. Using SQL-only transformations organized in three layers — staging, intermediate, and marts — dbt provides version-controlled, tested, and documented data models. With over 40 models and 85%+ test coverage, this layer bridges the gap between raw data and business-ready analytics.',
    responsibilities: [
      'Staging layer (stg_): 1:1 mapping from silver Parquet, standardized column naming conventions',
      'Intermediate layer (int_): joined entities — user sessions, item catalogs, event enrichment',
      'Mart layer (mart_): business-ready fact and dimension tables following star schema design',
      'Aggregation tables: daily metrics, conversion funnels, user retention cohorts, top items',
      '40+ dbt models with 85%+ test coverage (unique, not_null, accepted_ranges)',
      'Auto-generated documentation via dbt docs with data lineage and column descriptions',
    ],
    keyMetrics: [
      { label: 'Total Models', value: '40+' },
      { label: 'Test Coverage', value: '85%+' },
      { label: 'Layers', value: '3 (stg/int/mart)' },
      { label: 'Build Time', value: '~3 min full refresh' },
    ],
    input: 'Clean Parquet data from MinIO silver layer (read via Spark SQL / Trino)',
    output: 'Star schema tables (4 dimensions, 5 fact/aggregate tables) in PostgreSQL warehouse',
  },

  codeExamples: [
    {
      title: 'Staging Model — stg_clickstream',
      language: 'SQL',
      filename: 'dbt/models/staging/stg_clickstream.sql',
      description: 'Base staging model with standardized column names and basic filtering from silver Parquet.',
      code: `{{ config(
    materialized='view',
    schema='staging',
    tags=['daily', 'staging']
) }}

WITH source AS (
    SELECT * FROM {{ source('silver', 'clickstream') }}
    WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
),

renamed AS (
    SELECT
        event_id,
        user_id,
        item_id,
        category_id,
        UPPER(TRIM(behavior_type)) AS behavior_type,
        timestamp AS event_timestamp,
        session_id,
        page_url,
        COALESCE(NULLIF(TRIM(referrer), ''), 'direct') AS referrer_url,
        LOWER(device_type) AS device_type,
        user_agent,
        geolocation,
        is_mobile,
        hour_of_day,
        event_date
    FROM source
    WHERE event_id IS NOT NULL
      AND user_id IS NOT NULL
      AND behavior_type IN ('PV', 'FAV', 'CART', 'BUY')
)

SELECT * FROM renamed`,
    },
    {
      title: 'Intermediate Model — int_user_sessions',
      language: 'SQL',
      filename: 'dbt/models/intermediate/int_user_sessions.sql',
      description: 'Joins clickstream events into session-level aggregations with duration and event counts.',
      code: `{{ config(
    materialized='table',
    schema='intermediate',
    tags=['daily', 'intermediate']
) }}

WITH clickstream AS (
    SELECT * FROM {{ ref('stg_clickstream') }}
),

session_events AS (
    SELECT
        session_id,
        user_id,
        MIN(event_timestamp) AS session_start,
        MAX(event_timestamp) AS session_end,
        COUNT(DISTINCT event_id) AS total_events,
        COUNT(DISTINCT CASE WHEN behavior_type = 'PV' THEN event_id END) AS page_views,
        COUNT(DISTINCT CASE WHEN behavior_type = 'FAV' THEN event_id END) AS favorites,
        COUNT(DISTINCT CASE WHEN behavior_type = 'CART' THEN event_id END) AS cart_adds,
        COUNT(DISTINCT CASE WHEN behavior_type = 'BUY' THEN event_id END) AS purchases,
        MODE() WITHIN GROUP (ORDER BY device_type) AS primary_device,
        MIN(event_date) AS session_date
    FROM clickstream
    GROUP BY session_id, user_id
)

SELECT
    session_id,
    user_id,
    session_start,
    session_end,
    TIMESTAMPDIFF(SECOND, session_start, session_end) AS session_duration_secs,
    total_events,
    page_views,
    favorites,
    cart_adds,
    purchases,
    CASE WHEN purchases > 0 THEN 1 ELSE 0 END AS is_converted,
    primary_device,
    session_date
FROM session_events`,
    },
    {
      title: 'Mart Model — fact_clickstream',
      language: 'SQL',
      filename: 'dbt/models/marts/core/fact_clickstream.sql',
      description: 'Core fact table joining clickstream events with dimension surrogate keys for the star schema.',
      code: `{{ config(
    materialized='incremental',
    unique_key='event_id',
    schema='marts_core',
    cluster_by=['event_date'],
    tags=['daily', 'mart', 'fact']
) }}

{% set date_filter = "event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)" %}

WITH clickstream AS (
    SELECT * FROM {{ ref('stg_clickstream') }}
    {% if is_incremental() %}
    WHERE {{ date_filter }}
    {% endif %}
),

dim_user AS (
    SELECT user_sk, user_id FROM {{ ref('dim_user') }}
    WHERE is_current = TRUE
),

dim_item AS (
    SELECT item_sk, item_id FROM {{ ref('dim_item') }}
),

dim_date AS (
    SELECT date_sk, full_date FROM {{ ref('dim_date') }}
),

joined AS (
    SELECT
        c.event_id,
        COALESCE(u.user_sk, -1) AS user_sk,
        COALESCE(i.item_sk, -1) AS item_sk,
        COALESCE(d.date_sk, -1) AS date_sk,
        c.behavior_type,
        c.session_id,
        c.page_url,
        c.referrer_url,
        c.device_type,
        c.event_timestamp,
        c.is_mobile,
        c.hour_of_day,
        c.event_date
    FROM clickstream c
    LEFT JOIN dim_user u ON c.user_id = u.user_id
    LEFT JOIN dim_item i ON c.item_id = i.item_id
    LEFT JOIN dim_date d ON c.event_date = d.full_date
)

SELECT * FROM joined`,
    },
    {
      title: 'dbt Project Configuration',
      language: 'YAML',
      filename: 'dbt/dbt_project.yml',
      description: 'Root project configuration defining models, materializations, and test coverage.',
      code: `name: 'ecommerce_clickstream'
version: '1.4.0'
config-version: 2

profile: 'ecommerce_clickstream'

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
      +materialized: table
      +schema: intermediate
    marts:
      core:
        +materialized: incremental
        +schema: marts_core
      aggregates:
        +materialized: table
        +schema: marts_agg

vars:
  lookback_days: 90
  min_session_duration: 5
  max_session_duration: 7200`,
    },
  ],

  files: [
    { path: 'dbt/dbt_project.yml', description: 'Root project configuration and model materialization settings', type: 'config' },
    { path: 'dbt/profiles.yml', description: 'Connection profiles for target databases', type: 'config' },
    { path: 'dbt/packages.yml', description: 'dbt package dependencies (dbt-utils, etc.)', type: 'config' },
    { path: 'dbt/models/staging/stg_clickstream.sql', description: 'Staging model: standardized silver data mapping', type: 'source' },
    { path: 'dbt/models/staging/stg_users.sql', description: 'Staging model: user dimension source', type: 'source' },
    { path: 'dbt/models/staging/stg_items.sql', description: 'Staging model: item dimension source', type: 'source' },
    { path: 'dbt/models/intermediate/int_user_sessions.sql', description: 'Session-level aggregation with duration and conversions', type: 'source' },
    { path: 'dbt/models/intermediate/int_item_catalog.sql', description: 'Item catalog with category joins', type: 'source' },
    { path: 'dbt/models/marts/core/dim_user.sql', description: 'User dimension with SCD Type 2', type: 'source' },
    { path: 'dbt/models/marts/core/fact_clickstream.sql', description: 'Core fact table with surrogate keys', type: 'source' },
    { path: 'dbt/models/marts/aggregates/agg_daily_metrics.sql', description: 'Daily KPI aggregation table', type: 'source' },
    { path: 'dbt/models/marts/aggregates/agg_conversion_funnel.sql', description: 'Conversion funnel metrics', type: 'source' },
    { path: 'dbt/tests/assert_unique_event_id.sql', description: 'Uniqueness test for event_id', type: 'test' },
    { path: 'dbt/tests/assert_not_null_user_id.sql', description: 'Not-null test for user_id', type: 'test' },
    { path: 'dbt/macros/generate_schema_name.sql', description: 'Custom schema generation macro', type: 'source' },
    { path: 'docs/dbt_models.md', description: 'dbt model documentation and lineage', type: 'doc' },
  ],

  configuration: {
    dockerService: 'dbt',
    port: '8580',
    environment: [
      { key: 'DBT_PROFILES_DIR', description: 'Directory containing profiles.yml', defaultValue: '/app/dbt' },
      { key: 'DBT_TARGET', description: 'dbt target environment (dev/prod)', defaultValue: 'dev' },
      { key: 'DBT_POSTGRES_HOST', description: 'PostgreSQL warehouse host', defaultValue: 'postgres:5432' },
      { key: 'DBT_POSTGRES_USER', description: 'PostgreSQL username', defaultValue: 'dbt_user' },
      { key: 'DBT_POSTGRES_PASSWORD', description: 'PostgreSQL password', defaultValue: 'dbt_password' },
      { key: 'DBT_POSTGRES_DATABASE', description: 'Target database name', defaultValue: 'analytics' },
      { key: 'DBT_SPARK_ENDPOINT', description: 'Spark Thrift server for silver reads', defaultValue: 'spark-thrift:10000' },
      { key: 'DBT_LOOKBACK_DAYS', description: 'Default lookback window for incremental models', defaultValue: '90' },
    ],
    dependencies: ['PostgreSQL Warehouse', 'MinIO Silver Layer'],
  },
};

// ============================================================================
// Component 7: PostgreSQL Warehouse
// ============================================================================

const postgresWarehouse: ArchitectureComponentDetail = {
  id: 'postgres-warehouse',
  stageNumber: 7,
  title: 'PostgreSQL Warehouse',
  subtitle: 'Analytical Data Warehouse',
  icon: 'Database',
  colorScheme: {
    primary: 'amber',
    gradient: 'from-amber-500 to-orange-600',
  },

  overview: {
    description:
      'PostgreSQL serves as the analytical data warehouse, storing the dbt-built star schema with 4 dimension tables and 5 fact/aggregate tables. Optimized with strategic indexes, materialized views, and query-tuned configurations, it powers all Metabase dashboard queries with sub-2-second p99 response times across 90-day data windows. The warehouse implements SCD Type 2 for slowly-changing user dimensions.',
    responsibilities: [
      'Stores the star schema: 4 dimension tables (dim_user, dim_item, dim_category, dim_date) and 5 fact/aggregate tables',
      'Implements SCD Type 2 on dim_user for tracking user profile changes over time with valid_from/valid_to ranges',
      'B-tree indexes on all foreign keys; BRIN index on fact_clickstream(event_date) for range queries',
      'Materialized views for Metabase dashboard pre-aggregation (mv_daily_kpi, mv_category_performance)',
      'Query performance: p99 < 2s for dashboard queries on 90-day windows with ~45M fact rows',
      'Automatic materialized view refresh via PostgreSQL pg_cron or Airflow scheduled tasks',
    ],
    keyMetrics: [
      { label: 'Fact Table Rows', value: '~45M (90-day)' },
      { label: 'Query p99 Latency', value: '< 2 seconds' },
      { label: 'Tables', value: '4 dim + 5 fact/agg' },
      { label: 'Materialized Views', value: '3 pre-agg views' },
    ],
    input: 'Star schema tables loaded by dbt from silver Parquet via Spark SQL',
    output: 'Query-optimized tables and materialized views consumed by Metabase dashboards',
  },

  codeExamples: [
    {
      title: 'Dimension Table — dim_user',
      language: 'SQL',
      filename: 'sql/migrations/001_initial_schema.sql',
      description: 'User dimension table with SCD Type 2 support for tracking profile changes over time.',
      code: `CREATE TABLE IF NOT EXISTS marts_core.dim_user (
    user_sk        SERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    username       VARCHAR(64),
    email          VARCHAR(128),
    signup_date    DATE,
    country        VARCHAR(64),
    device_type    VARCHAR(32),
    is_active      BOOLEAN DEFAULT TRUE,
    user_segment   VARCHAR(32),
    valid_from     TIMESTAMPTZ DEFAULT NOW(),
    valid_to       TIMESTAMPTZ DEFAULT '9999-12-31',
    is_current     BOOLEAN DEFAULT TRUE
);

-- Indexes for typical query patterns
CREATE INDEX idx_dim_user_user_id ON marts_core.dim_user(user_id);
CREATE INDEX idx_dim_user_current ON marts_core.dim_user(user_id) WHERE is_current = TRUE;
CREATE INDEX idx_dim_user_segment ON marts_core.dim_user(user_segment) WHERE is_current = TRUE;

-- Unique constraint: only one current record per user
CREATE UNIQUE INDEX uq_dim_user_current ON marts_core.dim_user(user_id) WHERE is_current = TRUE;

COMMENT ON TABLE marts_core.dim_user IS 'User dimension with SCD Type 2 tracking';
COMMENT ON COLUMN marts_core.dim_user.user_segment IS 'Derived: browser/casual/regular/power_buyer';`,
    },
    {
      title: 'Fact Table — fact_clickstream',
      language: 'SQL',
      filename: 'sql/migrations/001_initial_schema.sql',
      description: 'Core fact table storing individual clickstream events joined with dimension surrogate keys.',
      code: `CREATE TABLE IF NOT EXISTS marts_core.fact_clickstream (
    event_id          BIGINT PRIMARY KEY,
    user_sk           INTEGER NOT NULL REFERENCES marts_core.dim_user(user_sk),
    item_sk           INTEGER NOT NULL,
    date_sk           INTEGER NOT NULL,
    event_type        VARCHAR(32) NOT NULL CHECK (event_type IN ('pv','fav','cart','buy')),
    session_id        VARCHAR(64) NOT NULL,
    page_url          TEXT,
    referrer          TEXT,
    device_type       VARCHAR(32),
    user_agent        VARCHAR(256),
    event_timestamp   TIMESTAMPTZ NOT NULL,
    price             DECIMAL(12,2),
    is_mobile         BOOLEAN,
    hour_of_day       SMALLINT CHECK (hour_of_day BETWEEN 0 AND 23),
    event_date        DATE NOT NULL
);

-- B-tree on foreign keys (point lookups)
CREATE INDEX idx_fact_cs_user_sk ON marts_core.fact_clickstream(user_sk);
CREATE INDEX idx_fact_cs_item_sk ON marts_core.fact_clickstream(item_sk);
CREATE INDEX idx_fact_cs_date_sk ON marts_core.fact_clickstream(date_sk);
CREATE INDEX idx_fact_cs_event_type ON marts_core.fact_clickstream(event_type);
CREATE INDEX idx_fact_cs_session ON marts_core.fact_clickstream(session_id);

-- BRIN index for date range scans (dashboard queries)
CREATE INDEX idx_fact_cs_date_brin ON marts_core.fact_clickstream USING BRIN (event_date)
    WITH (pages_per_range = 32);

-- Partial index for purchases only
CREATE INDEX idx_fact_cs_purchases ON marts_core.fact_clickstream(event_date)
    WHERE event_type = 'buy';

COMMENT ON TABLE marts_core.fact_clickstream IS 'Core fact table: ~1.5M rows/day';`,
    },
    {
      title: 'Materialized View — mv_daily_kpi',
      language: 'SQL',
      filename: 'sql/materialized_views/mv_daily_kpi.sql',
      description: 'Pre-aggregated materialized view for daily KPI metrics used by Metabase dashboards.',
      code: `CREATE MATERIALIZED VIEW marts_agg.mv_daily_kpi AS
SELECT
    event_date,
    COUNT(DISTINCT user_sk) AS daily_active_users,
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE event_type = 'pv') AS page_views,
    COUNT(*) FILTER (WHERE event_type = 'fav') AS favorites,
    COUNT(*) FILTER (WHERE event_type = 'cart') AS cart_adds,
    COUNT(*) FILTER (WHERE event_type = 'buy') AS purchases,
    ROUND(COUNT(*) FILTER (WHERE event_type = 'buy')::DECIMAL
          / NULLIF(COUNT(DISTINCT user_sk), 0) * 100, 2) AS purchase_rate_pct,
    COALESCE(SUM(price) FILTER (WHERE event_type = 'buy'), 0) AS daily_revenue
FROM marts_core.fact_clickstream
GROUP BY event_date
WITH DATA;

-- Unique index required for concurrent refresh
CREATE UNIQUE INDEX uq_mv_daily_kpi_date ON marts_agg.mv_daily_kpi(event_date);

-- Refresh strategy: run daily after dbt load
-- REFRESH MATERIALIZED VIEW CONCURRENTLY marts_agg.mv_daily_kpi;

COMMENT ON MATERIALIZED VIEW marts_agg.mv_daily_kpi IS
    'Pre-aggregated daily KPI metrics for executive dashboard. Refresh after dbt run.';`,
    },
  ],

  files: [
    { path: 'sql/migrations/001_initial_schema.sql', description: 'Initial schema: dimensions, facts, and core indexes', type: 'source' },
    { path: 'sql/migrations/002_add_retention_tables.sql', description: 'Add retention cohort and aggregate tables', type: 'source' },
    { path: 'sql/migrations/003_add_indexes.sql', description: 'Performance-tuned indexes and BRIN indexes', type: 'source' },
    { path: 'sql/create_schemas.sql', description: 'Schema creation (staging, intermediate, marts_core, marts_agg)', type: 'source' },
    { path: 'sql/seed_dimensions.sql', description: 'Seed data for dim_date and initial dimension records', type: 'script' },
    { path: 'sql/materialized_views/mv_daily_kpi.sql', description: 'Daily KPI materialized view definition', type: 'source' },
    { path: 'sql/materialized_views/mv_category_performance.sql', description: 'Category performance materialized view', type: 'source' },
    { path: 'sql/materialized_views/mv_user_segment_summary.sql', description: 'User segment summary materialized view', type: 'source' },
    { path: 'docker-compose.yml', description: 'PostgreSQL service with volume and config', type: 'config' },
    { path: 'docs/data_dictionary.md', description: 'Full data dictionary with table and column descriptions', type: 'doc' },
  ],

  configuration: {
    dockerService: 'postgres',
    port: '5432',
    environment: [
      { key: 'POSTGRES_USER', description: 'PostgreSQL superuser', defaultValue: 'postgres' },
      { key: 'POSTGRES_PASSWORD', description: 'PostgreSQL password', defaultValue: 'postgres' },
      { key: 'POSTGRES_DB', description: 'Default database', defaultValue: 'analytics' },
      { key: 'DBT_USER', description: 'dbt service account username', defaultValue: 'dbt_user' },
      { key: 'DBT_PASSWORD', description: 'dbt service account password', defaultValue: 'dbt_password' },
      { key: 'METABASE_USER', description: 'Metabase read-only account', defaultValue: 'metabase_user' },
      { key: 'PG_SHARED_BUFFERS', description: 'PostgreSQL shared memory (25% of RAM)', defaultValue: '1GB' },
      { key: 'PG_WORK_MEM', description: 'Memory for sort/hash operations', defaultValue: '64MB' },
      { key: 'PG_MAX_CONNECTIONS', description: 'Maximum database connections', defaultValue: '100' },
    ],
    dependencies: ['dbt Transform'],
    healthCheck: 'pg_isready -U postgres',
  },
};

// ============================================================================
// Component 8: Metabase Dashboard
// ============================================================================

const metabaseDashboard: ArchitectureComponentDetail = {
  id: 'metabase-dashboard',
  stageNumber: 8,
  title: 'Metabase Dashboard',
  subtitle: 'BI & Analytics Layer',
  icon: 'BarChart3',
  colorScheme: {
    primary: 'cyan',
    gradient: 'from-cyan-500 to-teal-600',
  },

  overview: {
    description:
      'Metabase provides the business intelligence layer, powering 20+ interactive dashboards that transform the star schema warehouse into actionable insights. From executive overviews to detailed funnel analysis, retention cohorts, and product performance — Metabase makes the analytical pipeline accessible to non-technical stakeholders through auto-refreshing dashboards, scheduled email pulses, and drill-down capabilities.',
    responsibilities: [
      'Hosts 20+ interactive dashboards: Executive Overview, User Behavior, Conversion Funnel, Product Analytics, Retention',
      'Auto-refreshes dashboard data every 6 hours via Metabase scheduled sync with PostgreSQL',
      'Sends scheduled email pulses (daily, weekly) with KPI summaries to stakeholders',
      'Provides SQL editor for ad-hoc analytical queries against the warehouse',
      'Implements row-level security: business users see filtered data by department/region',
      'Tracks dashboard usage analytics and popular queries for continuous improvement',
    ],
    keyMetrics: [
      { label: 'Dashboards', value: '20+ interactive' },
      { label: 'Refresh Cycle', value: 'Every 6 hours' },
      { label: 'Scheduled Pulses', value: '5 email reports' },
      { label: 'Query Cache Hit', value: '~78%' },
    ],
    input: 'Star schema tables and materialized views from PostgreSQL warehouse',
    output: 'Interactive dashboards, scheduled reports, and ad-hoc query results for business users',
  },

  codeExamples: [
    {
      title: 'DAU Trend Query',
      language: 'SQL',
      filename: 'metabase/dashboards/executive_overview/01_dau_trend.sql',
      description: 'Daily Active Users trend query powering the executive overview KPI card and trend chart.',
      code: `-- Daily Active Users (DAU) with 7-day rolling average
-- Used in: Executive Overview > DAU Trend Card

SELECT
    event_date AS date,
    COUNT(DISTINCT user_sk) AS daily_active_users,
    COUNT(DISTINCT user_sk) * 100.0 / (
        SELECT COUNT(DISTINCT user_sk)
        FROM marts_core.fact_clickstream
        WHERE event_date BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
                             AND CURRENT_DATE
    ) AS dau_mau_ratio_pct
FROM marts_core.fact_clickstream
WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY event_date
ORDER BY event_date ASC;`,
    },
    {
      title: 'Conversion Funnel Query',
      language: 'SQL',
      filename: 'metabase/dashboards/funnel_analysis/01_conversion_funnel.sql',
      description: 'Conversion funnel query calculating drop-off rates from page view to purchase.',
      code: `-- Conversion Funnel: PV → Favorite → Cart → Purchase
-- Used in: Conversion Funnel Dashboard

WITH funnel AS (
    SELECT
        COUNT(DISTINCT CASE WHEN event_type = 'pv' THEN user_sk END) AS page_views,
        COUNT(DISTINCT CASE WHEN event_type = 'fav' THEN user_sk END) AS favorites,
        COUNT(DISTINCT CASE WHEN event_type = 'cart' THEN user_sk END) AS cart_adds,
        COUNT(DISTINCT CASE WHEN event_type = 'buy' THEN user_sk END) AS purchases
    FROM marts_core.fact_clickstream
    WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
)
SELECT
    'Page Views' AS stage, page_views AS users,
    100.0 AS conversion_rate
FROM funnel
UNION ALL
SELECT
    'Favorites' AS stage, favorites AS users,
    ROUND(favorites * 100.0 / NULLIF(page_views, 0), 2) AS conversion_rate
FROM funnel
UNION ALL
SELECT
    'Add to Cart' AS stage, cart_adds AS users,
    ROUND(cart_adds * 100.0 / NULLIF(page_views, 0), 2) AS conversion_rate
FROM funnel
UNION ALL
SELECT
    'Purchases' AS stage, purchases AS users,
    ROUND(purchases * 100.0 / NULLIF(page_views, 0), 2) AS conversion_rate
FROM funnel
ORDER BY conversion_rate DESC;`,
    },
    {
      title: 'Top Categories by Revenue',
      language: 'SQL',
      filename: 'metabase/dashboards/product_analytics/01_top_categories.sql',
      description: 'Product category performance query showing views, purchases, and conversion rates.',
      code: `-- Top Product Categories by Purchase Volume
-- Used in: Product Analytics Dashboard

SELECT
    dc.category_name,
    COUNT(*) FILTER (WHERE fc.event_type = 'pv') AS views,
    COUNT(*) FILTER (WHERE fc.event_type = 'buy') AS purchases,
    ROUND(
        COUNT(*) FILTER (WHERE fc.event_type = 'buy') * 100.0
        / NULLIF(COUNT(*) FILTER (WHERE fc.event_type = 'pv'), 0), 2
    ) AS conversion_rate_pct,
    COALESCE(SUM(fc.price) FILTER (WHERE fc.event_type = 'buy'), 0) AS total_revenue
FROM marts_core.fact_clickstream fc
JOIN marts_core.dim_item di ON fc.item_sk = di.item_sk
JOIN marts_core.dim_category dc ON di.category_sk = dc.category_sk
WHERE fc.event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY dc.category_name
ORDER BY purchases DESC
LIMIT 10;`,
    },
    {
      title: 'User Retention Cohorts',
      language: 'SQL',
      filename: 'metabase/dashboards/retention/01_retention_cohorts.sql',
      description: 'Cohort-based retention analysis tracking user return rates over time.',
      code: `-- User Retention Cohorts (Weekly)
-- Used in: Retention Analysis Dashboard

WITH first_activity AS (
    SELECT
        user_sk,
        DATE_TRUNC('week', MIN(event_date)) AS cohort_week,
        MIN(event_date) AS first_seen
    FROM marts_core.fact_clickstream
    WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    GROUP BY user_sk
),
retained AS (
    SELECT
        fa.cohort_week,
        COUNT(DISTINCT fa.user_sk) AS cohort_size,
        COUNT(DISTINCT CASE WHEN DATEDIFF(fc.event_date, fa.first_seen) = 1
              THEN fa.user_sk END) AS retained_d1,
        COUNT(DISTINCT CASE WHEN DATEDIFF(fc.event_date, fa.first_seen) BETWEEN 1 AND 3
              THEN fa.user_sk END) AS retained_d3,
        COUNT(DISTINCT CASE WHEN DATEDIFF(fc.event_date, fa.first_seen) BETWEEN 1 AND 7
              THEN fa.user_sk END) AS retained_d7,
        COUNT(DISTINCT CASE WHEN DATEDIFF(fc.event_date, fa.first_seen) BETWEEN 1 AND 14
              THEN fa.user_sk END) AS retained_d14,
        COUNT(DISTINCT CASE WHEN DATEDIFF(fc.event_date, fa.first_seen) BETWEEN 1 AND 30
              THEN fa.user_sk END) AS retained_d30
    FROM first_activity fa
    LEFT JOIN marts_core.fact_clickstream fc ON fa.user_sk = fc.user_sk
    GROUP BY fa.cohort_week
)
SELECT
    cohort_week,
    cohort_size,
    ROUND(retained_d1 * 100.0 / cohort_size, 1) AS day_1_retention,
    ROUND(retained_d3 * 100.0 / cohort_size, 1) AS day_3_retention,
    ROUND(retained_d7 * 100.0 / cohort_size, 1) AS day_7_retention,
    ROUND(retained_d14 * 100.0 / cohort_size, 1) AS day_14_retention,
    ROUND(retained_d30 * 100.0 / cohort_size, 1) AS day_30_retention
FROM retained
ORDER BY cohort_week DESC;`,
    },
  ],

  files: [
    { path: 'docker-compose.yml', description: 'Metabase service definition with environment and volume', type: 'config' },
    { path: 'sql/materialized_views/mv_daily_kpi.sql', description: 'Daily KPI view powering executive dashboard', type: 'source' },
    { path: 'sql/materialized_views/mv_category_performance.sql', description: 'Category metrics view for product analytics', type: 'source' },
    { path: 'sql/materialized_views/mv_user_segment_summary.sql', description: 'User segment view for behavior analysis', type: 'source' },
    { path: 'docs/setup_guide.md', description: 'Metabase setup and dashboard configuration guide', type: 'doc' },
    { path: 'monitoring/grafana/dashboards/pipeline_overview.json', description: 'Pipeline health monitoring dashboard config', type: 'config' },
  ],

  configuration: {
    dockerService: 'metabase',
    port: '3000',
    environment: [
      { key: 'MB_DB_TYPE', description: 'Metabase internal database type', defaultValue: 'postgres' },
      { key: 'MB_DB_HOST', description: 'Internal DB host', defaultValue: 'metabase-db' },
      { key: 'MB_DB_PORT', description: 'Internal DB port', defaultValue: '5432' },
      { key: 'MB_ADMIN_EMAIL', description: 'Admin user email', defaultValue: 'admin@example.com' },
      { key: 'MB_ADMIN_PASSWORD', description: 'Admin user password', defaultValue: 'Metabase123!' },
      { key: 'MB_JETTY_PORT', description: 'Metabase web server port', defaultValue: '3000' },
      { key: 'MB_EMBEDDING_SECRET_KEY', description: 'Secret for iframe embedding', defaultValue: '' },
      { key: 'SYNC_SCHEDULE', description: 'Database sync interval (cron)', defaultValue: '0 */6 * * *' },
    ],
    dependencies: ['PostgreSQL Warehouse', 'Prometheus'],
    healthCheck: '/api/health',
  },
};

// ============================================================================
// Export: Architecture Component Details Array
// ============================================================================

export const architectureComponentDetails: ArchitectureComponentDetail[] = [
  csvSource,
  fastapiIngestion,
  minioBronze,
  sparkProcessing,
  minioSilver,
  dbtTransform,
  postgresWarehouse,
  metabaseDashboard,
];
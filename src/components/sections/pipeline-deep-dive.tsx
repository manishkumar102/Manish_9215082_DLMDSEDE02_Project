'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Copy, Check, Code2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { pipelineStages } from '@/data/pipeline-data';

/* ---------- Code snippets per stage ---------- */
const codeSnippets: Record<string, { lang: string; code: string }> = {
  ingestion: {
    lang: 'Python',
    code: `@app.post("/ingest")
async def ingest_data(request: IngestRequest):
    # Download and validate CSV
    raw_data = download_dataset(request.url)
    validator.validate(raw_data)
    # Upload to MinIO bronze bucket
    minio.upload("raw-data", raw_data)
    return {"status": "success", "rows": len(raw_data)}`,
  },
  'raw-storage': {
    lang: 'Bash',
    code: `# Bronze bucket structure
s3a://bronze/clickstream/
  ├── year=2024/
  │   ├── month=11/
  │   │   ├── day=01/
  │   │   │   └── clickstream_20241101.csv
  │   │   └── day=02/
  │   │       └── clickstream_20241102.csv
  │   └── month=12/
  └── _metadata/
      └── ingestion_log.json`,
  },
  processing: {
    lang: 'Python',
    code: `# Read raw data from bronze layer
df = spark.read.csv("s3a://raw-data/clickstream/")
# Clean and enrich
clean_df = (df.dropDuplicates()
    .na.drop(subset=["user_id", "item_id"])
    .filter(col("behavior_type").isin(["pv","cart","buy","fav"]))
    .withColumn("event_date", to_date("timestamp")))
# Write to silver as Parquet
clean_df.write.parquet("s3a://processed-data/silver/")`,
  },
  'silver-storage': {
    lang: 'SQL',
    code: `-- Silver layer: validated clickstream events
CREATE TABLE silver.clickstream_events (
    user_id        BIGINT,
    item_id        BIGINT,
    category_id    BIGINT,
    behavior_type  VARCHAR(10),
    timestamp      TIMESTAMP,
    event_date     DATE,
    ingestion_ts   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
PARTITIONED BY (event_date)
STORED AS PARQUET;`,
  },
  transform: {
    lang: 'SQL',
    code: `-- stg_clickstream_events.sql
SELECT
    user_id,
    item_id,
    category_id,
    behavior_type,
    CAST(timestamp AS TIMESTAMP) AS event_timestamp,
    DATE(timestamp) AS event_date
FROM {{ source('spark_silver', 'clickstream_events') }}
WHERE behavior_type IN ('pv', 'cart', 'buy', 'fav')`,
  },
  warehouse: {
    lang: 'SQL',
    code: `CREATE TABLE fact_clickstream (
    click_id       SERIAL PRIMARY KEY,
    user_key       INT REFERENCES dim_user(user_key),
    item_key       INT REFERENCES dim_item(item_key),
    category_key   INT REFERENCES dim_category(category_key),
    date_key       INT REFERENCES dim_date(date_key),
    behavior_type  VARCHAR(10),
    created_at     TIMESTAMP DEFAULT NOW()
);`,
  },
  dashboard: {
    lang: 'SQL',
    code: `-- Daily conversion funnel
SELECT
    event_date,
    COUNT(CASE WHEN behavior_type='pv' THEN 1 END) AS views,
    COUNT(CASE WHEN behavior_type='fav' THEN 1 END) AS favorites,
    COUNT(CASE WHEN behavior_type='cart' THEN 1 END) AS carts,
    COUNT(CASE WHEN behavior_type='buy' THEN 1 END) AS purchases
FROM fact_clickstream f
JOIN dim_date d ON f.date_key = d.date_key
GROUP BY event_date
ORDER BY event_date;`,
  },
};

/* ---------- Copy button hook ---------- */
function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* silent fail */
    }
  };

  return { copiedId, copy };
}

/* ---------- CodeBlock sub-component ---------- */
function CodeBlock({ stageId, lang, code }: { stageId: string; lang: string; code: string }) {
  const { copiedId, copy } = useCopyToClipboard();
  const isCopied = copiedId === stageId;

  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
          {lang}
        </span>
        <button
          onClick={() => copy(code, stageId)}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          aria-label="Copy code"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

/* ---------- Tab panel content ---------- */
function StagePanel({ stage }: { stage: (typeof pipelineStages)[number] }) {
  const snippet = codeSnippets[stage.tabId];

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: description + features */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-xs font-mono px-2.5 py-0.5">
              Step {stage.number}
            </Badge>
            <h3 className="text-xl font-bold">{stage.title}</h3>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {stage.subtitle}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stage.description}
          </p>

          {/* Key Features */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Key Features
            </h4>
            <ul className="space-y-2">
              {stage.details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technologies Used */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-fuchsia-500" />
              Technologies Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {stage.technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-xs px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: code snippet */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-500" />
            Example
          </h4>
          {snippet ? (
            <CodeBlock stageId={stage.tabId} lang={snippet.lang} code={snippet.code} />
          ) : (
            <Card className="rounded-lg">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Code example coming soon
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Main component ---------- */
export default function PipelineDeepDive() {
  const defaultTab = pipelineStages[0]?.tabId ?? 'ingestion';

  return (
    <section id="pipeline-deep-dive" className="py-20 px-4 sm:px-6 lg:px-8">
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
            Pipeline Deep Dive
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore each stage of the data pipeline
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Tabs defaultValue={defaultTab} className="w-full">
            {/* Scrollable tab list on mobile */}
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <TabsList className="inline-flex w-auto min-w-0 h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
                {pipelineStages.map((stage) => (
                  <TabsTrigger
                    key={stage.tabId}
                    value={stage.tabId}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-lg whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <span className="hidden sm:inline mr-1 opacity-50 font-mono text-[10px]">
                      {String(stage.number).padStart(2, '0')}
                    </span>
                    {stage.tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab panels */}
            {pipelineStages.map((stage) => (
              <TabsContent key={stage.tabId} value={stage.tabId} className="mt-6">
                <AnimatePresence mode="wait">
                  <StagePanel stage={stage} />
                </AnimatePresence>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

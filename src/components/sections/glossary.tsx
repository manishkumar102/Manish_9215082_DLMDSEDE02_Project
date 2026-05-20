'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { BookOpen, Search } from 'lucide-react';

interface GlossaryTerm {
  field: string;
  type: 'VARCHAR' | 'INT' | 'TIMESTAMP' | 'NUMERIC' | 'BOOLEAN';
  description: string;
  example: string;
}

type TermGroup = 'raw' | 'bronze' | 'silver' | 'gold';

const glossaryData: Record<TermGroup, GlossaryTerm[]> = {
  raw: [
    {
      field: 'user_id',
      type: 'INT',
      description:
        'Anonymized unique identifier for each user in the Taobao User Behavior Dataset. The dataset contains 10,921 unique users who generated at least one event during the observation period from Nov 25 to Dec 3, 2017.',
      example: '10921',
    },
    {
      field: 'item_id',
      type: 'INT',
      description:
        'Anonymized unique product identifier from the Taobao marketplace catalog. The dataset contains 98,772 unique items that received at least one user interaction (pv, buy, cart, or fav) during the 100K-event sample window.',
      example: '2831976',
    },
    {
      field: 'category_id',
      type: 'INT',
      description:
        'Anonymized product category identifier mapping items to their Taobao category taxonomy. The dataset contains 5,787 unique categories, with each category grouping related products. A single category may contain thousands of item_ids.',
      example: '3874',
    },
    {
      field: 'behavior_type',
      type: 'VARCHAR',
      description:
        'The type of user interaction recorded for the event. One of four values: "pv" (page view — user browsed the product page), "buy" (user completed a purchase), "cart" (user added the item to shopping cart), or "fav" (user added the item to favorites/wishlist).',
      example: 'pv',
    },
    {
      field: 'timestamp',
      type: 'INT',
      description:
        'Unix epoch timestamp in milliseconds when the user behavior event occurred. The dataset spans 2017-11-25 to 2017-12-03 (Double 11 shopping festival period). All timestamps are in Asia/Shanghai (UTC+8) timezone.',
      example: '1511856000000',
    },
  ],
  bronze: [
    {
      field: 'raw_id',
      type: 'INT',
      description:
        'Auto-incrementing surrogate key assigned to each ingested row as it lands in the Bronze layer. Preserves insertion order and provides a stable identifier for deduplication and lineage tracking across downstream processing stages.',
      example: '1048577',
    },
    {
      field: 'source_file',
      type: 'VARCHAR',
      description:
        'Original filename of the uploaded CSV file from which this row was ingested. Enables data lineage tracking from source file to downstream layers, and supports re-ingestion or rollback if a specific source file is found to be corrupt.',
      example: 'UserBehavior.csv',
    },
    {
      field: 'ingestion_timestamp',
      type: 'TIMESTAMP',
      description:
        'UTC timestamp recording when this row was loaded into the Bronze data lake layer via the FastAPI ingestion service. Useful for monitoring ingestion lag and debugging data freshness issues in the pipeline.',
      example: '2024-06-15T09:23:11Z',
    },
  ],
  silver: [
    {
      field: 'event_date',
      type: 'INT',
      description:
        'The calendar date extracted from the Unix timestamp, stored as an integer in YYYYMMDD format (e.g. 20171125). Enables date-partitioned reads in Spark and simplifies daily aggregations in the Gold layer without re-parsing timestamps.',
      example: '20171125',
    },
    {
      field: 'is_valid',
      type: 'BOOLEAN',
      description:
        'Data quality validation result for the row. Set to true if all five raw columns pass schema checks: user_id > 0, item_id > 0, category_id > 0, behavior_type in ("pv","buy","cart","fav"), and timestamp within the expected 2017 date range. Invalid rows are quarantined.',
      example: 'true',
    },
    {
      field: 'duplicate_hash',
      type: 'VARCHAR',
      description:
        'SHA-256 hash computed from (user_id, item_id, category_id, behavior_type, timestamp) to detect and remove exact duplicate events. Rows sharing the same duplicate_hash are considered identical events recorded multiple times.',
      example: 'a3f9c2d1e4b8...',
    },
    {
      field: 'processing_batch',
      type: 'VARCHAR',
      description:
        'Identifier of the Spark processing batch that cleaned and enriched this row in the Silver layer. Tracks which execution run produced each row, supporting reproducibility and incremental processing in the medallion architecture.',
      example: 'batch_20240615_001',
    },
  ],
  gold: [
    {
      field: 'date',
      type: 'INT',
      description:
        'Calendar date of the aggregated metrics in YYYYMMDD format, corresponding to the event_date from the Silver layer. Each row in the Gold table represents one day of aggregated user behavior statistics across the entire Taobao dataset.',
      example: '20171125',
    },
    {
      field: 'total_events',
      type: 'INT',
      description:
        'Total count of all user behavior events on this date across the 100K-event dataset, summing pv, buy, cart, and fav interactions. Serves as the primary volume metric for monitoring daily platform activity and identifying traffic patterns during the Double 11 period.',
      example: '11234',
    },
    {
      field: 'pv_count',
      type: 'INT',
      description:
        'Number of page view events on this date. Page views are the most frequent behavior type, typically comprising over 88% of all events in the 100K-event dataset. Used as the top-of-funnel metric in the pv → cart → fav → buy conversion analysis.',
      example: '9921',
    },
    {
      field: 'cart_count',
      type: 'INT',
      description:
        'Number of add-to-cart events on this date. Represents strong purchase intent from users. The cart-to-buy conversion rate is a key e-commerce KPI tracked in the gold_daily_metrics table for the Taobao dataset analysis.',
      example: '412',
    },
    {
      field: 'fav_count',
      type: 'INT',
      description:
        'Number of favorite/wishlist events on this date. Users add items to favorites for later consideration, indicating interest but not immediate purchase intent. Fav events typically fall between cart and buy in volume.',
      example: '289',
    },
    {
      field: 'buy_count',
      type: 'INT',
      description:
        'Number of completed purchase events on this date. This is the bottom-of-funnel conversion event and the most commercially significant metric. The overall buy rate across 100K events is 2.28%.',
      example: '228',
    },
    {
      field: 'unique_users',
      type: 'INT',
      description:
        'Count of distinct user_id values active on this date, stored in gold_daily_metrics. Represents daily active users (DAU) for the Taobao platform during the observation period. Across 9 days, the dataset covers 10,921 total unique users.',
      example: '1214',
    },
    {
      field: 'buy_rate',
      type: 'NUMERIC',
      description:
        'Purchase conversion rate calculated as (buy_count / total_events) × 100, expressed as a percentage. Measures how effectively all events convert to completed purchases. The overall buy rate across the 100K-event dataset is 2.28%.',
      example: '2.28',
    },
  ],
};

const tabLabels: { value: TermGroup; label: string; count: number }[] = [
  { value: 'raw', label: 'Raw Data', count: glossaryData.raw.length },
  { value: 'bronze', label: 'Bronze Layer', count: glossaryData.bronze.length },
  { value: 'silver', label: 'Silver Layer', count: glossaryData.silver.length },
  { value: 'gold', label: 'Gold Layer', count: glossaryData.gold.length },
];

function getTypeBadgeClass(type: GlossaryTerm['type']): string {
  switch (type) {
    case 'VARCHAR': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'INT': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'TIMESTAMP': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    case 'NUMERIC': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    case 'BOOLEAN': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    default: return '';
  }
}

function TermCard({ term, index }: { term: GlossaryTerm; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-sm font-semibold text-foreground">
              {term.field}
            </code>
            <Badge variant="outline" className={getTypeBadgeClass(term.type)}>
              {term.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {term.description}
          </p>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground shrink-0">Example:</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground truncate">
              {term.example}
            </code>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Glossary() {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return glossaryData;
    const filtered: Record<TermGroup, GlossaryTerm[]> = {
      raw: [],
      bronze: [],
      silver: [],
      gold: [],
    };
    for (const group of Object.keys(glossaryData) as TermGroup[]) {
      filtered[group] = glossaryData[group].filter(
        (t) =>
          t.field.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [search]);

  const totalMatches = Object.values(filteredData).reduce((s, g) => s + g.length, 0);

  return (
    <section id="glossary" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="h-8 w-8 text-emerald-500" />
            <h2 className="text-3xl sm:text-4xl font-bold">Data Dictionary</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Complete reference of all data fields across the Taobao analytics pipeline — from raw ingestion to gold-layer aggregations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Search */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields, types, or descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="raw" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
              {tabLabels.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label} ({filteredData[tab.value].length})
                </TabsTrigger>
              ))}
            </TabsList>

            {tabLabels.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {filteredData[tab.value].length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No matching terms found
                    {totalMatches === 0 && <span> across any category</span>}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredData[tab.value].map((term, i) => (
                      <TermCard key={term.field} term={term} index={i} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

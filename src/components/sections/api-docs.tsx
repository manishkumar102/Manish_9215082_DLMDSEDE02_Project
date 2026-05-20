'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
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
import { FileJson, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ApiEndpoint {
  method: 'GET';
  path: string;
  title: string;
  description: string;
  responseSchema: string;
  curl: string;
}

const endpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/taobao/stats',
    title: 'Pipeline Statistics',
    description:
      'Returns aggregated statistics for the entire Taobao dataset: total events, unique users/items/categories, total purchases, overall conversion rate, average DAU, and peak DAU. Queries gold_daily_metrics and gold summary tables.',
    responseSchema: `// 200 OK
{
  "totalEvents": 100000,
  "uniqueUsers": 10921,
  "uniqueItems": 98772,
  "uniqueCategories": 5787,
  "totalDays": 9,
  "totalPurchases": 2282,
  "overallConversionRate": 2.28,
  "avgDAU": 6423,
  "peakDAU": 8756,
  "totalPV": 88432,
  "totalCart": 5234,
  "totalFav": 4052
}`,
    curl: `curl "/api/taobao/stats"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/daily-metrics',
    title: 'Daily Aggregated Metrics',
    description:
      'Retrieves daily aggregated behavior metrics from gold_daily_metrics. Returns per-day counts of total events, pv, cart, fav, and buy events along with unique user, item, and category counts. All 9 days of data returned in ascending date order.',
    responseSchema: `// 200 OK
[
  {
    "date": 20171125,
    "total_events": 11234,
    "pv_count": 9921,
    "cart_count": 512,
    "fav_count": 378,
    "buy_count": 423,
    "unique_users": 1214,
    "unique_items": 8923,
    "unique_categories": 487
  },
  {
    "date": 20171126,
    "total_events": 10892,
    "pv_count": 9587,
    "cart_count": 498,
    "fav_count": 345,
    "buy_count": 462,
    "unique_users": 1187,
    "unique_items": 8562,
    "unique_categories": 521
  }
]`,
    curl: `curl "/api/taobao/daily-metrics"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/hourly-patterns',
    title: 'Hourly Traffic Patterns',
    description:
      'Returns hourly distribution of user behavior from gold_hourly_patterns. Each row contains event counts broken down by hour (0–23), showing traffic peaks during shopping hours and troughs during nighttime. Useful for understanding user activity patterns.',
    responseSchema: `// 200 OK
[
  {
    "hour": 0,
    "total_events": 2847,
    "pv_count": 2512,
    "cart_count": 134,
    "fav_count": 98,
    "buy_count": 103,
    "avg_daily_events": 2847
  },
  {
    "hour": 12,
    "total_events": 6234,
    "pv_count": 5487,
    "cart_count": 312,
    "fav_count": 245,
    "buy_count": 190,
    "avg_daily_events": 6234
  }
]`,
    curl: `curl "/api/taobao/hourly-patterns"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/category-summary',
    title: 'Top Categories',
    description:
      'Returns the top 20 product categories from gold_category_summary, ranked by total events. Each row includes event breakdowns (pv, cart, fav, buy), unique users/items, and the category-level conversion rate.',
    responseSchema: `// 200 OK
[
  {
    "category_id": 1863,
    "total_events": 4231,
    "pv_count": 3712,
    "cart_count": 218,
    "fav_count": 167,
    "buy_count": 134,
    "unique_users": 1234,
    "unique_items": 567,
    "conversion_rate": 3.17
  }
]`,
    curl: `curl "/api/taobao/category-summary"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/user-segments',
    title: 'User Segments',
    description:
      'Returns behavioral segmentation of all users from gold_user_summary. Users are classified into segments (power_buyer, buyer, engaged_browser, frequent_browser, casual_browser, one_time_visitor) based on purchase count and event activity. Includes segment-level aggregates.',
    responseSchema: `// 200 OK
{
  "segments": [
    {
      "segment": "casual_browser",
      "userCount": 4523,
      "totalEvents": 28456,
      "totalPurchases": 0,
      "avgEventsPerUser": 6
    },
    {
      "segment": "buyer",
      "userCount": 1987,
      "totalEvents": 32456,
      "totalPurchases": 3245,
      "avgEventsPerUser": 16
    }
  ],
  "totalUsers": 10921
}`,
    curl: `curl "/api/taobao/user-segments"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/item-top',
    title: 'Top Items by Purchases',
    description:
      'Returns the top 20 items from gold_item_summary, ranked by buy_count. Each row includes item_id, category_id, full event breakdown, unique buyers, conversion rate, and purchases per user.',
    responseSchema: `// 200 OK
[
  {
    "item_id": 312987,
    "category_id": 2874,
    "total_events": 456,
    "pv_count": 398,
    "cart_count": 28,
    "fav_count": 12,
    "buy_count": 18,
    "unique_users": 342,
    "conversion_rate": 3.95
  }
]`,
    curl: `curl "/api/taobao/item-top"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/conversion-funnel',
    title: 'Conversion Funnel',
    description:
      'Returns the overall conversion funnel showing the drop-off from page views → cart → favorites → purchases. Each stage includes the count and conversion rate relative to the previous stage. The overall conversion rate is 2.28%.',
    responseSchema: `// 200 OK
{
  "stages": [
    { "stage": "pv", "label": "Page View", "count": 88432, "rate": 88.43 },
    { "stage": "cart", "label": "Add to Cart", "count": 5234, "rate": 5.92 },
    { "stage": "fav", "label": "Favorite", "count": 4052, "rate": 4.58 },
    { "stage": "buy", "label": "Purchase", "count": 2282, "rate": 2.58 }
  ],
  "totalEvents": 100000
}`,
    curl: `curl "/api/taobao/conversion-funnel"`,
  },
  {
    method: 'GET',
    path: '/api/taobao/sql-query',
    title: 'Ad-hoc SQL Query',
    description:
      'Execute whitelisted analytical queries against the gold layer tables. Without a query parameter, returns the catalog of 8 available pre-defined queries (daily-event-breakdown, dau-trend, conversion-funnel, hourly-patterns, top-categories, category-funnel, user-segments, top-items-buy-rate). With ?q= parameter, executes the specified query and returns columns, rows, and execution time.',
    responseSchema: `// GET /api/taobao/sql-query (catalog)
{
  "queries": [
    { "id": "daily-event-breakdown", "name": "Daily Event Breakdown", "description": "..." },
    { "id": "dau-trend", "name": "DAU Trend", "description": "..." },
    { "id": "conversion-funnel", "name": "Conversion Funnel", "description": "..." }
  ]
}

// GET /api/taobao/sql-query?q=dau-trend
{
  "queryId": "dau-trend",
  "queryName": "DAU Trend",
  "columns": ["date", "dau", "total_events", "events_per_user", "conversion_rate"],
  "rows": [[20171125, 1214, 11234, 9.25, 3.76], ...],
  "rowCount": 9,
  "executionTimeMs": 6.42
}`,
    curl: `curl "/api/taobao/sql-query"                    # list queries
curl "/api/taobao/sql-query?q=dau-trend"         # run query
curl "/api/taobao/sql-query?q=top-categories"    # top 20 categories`,
  },
];

function getMethodBadgeClass(method: ApiEndpoint['method']): string {
  switch (method) {
    case 'GET': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    default: return '';
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function EndpointCard({ endpoint, index }: { endpoint: ApiEndpoint; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={getMethodBadgeClass(endpoint.method)}>
              {endpoint.method}
            </Badge>
            <code className="font-mono text-sm font-semibold text-foreground">
              {endpoint.path}
            </code>
          </div>
          <CardTitle className="text-lg mt-2">{endpoint.title}</CardTitle>
          <CardDescription>{endpoint.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Response */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Response
            </h4>
            <div className="relative rounded-lg bg-zinc-900 p-3 overflow-x-auto">
              <CopyButton text={endpoint.responseSchema} />
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre">
                {endpoint.responseSchema}
              </pre>
            </div>
          </div>

          {/* cURL */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Example
            </h4>
            <div className="relative rounded-lg bg-zinc-950 p-3 overflow-x-auto border border-zinc-800">
              <CopyButton text={endpoint.curl} />
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre">
                <span className="text-zinc-500">$ </span>{endpoint.curl}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ApiDocs() {
  return (
    <section id="api-docs" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileJson className="h-8 w-8 text-emerald-500" />
            <h2 className="text-3xl sm:text-4xl font-bold">API Documentation</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            8 live REST API endpoints querying real data from the gold layer — no authentication required
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Endpoints ({endpoints.length})</TabsTrigger>
              <TabsTrigger value="read">
                Read ({endpoints.length})
              </TabsTrigger>
              <TabsTrigger value="sql">
                SQL ({endpoints.filter((e) => e.path.includes('sql')).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {endpoints.map((ep, i) => (
                  <EndpointCard key={ep.path} endpoint={ep} index={i} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="read">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {endpoints.map((ep, i) => (
                  <EndpointCard key={ep.path} endpoint={ep} index={i} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sql">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {endpoints
                  .filter((e) => e.path.includes('sql'))
                  .map((ep, i) => (
                    <EndpointCard key={ep.path} endpoint={ep} index={i} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

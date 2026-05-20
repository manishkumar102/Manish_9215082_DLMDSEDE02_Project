'use client';

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
import {
  KeyRound,
  HardDrive,
  RotateCcw,
  Database,
} from 'lucide-react';
import { starSchemaTables, type StarSchemaTable as SchemaTableType, type StarSchemaColumn as SchemaColumnType } from '@/data/pipeline-data';

type StarSchemaTable = SchemaTableType;
type StarSchemaColumn = SchemaColumnType;

function getTableBadgeClass(table: StarSchemaTable): string {
  if (table.name.startsWith('agg_')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  if (table.type === 'dimension') return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
  return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
}

function TableCard({ table, isCenter }: { table: StarSchemaTable; isCenter?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={`h-full transition-shadow duration-300 hover:shadow-lg ${
          isCenter
            ? 'border-2 border-emerald-500/60 shadow-md shadow-emerald-500/10'
            : ''
        }`}
      >
        <CardHeader className={isCenter ? 'pb-3' : 'pb-3'}>
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-mono">{table.name}</CardTitle>
            <Badge variant="outline" className={getTableBadgeClass(table)}>
              {table.name.startsWith('agg_') ? 'AGG' : table.type === 'dimension' ? 'DIM' : 'FACT'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {table.type === 'dimension' ? 'Dimension table' : table.name.startsWith('agg_') ? 'Aggregate table' : 'Fact table'}
          </CardDescription>
        </CardHeader>
        <CardContent className={isCenter ? 'pt-0' : 'pt-0'}>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
            {table.columns.map((col) => (
              <ColumnRow key={col.name} column={col} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ColumnRow({ column }: { column: StarSchemaColumn }) {
  return (
    <div className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/50 transition-colors">
      <span className="w-4 text-center shrink-0">
        {column.isPK ? '🔑' : column.isFK ? '🔗' : ''}
      </span>
      <span className="font-mono font-medium text-foreground truncate">
        {column.name}
      </span>
      <span className="ml-auto text-muted-foreground font-mono text-[10px] shrink-0">
        {column.type}
      </span>
    </div>
  );
}

const designDecisions = [
  {
    icon: KeyRound,
    title: 'Surrogate Keys',
    description:
      'All dimensions use surrogate keys (auto-incrementing integers) instead of natural keys. This provides flexibility for Slowly Changing Dimensions (SCD) and decouples the warehouse schema from source system changes.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: HardDrive,
    title: 'Partitioning',
    description:
      'The Silver layer is partitioned by event_date for efficient query pruning. This reduces data scanned by up to 95% for date-filtered queries and enables incremental processing of new data.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: RotateCcw,
    title: 'Idempotency',
    description:
      'All Spark jobs use overwrite mode for reprocessing safety. This ensures that re-running the pipeline for any date range produces identical results without duplicates or partial data.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

export default function StarSchema() {
  const factTable = starSchemaTables.find((t) => t.name === 'fact_clickstream')!;
  const dimTables = starSchemaTables.filter((t) => t.type === 'dimension');
  const aggTables = starSchemaTables.filter((t) => t.name.startsWith('agg_'));

  return (
    <section id="schema" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Database className="h-8 w-8 text-emerald-500" />
            <h2 className="text-3xl sm:text-4xl font-bold">Star Schema Design</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Optimized dimensional model for analytical queries
          </p>
        </motion.div>

        {/* Tabbed Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs defaultValue="dimensions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="dimensions">
                Dimensions ({dimTables.length})
              </TabsTrigger>
              <TabsTrigger value="fact">
                Fact Table
              </TabsTrigger>
              <TabsTrigger value="aggregates">
                Aggregates ({aggTables.length})
              </TabsTrigger>
            </TabsList>

            {/* Dimensions Tab */}
            <TabsContent value="dimensions">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dimTables.map((table, i) => (
                  <motion.div
                    key={table.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <TableCard table={table} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Fact Table Tab */}
            <TabsContent value="fact">
              <div className="max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <TableCard table={factTable} isCenter />
                </motion.div>
              </div>
            </TabsContent>

            {/* Aggregates Tab */}
            <TabsContent value="aggregates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aggTables.map((table, i) => (
                  <motion.div
                    key={table.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <TableCard table={table} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Key Design Decisions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Key Design Decisions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {designDecisions.map((decision, i) => (
              <motion.div
                key={decision.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${decision.bgColor} mb-2`}>
                      <decision.icon className={`h-5 w-5 ${decision.color}`} />
                    </div>
                    <CardTitle className="text-lg">{decision.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {decision.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

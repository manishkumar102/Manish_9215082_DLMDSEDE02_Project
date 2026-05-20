'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

/* ────────────────────── DAG Node Data ────────────────────── */

type TaskStatus = 'success' | 'running' | 'pending'

interface DagTask {
  id: string
  name: string
  status: TaskStatus
  duration: string
  retries: number
}

const dagTasks: DagTask[] = [
  { id: 'task_1', name: 'generate_mock_data', status: 'success', duration: '12s', retries: 0 },
  { id: 'task_2', name: 'ingest_csv', status: 'success', duration: '28s', retries: 0 },
  { id: 'task_3', name: 'spark_clean', status: 'success', duration: '2m 14s', retries: 0 },
  { id: 'task_4', name: 'spark_validate', status: 'success', duration: '1m 47s', retries: 0 },
  { id: 'task_5', name: 'write_parquet', status: 'success', duration: '58s', retries: 0 },
  { id: 'task_6', name: 'dbt_run', status: 'running', duration: '—', retries: 0 },
  { id: 'task_7', name: 'dbt_test', status: 'pending', duration: '—', retries: 0 },
  { id: 'task_8', name: 'load_warehouse', status: 'pending', duration: '—', retries: 0 },
  { id: 'task_9', name: 'refresh_metrics', status: 'pending', duration: '—', retries: 0 },
]

const nodeWidth = 140
const nodeHeight = 42
const horizontalGap = 40
const verticalGap = 16

/* ────────────────────── SVG DAG Drawing ────────────────────── */

function DagGraph() {
  /* Layout: 3 rows x 3 columns */
  const cols = 3
  const rows = 3
  const graphWidth = cols * nodeWidth + (cols - 1) * horizontalGap
  const graphHeight = rows * nodeHeight + (rows - 1) * verticalGap

  const getNodeCenter = (index: number) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      x: col * (nodeWidth + horizontalGap) + nodeWidth / 2,
      y: row * (nodeHeight + verticalGap) + nodeHeight / 2,
    }
  }

  const statusColors: Record<TaskStatus, { fill: string; stroke: string; text: string }> = {
    success: {
      fill: 'bg-emerald-500 dark:bg-emerald-600',
      stroke: 'border-emerald-600 dark:border-emerald-700',
      text: 'text-white',
    },
    running: {
      fill: 'bg-teal-500 dark:bg-teal-600',
      stroke: 'border-teal-600 dark:border-teal-700',
      text: 'text-white',
    },
    pending: {
      fill: 'bg-slate-200 dark:bg-slate-700',
      stroke: 'border-slate-300 dark:border-slate-600',
      text: 'text-slate-600 dark:text-slate-300',
    },
  }

  /* Arrow lines between consecutive nodes */
  const arrows = dagTasks.slice(0, -1).map((_, i) => {
    const from = getNodeCenter(i)
    const to = getNodeCenter(i + 1)
    /* Only draw horizontal arrows within a row, or a down-turn arrow at row boundary */
    const fromCol = i % cols
    const toCol = (i + 1) % cols

    let path = ''
    if (toCol > fromCol) {
      /* Same row, arrow to the right */
      const x1 = from.x + nodeWidth / 2
      const x2 = to.x - nodeWidth / 2
      const y = from.y
      path = `M ${x1} ${y} L ${x2} ${y}`
    } else {
      /* End of row → start of next row (turn down and back) */
      const x1 = from.x + nodeWidth / 2
      const xMid = x1 + horizontalGap / 2
      const x2 = to.x - nodeWidth / 2
      const y1 = from.y
      const y2 = to.y
      path = `M ${x1} ${y1} L ${xMid} ${y1} L ${xMid} ${y2} L ${x2} ${y2}`
    }

    return { path, key: `arrow-${i}` }
  })

  /* Arrowhead marker */
  const markerId = 'arrowhead'

  return (
    <div className="w-full overflow-x-auto pb-2">
      <svg
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        className="mx-auto min-w-[500px]"
        style={{ maxHeight: 220 }}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="currentColor" className="text-slate-400 dark:text-slate-500" />
          </marker>
        </defs>

        {/* Arrows */}
        {arrows.map(({ path, key }) => (
          <path
            key={key}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-300 dark:text-slate-600"
            markerEnd={`url(#${markerId})`}
          />
        ))}

        {/* Nodes */}
        {dagTasks.map((task, i) => {
          const center = getNodeCenter(i)
          const x = center.x - nodeWidth / 2
          const y = center.y - nodeHeight / 2
          const colors = statusColors[task.status]
          const isRunning = task.status === 'running'

          return (
            <g key={task.id}>
              {isRunning ? (
                <motion.rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={8}
                  ry={8}
                  fill="url(#runningGradient)"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-teal-400 dark:text-teal-500"
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ) : (
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={8}
                  ry={8}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={
                    task.status === 'success'
                      ? 'text-emerald-500 dark:text-emerald-600'
                      : 'text-slate-200 dark:text-slate-700'
                  }
                />
              )}
              <text
                x={center.x}
                y={center.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="currentColor"
                fontSize="11"
                fontWeight="600"
                className={
                  task.status === 'pending'
                    ? 'text-slate-500 dark:text-slate-400'
                    : 'text-white'
                }
              >
                {task.name}
              </text>
            </g>
          )
        })}

        {/* Gradient for running node */}
        <defs>
          <linearGradient id="runningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

/* ────────────────────── Section Component ────────────────────── */

export default function AirflowDag() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'success':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
          >
            Success
          </Badge>
        )
      case 'running':
        return (
          <Badge
            variant="secondary"
            className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
          >
            Running
          </Badge>
        )
      case 'pending':
        return (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            Pending
          </Badge>
        )
    }
  }

  return (
    <section
      id="airflow-dag"
      className="py-16 sm:py-20 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          ref={ref}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase mb-3">
              Orchestration
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Airflow DAG
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Orchestration workflow for the daily pipeline run
            </p>
          </motion.div>
        </motion.div>

        {/* DAG Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <Card className="border-border/50">
            <CardContent className="p-6">
              <DagGraph />
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Details Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Task Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Retries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dagTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-xs">
                        {task.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {task.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {task.duration}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.retries}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

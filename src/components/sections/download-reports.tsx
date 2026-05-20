'use client';

import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  FileText,
  Download,
  FileArchive,
} from 'lucide-react';

interface DownloadFile {
  name: string;
  description: string;
  format: string;
  size: string;
  path: string;
  icon: React.ReactNode;
  accent: string;
}

const files: DownloadFile[] = [
  {
    name: 'Architecture Diagram',
    description: '2800×1800px glassmorphism design',
    format: 'PNG',
    size: '2.4 MB',
    path: '/submission-files/architecture-diagram.png',
    icon: <ImageIcon className="h-8 w-8 text-teal-500" />,
    accent: 'from-teal-500/20 to-emerald-500/20',
  },
  {
    name: 'Phase 1 Concept',
    description: '~200 word conception text',
    format: 'TXT',
    size: '12 KB',
    path: '/submission-files/Phase1_Concept_Text.txt',
    icon: <FileText className="h-8 w-8 text-emerald-500" />,
    accent: 'from-emerald-500/20 to-green-500/20',
  },
  {
    name: 'Phase 2 Implementation',
    description: 'Implementation explanation',
    format: 'TXT',
    size: '18 KB',
    path: '/submission-files/Phase2_Implementation_Text.txt',
    icon: <FileText className="h-8 w-8 text-green-500" />,
    accent: 'from-green-500/20 to-teal-500/20',
  },
  {
    name: 'Phase 3 Abstract',
    description: '2-page academic abstract',
    format: 'PDF',
    size: '340 KB',
    path: '/Phase3_Abstract.pdf',
    icon: <FileText className="h-8 w-8 text-teal-600" />,
    accent: 'from-teal-600/20 to-emerald-600/20',
  },
  {
    name: 'Portfolio Reference Guide',
    description: '7-page consolidated guide',
    format: 'PDF',
    size: '1.8 MB',
    path: '/upload/Data_Engineering_Portfolio_Reference_Guide.pdf',
    icon: <FileText className="h-8 w-8 text-emerald-600" />,
    accent: 'from-emerald-600/20 to-green-600/20',
  },
  {
    name: 'Project Archive',
    description: 'Complete project source code',
    format: 'ZIP',
    size: '14.2 MB',
    path: '/my-project.zip',
    icon: <FileArchive className="h-8 w-8 text-green-600" />,
    accent: 'from-green-600/20 to-teal-600/20',
  },
];

const formatBadgeColors: Record<string, string> = {
  PNG: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  TXT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PDF: 'bg-green-500/10 text-green-600 dark:text-green-400',
  ZIP: 'bg-teal-600/10 text-teal-600 dark:text-teal-400',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function DownloadReports() {
  return (
    <section id="downloads" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Download Reports
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Access project artifacts including architecture diagrams, phase
            documentation, academic abstracts, and the complete source archive.
          </p>
        </motion.div>

        {/* Download cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {files.map((file) => (
            <motion.div
              key={file.path}
              variants={cardVariants}
              className="group relative rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              {/* Gradient border accent on hover */}
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${file.accent} opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm`}
              />

              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-muted/50">{file.icon}</div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${formatBadgeColors[file.format] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {file.format}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-1">{file.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {file.description}
              </p>
              <p className="text-xs text-muted-foreground/70 mb-5">
                {file.size}
              </p>

              <a
                href={file.path}
                download
                className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

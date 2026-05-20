'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container, Layers, Code, HardDrive, Terminal, Copy, Check } from 'lucide-react';
import {
  gettingStartedSteps,
  quickCommands,
} from '@/data/pipeline-data';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label="Copy command"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function CodeBlock({ command }: { command: string }) {
  return (
    <div className="relative mt-3 group">
      <CopyButton text={command} />
      <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 font-mono text-sm text-emerald-400 overflow-x-auto scrollbar-thin">
        <span className="text-slate-500 mr-1">$</span>
        {command}
      </div>
    </div>
  );
}

const prerequisites = [
  {
    icon: Container,
    name: 'Docker 20+',
    description: 'Container runtime for all services',
  },
  {
    icon: Layers,
    name: 'Docker Compose v2',
    description: 'Multi-container orchestration',
  },
  {
    icon: Code,
    name: 'Python 3.10+',
    description: 'For scripts and Spark jobs',
  },
  {
    icon: HardDrive,
    name: '8GB RAM / 20GB Disk',
    description: 'Minimum system requirements',
  },
];

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function GettingStarted() {
  return (
    <section id="getting-started" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Terminal className="h-8 w-8 text-emerald-500" />
            <h2 className="text-3xl sm:text-4xl font-bold">Getting Started</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Launch the full pipeline in 5 simple steps
          </p>
        </motion.div>

        {/* Step Cards */}
        <div className="space-y-6 mb-16">
          {gettingStartedSteps.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              variants={stepVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              className="relative"
            >
              <Card className="border-l-4 border-emerald-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-4 sm:gap-6">
                    {/* Step number badge */}
                    <div className="relative shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
                        {step.step}
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mb-0">
                        {step.description}
                      </p>
                      <CodeBlock command={step.command} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Prerequisites */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Prerequisites</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {prerequisites.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="h-full text-center">
                  <CardHeader className="pb-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 mb-2">
                      <item.icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">Quick Commands</h3>
          <Card>
            <CardContent className="p-0">
              {quickCommands.map((item, idx) => (
                <div
                  key={`${item.command}-${idx}`}
                  className={`flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors ${idx > 0 ? 'border-t' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-sm text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded">
                      {item.command}
                    </code>
                  </div>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {item.description}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

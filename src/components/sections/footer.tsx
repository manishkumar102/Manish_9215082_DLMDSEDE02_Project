'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, ExternalLink, ArrowUp } from 'lucide-react';

const footerLinks = {
  Documentation: [
    { label: 'Architecture', href: '#schema', external: false },
    { label: 'Data Dictionary', href: '#', external: false },
    { label: 'Setup Guide', href: '#getting-started', external: false },
  ],
  'Source Code': [
    { label: 'GitHub', href: '#', external: false },
    { label: 'Docker Compose', href: '#', external: false },
    { label: 'dbt Models', href: '#', external: false },
  ],
  Resources: [
    { label: 'Apache Spark', href: 'https://spark.apache.org/docs/', external: true },
    { label: 'dbt Docs', href: 'https://docs.getdbt.com/', external: true },
    { label: 'Metabase Docs', href: 'https://www.metabase.com/docs', external: true },
  ],
};

const techBadges = [
  'Next.js 16',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Recharts',
  'Framer Motion',
  'Prisma',
  'shadcn/ui',
  'SQLite',
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-muted/60 dark:bg-slate-950 text-foreground mt-auto footer-gradient-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
              <span className="text-lg font-bold text-foreground">
                Clickstream Analytics
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              An end-to-end e-commerce clickstream analytics pipeline built with
              Apache Spark, dbt, and Metabase. Designed for scalability and
              real-time insights.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-foreground text-sm mb-4 uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="text-sm text-muted-foreground hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col items-center gap-4">
          {/* Tech Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {techBadges.map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="bg-muted text-muted-foreground border-border text-xs"
              >
                {badge}
              </Badge>
            ))}
          </div>

          {/* Info Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 Clickstream Analytics Pipeline. Built for academic portfolio.
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: May 2026
            </p>
          </div>

          {/* Back to Top */}
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors mt-1"
          >
            Back to Top
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}

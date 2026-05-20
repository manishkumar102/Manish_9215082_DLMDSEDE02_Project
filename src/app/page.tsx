'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/sections/nav';
import Hero from '@/components/sections/hero';
import Stats from '@/components/sections/stats';
import Architecture from '@/components/sections/architecture';
import TechStack from '@/components/sections/tech-stack';
import MicroservicesMap from '@/components/sections/microservices-map';
import IaCDockerShowcase from '@/components/sections/iac-docker';
import StreamingStrategy from '@/components/sections/streaming-strategy';
import PipelineSimulator from '@/components/sections/pipeline-simulator';
import PipelineDeepDive from '@/components/sections/pipeline-deep-dive';
import DashboardPreviews from '@/components/sections/dashboard-previews';
import SqlPlayground from '@/components/sections/sql-playground';
import DataQuality from '@/components/sections/data-quality';
import PerformanceBenchmark from '@/components/sections/performance-benchmark';
import CostCalculator from '@/components/sections/cost-calculator';
import Glossary from '@/components/sections/glossary';
import ApiDocs from '@/components/sections/api-docs';
import StarSchema from '@/components/sections/star-schema';
import ProjectStructure from '@/components/sections/project-structure';
import GettingStarted from '@/components/sections/getting-started';
import Faq from '@/components/sections/faq';
import SecurityGovernance from '@/components/sections/security-governance';
import ReliabilityScalability from '@/components/sections/reliability-scalability';
import DataSources from '@/components/sections/data-sources';
import DataLineage from '@/components/sections/data-lineage';
import DbSchemaExplorer from '@/components/sections/db-schema-explorer';
import ConfigExplorer from '@/components/sections/config-explorer';
import ScrollProgress from '@/components/sections/scroll-progress';
import BackToTop from '@/components/sections/back-to-top';
import Footer from '@/components/sections/footer';
import SectionDivider from '@/components/sections/section-divider';
import DownloadReports from '@/components/sections/download-reports';
import PipelineHealth from '@/components/sections/pipeline-health';
import LiveEventStream from '@/components/sections/live-event-stream';
import PipelineComparison from '@/components/sections/pipeline-comparison';
import MlPipeline from '@/components/sections/ml-pipeline';

// ============================================================================
// Sidebar Section Definitions
// ============================================================================

export interface SidebarSection {
  id: string;
  label: string;
  icon: string;
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: 'hero', label: 'Overview', icon: '🏠' },
  { id: 'stats', label: 'Stats', icon: '📈' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'tech-stack', label: 'Tech Stack', icon: '⚙️' },
  { id: 'microservices', label: 'Microservices', icon: '🔗' },
  { id: 'iac', label: 'IaC / Docker', icon: '🐳' },
  { id: 'streaming', label: 'Streaming', icon: '📡' },
  { id: 'data-sources', label: 'Data Sources', icon: '📦' },
  { id: 'data-lineage', label: 'Data Lineage', icon: '🧬' },
  { id: 'pipeline-simulator', label: 'Pipeline Simulator', icon: '🔄' },
  { id: 'pipeline-deep-dive', label: 'Pipeline Deep Dive', icon: '🔍' },
  { id: 'dashboards', label: 'Analytics Dashboard', icon: '📊' },
  { id: 'sql-playground', label: 'SQL Playground', icon: '💾' },
  { id: 'data-quality', label: 'Data Quality', icon: '✅' },
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'cost-calculator', label: 'Cost Calculator', icon: '💰' },
  { id: 'glossary', label: 'Glossary', icon: '📖' },
  { id: 'api-docs', label: 'API Docs', icon: '🔌' },
  { id: 'db-schema', label: 'DB Schema', icon: '🗄️' },
  { id: 'config-explorer', label: 'Config', icon: '🔧' },
  { id: 'downloads', label: 'Downloads', icon: '📥' },
  { id: 'schema', label: 'Star Schema', icon: '⭐' },
  { id: 'project-structure', label: 'Project Structure', icon: '📁' },
  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { id: 'faq', label: 'FAQ', icon: '❓' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'rsm', label: 'Reliability & Scale', icon: '🛡️' },
  { id: 'pipeline-health', label: 'Pipeline Health', icon: '💚' },
  { id: 'live-events', label: 'Live Events', icon: '🟢' },
  { id: 'comparison', label: 'Pipeline Comparison', icon: '⚖️' },
  { id: 'ml-pipeline', label: 'ML Pipeline', icon: '🧠' },
];

// ============================================================================
// Main Page
// ============================================================================

export default function Home() {
  const [activeSection, setActiveSection] = useState('hero');

  // Intersection Observer to highlight active sidebar link
  useEffect(() => {
    const sectionIds = SIDEBAR_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    // Small delay to let sections render
    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Nav activeSection={activeSection} />
      <ScrollProgress />
      <BackToTop />
      <main className="flex-1 lg:ml-60 pt-14">
        <Hero />
        <Stats />
        <SectionDivider />
        <Architecture />
        <SectionDivider />
        <TechStack />
        <SectionDivider />
        <MicroservicesMap />
        <SectionDivider />
        <IaCDockerShowcase />
        <SectionDivider />
        <StreamingStrategy />
        <SectionDivider />
        <DataSources />
        <SectionDivider />
        <DataLineage />
        <SectionDivider />
        <PipelineSimulator />
        <SectionDivider />
        <PipelineDeepDive />
        <SectionDivider />
        <DashboardPreviews />
        <SectionDivider />
        <SqlPlayground />
        <SectionDivider />
        <DataQuality />
        <SectionDivider />
        <PerformanceBenchmark />
        <SectionDivider />
        <CostCalculator />
        <SectionDivider />
        <Glossary />
        <SectionDivider />
        <ApiDocs />
        <SectionDivider />
        <DbSchemaExplorer />
        <SectionDivider />
        <ConfigExplorer />
        <SectionDivider />
        <DownloadReports />
        <SectionDivider />
        <StarSchema />
        <SectionDivider />
        <ProjectStructure />
        <SectionDivider />
        <GettingStarted />
        <SectionDivider />
        <Faq />
        <SectionDivider />
        <SecurityGovernance />
        <SectionDivider />
        <ReliabilityScalability />
        <SectionDivider />
        <PipelineHealth />
        <SectionDivider />
        <LiveEventStream />
        <SectionDivider />
        <PipelineComparison />
        <SectionDivider />
        <MlPipeline />
      </main>
      <Footer />
    </div>
  );
}

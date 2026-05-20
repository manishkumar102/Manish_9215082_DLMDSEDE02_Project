'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Search,
  FileCode2,
  FileText,
  Database,
  Settings,
  FolderTree,
  File,
  GitBranch,
  Container,
  Shield,
} from 'lucide-react';
import { projectStructure, type TreeNode } from '@/data/pipeline-data';

// ============================================================================
// Color helpers
// ============================================================================

function getFileColor(name: string): string {
  if (name.endsWith('.py')) return 'text-emerald-500 dark:text-emerald-400';
  if (name.endsWith('.sql')) return 'text-amber-600 dark:text-amber-400';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'text-fuchsia-600 dark:text-fuchsia-400';
  if (name.endsWith('.csv')) return 'text-cyan-600 dark:text-cyan-400';
  if (name.startsWith('Dockerfile')) return 'text-sky-600 dark:text-sky-400';
  if (name.endsWith('.md')) return 'text-slate-500 dark:text-slate-400';
  if (name.endsWith('.sh')) return 'text-rose-600 dark:text-rose-400';
  if (name.endsWith('.json')) return 'text-yellow-600 dark:text-yellow-400';
  if (name === 'Makefile') return 'text-orange-600 dark:text-orange-400';
  if (name.endsWith('.txt')) return 'text-slate-500 dark:text-slate-500';
  if (name.startsWith('.env')) return 'text-slate-500 dark:text-slate-500';
  return 'text-slate-600 dark:text-slate-300';
}

function getFileIcon(name: string) {
  if (name.endsWith('.py')) return <FileCode2 className="h-3.5 w-3.5" />;
  if (name.endsWith('.sql')) return <Database className="h-3.5 w-3.5" />;
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return <Settings className="h-3.5 w-3.5" />;
  if (name.startsWith('Dockerfile')) return <Container className="h-3.5 w-3.5" />;
  if (name.endsWith('.sh')) return <Shield className="h-3.5 w-3.5" />;
  if (name.endsWith('.md')) return <FileText className="h-3.5 w-3.5" />;
  return <File className="h-3.5 w-3.5" />;
}

// ============================================================================
// File type stats
// ============================================================================

interface FileTypeStat {
  ext: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

function collectFileStats(node: TreeNode, stats: Map<string, number>) {
  if (node.type === 'file') {
    const ext = node.name.includes('.')
      ? node.name.split('.').pop()!
      : node.name;
    stats.set(ext, (stats.get(ext) || 0) + 1);
  }
  (node.children || []).forEach((c) => collectFileStats(c, stats));
}

// ============================================================================
// Search filter
// ============================================================================

function nodeMatches(node: TreeNode, query: string): boolean {
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  return (node.children || []).some((c) => nodeMatches(c, q));
}

// ============================================================================
// File Tree Node
// ============================================================================

interface FileTreeNodeProps {
  node: TreeNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;

  const toggle = useCallback(() => {
    if (hasChildren) setIsOpen((prev) => !prev);
  }, [hasChildren]);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-[3px] px-2 rounded hover:bg-muted/60 cursor-pointer transition-colors group"
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={toggle}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {/* Chevron for folders */}
        {hasChildren ? (
          <span className="shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400/80 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400/80 shrink-0" />
          )
        ) : (
          <span className={`shrink-0 ${getFileColor(node.name)}`}>
            {getFileIcon(node.name)}
          </span>
        )}

        {/* Name */}
        <span
          className={`text-[13px] leading-snug truncate font-mono ${
            isFolder
              ? 'text-foreground font-medium'
              : getFileColor(node.name)
          }`}
        >
          {node.name}
        </span>

        {/* Item count on hover for folders */}
        {isFolder && node.children && node.children.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <FileTreeNode
              key={`${child.name}-${depth}-${index}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Counting helpers
// ============================================================================

function countFiles(node: TreeNode): number {
  if (node.type === 'file') return 1;
  return (node.children || []).reduce((sum, child) => sum + countFiles(child), 0);
}

function countFolders(node: TreeNode): number {
  if (node.type === 'file') return 0;
  const childFolders = (node.children || []).reduce(
    (sum, child) => sum + countFolders(child),
    0
  );
  return node.name === 'ecommerce-clickstream-pipeline' ? childFolders : childFolders + 1;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProjectStructure() {
  const root = projectStructure[0];
  const [searchQuery, setSearchQuery] = useState('');

  const totalFiles = useMemo(() => countFiles(root), [root]);
  const totalDirs = useMemo(() => countFolders(root), [root]);

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return root.children || [];
    return (root.children || []).filter((child) => nodeMatches(child, searchQuery));
  }, [root.children, searchQuery]);

  const fileStats = useMemo(() => {
    const stats = new Map<string, number>();
    collectFileStats(root, stats);
    const sorted = Array.from(stats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return sorted;
  }, [root]);

  return (
    <section id="project-structure" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Project Structure</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Complete codebase organization with 50+ production-ready files
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-sky-500/10 p-2">
                <FolderTree className="h-5 w-5 text-sky-500 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{totalFiles}</p>
                <p className="text-xs text-muted-foreground">Files</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Folder className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{totalDirs}</p>
                <p className="text-xs text-muted-foreground">Directories</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <GitBranch className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{fileStats.length}+</p>
                <p className="text-xs text-muted-foreground">File Types</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* File tree card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="bg-card border-border overflow-hidden shadow-lg dark:shadow-slate-950/50">
            {/* Title bar (macOS style) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-sm font-mono text-foreground ml-2">
                  ecommerce-clickstream-pipeline/
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] font-mono bg-muted text-muted-foreground border-border">
                  {totalFiles} files
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono bg-muted text-muted-foreground border-border">
                  {totalDirs} dirs
                </Badge>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-8 text-xs font-mono bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* File tree */}
            <div className="max-h-[480px] overflow-y-auto py-1">
              {filteredChildren.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-mono">No files matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                filteredChildren.map((child, index) => (
                  <FileTreeNode
                    key={child.name}
                    node={child}
                    depth={0}
                  />
                ))
              )}
            </div>

            {/* File type breakdown footer */}
            <div className="border-t border-border px-4 py-2.5 bg-muted/20">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {fileStats.map(([ext, count]) => (
                  <span key={ext} className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                    <span className={`font-medium ${getFileColor('.' + ext)}`}>.{ext}</span>
                    <span className="text-muted-foreground/50">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

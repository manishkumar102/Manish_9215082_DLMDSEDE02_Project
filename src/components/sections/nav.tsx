'use client';

import { useSyncExternalStore, useState, useEffect, useCallback } from 'react';
import { Database, Sun, Moon, Menu, X, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SidebarSection } from '@/app/page';
import { SIDEBAR_SECTIONS } from '@/app/page';

// ============================================================================
// Types
// ============================================================================

interface NavProps {
  activeSection: string;
}

// ============================================================================
// Hydration-safe mounted hook
// ============================================================================

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ============================================================================
// Theme Toggle
// ============================================================================

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    return <div className={cn('h-9 w-9 rounded-lg bg-muted animate-pulse', className)} />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn('rounded-lg transition-all duration-300 hover:scale-110', className)}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="text-amber-400 transition-transform duration-300 h-[18px] w-[18px]" />
      ) : (
        <Moon className="text-slate-700 transition-transform duration-300 h-[18px] w-[18px]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// ============================================================================
// Sidebar Link
// ============================================================================

function SidebarLink({
  section,
  isActive,
  onClick,
}: {
  section: SidebarSection;
  isActive: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(section.id)}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left',
        isActive
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
      )}
    >
      <span className="text-base leading-none shrink-0">{section.icon}</span>
      <span className="truncate">{section.label}</span>
      {isActive && (
        <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0 text-emerald-500" />
      )}
    </button>
  );
}

// ============================================================================
// Main Nav Component
// ============================================================================

export default function Nav({ activeSection }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useIsMounted();

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  }, []);

  // Close mobile sidebar on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close mobile sidebar when section changes (via callback in scrollTo)
  // This avoids calling setState in an effect body

  return (
    <>
      {/* ===== Top Bar (always visible) ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Database className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground hidden sm:block">
            ClickStream Analytics
          </span>
        </div>

        <ThemeToggle />
      </header>

      {/* ===== Desktop Sidebar (lg+) ===== */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-14 left-0 bottom-0 w-60 bg-background/95 backdrop-blur-sm border-r border-border/50 z-40 overflow-y-auto',
          'scrollbar-none',
        )}
        style={{ scrollbarWidth: 'none' }}
      >
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {SIDEBAR_SECTIONS.map((section) => (
            <SidebarLink
              key={section.id}
              section={section}
              isActive={activeSection === section.id}
              onClick={scrollTo}
            />
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Data Engineering Portfolio
            <br />
            Medallion Architecture • 1M Events • 29 Sections
          </p>
        </div>
      </aside>

      {/* ===== Mobile Sidebar Overlay ===== */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border shadow-xl flex flex-col">
            {/* Mobile header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <Database className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  ClickStream Analytics
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Mobile nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {SIDEBAR_SECTIONS.map((section) => (
                <SidebarLink
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  onClick={scrollTo}
                />
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Data Engineering Portfolio
                <br />
                Medallion Architecture • 1M Events • 29 Sections
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const SHORTCUT_MAP: Record<string, { id: string; label: string }> = {
  '1': { id: 'hero', label: 'Overview' },
  '2': { id: 'architecture', label: 'Architecture' },
  '3': { id: 'tech-stack', label: 'Tech Stack' },
  '4': { id: 'pipeline-deep-dive', label: 'Pipeline Deep Dive' },
  '5': { id: 'dashboards', label: 'Dashboards' },
  '6': { id: 'star-schema', label: 'Star Schema' },
  '7': { id: 'project-structure', label: 'Project Structure' },
  '8': { id: 'getting-started', label: 'Getting Started' },
}

export default function KeyboardNav() {
  const [helpOpen, setHelpOpen] = useState(false)

  const scrollToId = useCallback((id: string) => {
    // For "hero" / top, scroll to the very top
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setHelpOpen((prev) => !prev)
        return
      }

      if (e.key === 'Escape') {
        setHelpOpen(false)
        return
      }

      const shortcut = SHORTCUT_MAP[e.key]
      if (shortcut) {
        e.preventDefault()
        scrollToId(shortcut.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollToId])

  return (
    <>
      {/* Shortcut help badge */}
      <div className="fixed bottom-6 left-6 z-30">
        <Badge
          variant="outline"
          className="cursor-pointer select-none text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => setHelpOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Show keyboard shortcuts"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setHelpOpen(true)
            }
          }}
        >
          ? for shortcuts
        </Badge>
      </div>

      {/* Help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use number keys to quickly jump to sections on the page.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid gap-1">
            {Object.entries(SHORTCUT_MAP).map(([key, { label }]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <kbd className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted font-mono text-xs font-medium">
                  {key}
                </kbd>
                <span className="text-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
            <kbd className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted font-mono text-xs font-medium">
              ?
            </kbd>
            <span className="text-foreground">Toggle this help dialog</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

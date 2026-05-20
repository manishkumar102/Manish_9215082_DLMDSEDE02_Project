'use client'

import { useState, useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current !== null) return

      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight

        if (docHeight > 0) {
          setProgress((scrollTop / docHeight) * 100)
        }

        rafRef.current = null
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const isVisible = progress > 5

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0, pointerEvents: 'none' }}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-[width] duration-150 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page scroll progress"
      />
    </div>
  )
}

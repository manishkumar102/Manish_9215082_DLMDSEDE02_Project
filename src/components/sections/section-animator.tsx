'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionAnimatorProps {
  children: ReactNode;
  /** Delay before animation starts (seconds) — default 0 */
  delay?: number;
  /** Animation duration (seconds) — default 0.6 */
  duration?: number;
  /** Extra vertical slide distance (px) — default 24 */
  slideDistance?: number;
  /** IntersectionObserver margin — default '-80px' */
  margin?: string;
  /** Optional className on the wrapper div */
  className?: string;
}

/**
 * Lightweight scroll-triggered fade-in + slide-up wrapper.
 * Fires once when the element scrolls into the viewport.
 */
export default function SectionAnimator({
  children,
  delay = 0,
  duration = 0.6,
  slideDistance = 24,
  margin = '-80px',
  className,
}: SectionAnimatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as `${number}px` });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: slideDistance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: slideDistance }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1], // ease-out cubic
      }}
    >
      {children}
    </motion.div>
  );
}

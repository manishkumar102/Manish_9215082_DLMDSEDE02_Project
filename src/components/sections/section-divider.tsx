'use client';

import { motion } from 'framer-motion';

export default function SectionDivider() {
  return (
    <div className="relative py-8">
      <motion.div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(var(--border)), transparent)',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 0.6 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {/* Center diamond */}
      <motion.div
        className="relative mx-auto w-3 h-3 rotate-45 border border-border/50 bg-card"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
      />
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  Server,
  GitBranch,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const statCards = [
  {
    icon: TrendingUp,
    value: 1000000,
    displayValue: '1M',
    label: 'Events Processed',
  },
  {
    icon: Server,
    value: 9,
    displayValue: '9',
    label: 'Microservices',
  },
  {
    icon: GitBranch,
    value: 8,
    displayValue: '8',
    label: 'Pipeline Stages',
  },
  {
    icon: BarChart3,
    value: 25,
    displayValue: '25+',
    label: 'SQL Queries',
  },
];

function AnimatedCounter({ value, displayValue }: { value: number; displayValue: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => {
    if (value >= 1000000) {
      return '1M';
    }
    if (displayValue.endsWith('+')) {
      return `${Math.round(v)}+`;
    }
    return Math.round(v).toString();
  });
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 2,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [isInView, motionValue, value]);

  return (
    <motion.span ref={ref}>{rounded}</motion.span>
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[150px]" />
    </div>
  );
}

const particlePositions = Array.from({ length: 20 }).map((_, i) => {
  return {
    left: ((i * 37 + 13) % 97) + 1.5,
    top: ((i * 53 + 7) % 95) + 2,
    duration: 3 + ((i * 7) % 4),
    delay: ((i * 3) % 2),
  };
});

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particlePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-emerald-400/30"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: pos.duration,
            repeat: Infinity,
            delay: pos.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 lg:-ml-60">
      <div className="absolute inset-0">
        <Image
          src="/pipeline-hero.png"
          alt="Data Pipeline Visualization"
          fill
          className="object-cover opacity-[0.08]"
          priority
        />
      </div>
      <GridPattern />
      <FloatingParticles />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Pulse glow behind heading */}
        <motion.div variants={fadeInUp} className="relative inline-block">
          <div className="absolute inset-0 -inset-x-16 -inset-y-8 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-400/15 to-cyan-400/20 blur-[80px] hero-pulse-glow pointer-events-none" />
          <h1 className="relative text-5xl md:text-7xl font-bold tracking-tight">
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              E-Commerce Clickstream
            </span>
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Analytics Pipeline
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-6 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          variants={fadeInUp}
        >
          <span className="typing-cursor">
            End-to-end batch processing data pipeline for analyzing 1M+
            e-commerce clickstream events from the Alibaba Taobao dataset
          </span>
        </motion.p>

        <motion.div
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
          variants={staggerContainer}
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              className="bg-white/5 border border-emerald-500/20 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 hover:border-emerald-500/40 transition-colors"
              variants={fadeInUp}
            >
              <stat.icon className="h-5 w-5 mx-auto text-emerald-400 mb-2" />
              <div className="text-2xl sm:text-3xl font-bold text-white">
                <AnimatedCounter value={stat.value} displayValue={stat.displayValue} />
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={fadeInUp}
        >
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-lg text-base"
            onClick={() => scrollTo('architecture')}
          >
            Explore Architecture
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent font-semibold px-6 py-3 rounded-lg text-base"
            onClick={() => scrollTo('dashboards')}
          >
            View Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const LAUREL_LEAVES = [
  { x: 0, y: 0, r: -8, s: 1 },
  { x: -14, y: 10, r: -18, s: 0.95 },
  { x: -26, y: 26, r: -30, s: 0.9 },
  { x: -34, y: 46, r: -42, s: 0.85 },
  { x: -38, y: 68, r: -54, s: 0.78 },
  { x: -36, y: 90, r: -64, s: 0.7 },
];

function LaurelBranch({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? -1 : 1;
  return (
    <g
      transform={`translate(${side === "right" ? 260 : 0}, 0) scale(${flip}, 1)`}
    >
      {LAUREL_LEAVES.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={12 * leaf.s}
          ry={5.5 * leaf.s}
          transform={`rotate(${leaf.r} ${leaf.x} ${leaf.y})`}
          fill="none"
          stroke="#8FA88A"
          strokeWidth="1.4"
          opacity={0.55}
        />
      ))}
    </g>
  );
}

function AnimatedCounter({
  value,
  suffix = "",
  duration = 2.5,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const progress = Math.min(
        (currentTime - startTime) / (duration * 1000),
        1,
      );

      // Smooth ease-out
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.floor(eased * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function ElapsedTime() {
  const START_DATE = new Date("2025-05-23T00:00:00+05:45");

  const [elapsed, setElapsed] = React.useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const updateElapsed = () => {
      const now = new Date();

      let years = now.getFullYear() - START_DATE.getFullYear();

      const anniversary = new Date(
        START_DATE.getFullYear() + years,
        START_DATE.getMonth(),
        START_DATE.getDate(),
      );

      if (now < anniversary) {
        years--;
      }

      const yearStart = new Date(
        START_DATE.getFullYear() + years,
        START_DATE.getMonth(),
        START_DATE.getDate(),
      );

      const difference = now.getTime() - yearStart.getTime();

      const totalSeconds = Math.floor(difference / 1000);

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setElapsed({
        years,
        days,
        hours,
        minutes,
        seconds,
      });
    };

    updateElapsed();

    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center px-4 sm:border-r sm:border-[#16324F]/10">
      <div className="font-serif text-2xl font-medium tracking-tight text-[#16324F] sm:text-3xl">
        {elapsed.years}{" "}
        <span className="text-lg sm:text-xl">
          {elapsed.years === 1 ? "Year" : "Years"}
        </span>
      </div>

      <div className="mt-1 text-xs font-medium text-[#16324F]/55">
        {elapsed.days}d · {String(elapsed.hours).padStart(2, "0")}h ·{" "}
        {String(elapsed.minutes).padStart(2, "0")}m ·{" "}
        {String(elapsed.seconds).padStart(2, "0")}s
      </div>

      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
        Years Active
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#ddddd6]">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(201,162,39,0.14) 0%, rgba(201,162,39,0.05) 45%, rgba(243,241,234,0) 70%)",
        }}
        aria-hidden
      />

      {/* Concentric seal rings — echoes the badge geometry of the logo */}
      <motion.svg
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-reduce:!animate-none"
        width="620"
        height="620"
        viewBox="0 0 620 620"
        fill="none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ animation: "vidya-rotate 90s linear infinite" }}
        aria-hidden
      >
        <circle
          cx="310"
          cy="310"
          r="300"
          stroke="#16324F"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <circle
          cx="310"
          cy="310"
          r="252"
          stroke="#C9A227"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      </motion.svg>
      <style>{`
        @keyframes vidya-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6 h-8 w-px origin-top bg-[#16324F]/25"
          aria-hidden
        />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-6 mt-15 max-w-md text-[11px] font-medium uppercase tracking-[0.28em] text-[#16324F]/55 sm:text-xs"
        >
          Visionary Initiatives for Developing Youth Academics
        </motion.p>

        <div className="relative flex flex-col items-center">
          {/* Laurel line art flanking the wordmark, mirroring the seal */}
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 sm:opacity-100"
            width="520"
            height="200"
            viewBox="0 0 520 200"
            fill="none"
            aria-hidden
          >
            <g transform="translate(-10, 55)">
              <LaurelBranch side="left" />
            </g>
            <g transform="translate(530, 55)">
              <LaurelBranch side="right" />
            </g>
          </svg>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.42,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative font-serif text-6xl font-medium leading-none tracking-[0.08em] text-[#16324F] sm:text-7xl md:text-8xl lg:text-9xl"
          >
            VIDYA
            <motion.span
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
              className="absolute left-1/2 top-full -translate-x-1/2 translate-y-1 origin-center"
            >
              <svg width="220" height="36" viewBox="0 0 220 36" fill="none">
                <path
                  d="M6 18 C40 6, 80 30, 110 18 C140 6, 180 30, 214 18"
                  stroke="#C9A227"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-10 text-sm font-medium uppercase tracking-[0.3em] text-[#C9A227] sm:text-base"
        >
          Thinkers over Memorizers
        </motion.p>

        <TextGenerateEffect
          words="Where Curiosity Begins."
          className="mt-4 text-lg tracking-wide text-[#16324F]/70 sm:text-xl md:text-2xl"
          duration={0.3}
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
        >
          <Link
            href="/olympiads"
            className="inline-flex rounded-full border border-[#C9A227]/50 bg-[#16324F] px-7 py-2.5 text-sm font-medium tracking-wide text-[#F3F1EA] transition-colors hover:border-[#C9A227] hover:bg-[#1D3F63]"
          >
            Explore Olympiads
          </Link>
          <Link
            href="#about"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/50 bg-[#C9A227]/10 px-5 py-2.5 text-sm font-medium tracking-wide text-[#16324F] transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/20"
          >
            Learn more
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 1.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0"
        >
          {/* Students */}
          <div className="flex flex-col items-center px-4 sm:border-r sm:border-[#16324F]/10">
            <div className="font-serif text-3xl font-medium tracking-tight text-[#16324F] sm:text-4xl">
              <AnimatedCounter value={6000} suffix="+" />
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
              Students Guided
            </p>
          </div>

          {/* Provinces */}
          <div className="flex flex-col items-center px-4 sm:border-r sm:border-[#16324F]/10">
            <div className="font-serif text-3xl font-medium tracking-tight text-[#16324F] sm:text-4xl">
              <AnimatedCounter value={4} />
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
              Provinces Reached
            </p>
          </div>

          {/* Years Active */}
          <ElapsedTime />

          {/* Volunteers */}
          <div className="flex flex-col items-center px-4">
            <div className="font-serif text-3xl font-medium tracking-tight text-[#16324F] sm:text-4xl">
              <AnimatedCounter value={75} suffix="+" />
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
              Volunteers
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

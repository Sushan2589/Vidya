"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const LEAF_POSITIONS = [
  { x: 0, y: 0, r: -8, s: 1 },
  { x: -12, y: 9, r: -18, s: 0.92 },
  { x: -22, y: 22, r: -30, s: 0.84 },
  { x: -28, y: 38, r: -42, s: 0.76 },
  { x: -30, y: 56, r: -54, s: 0.68 },
];

function LaurelLeaves({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? -1 : 1;
  return (
    <g transform={`translate(${side === "right" ? 120 : 0}, 0) scale(${flip}, 1)`}>
      {LEAF_POSITIONS.map((leaf, i) => (
        <motion.ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={10 * leaf.s}
          ry={4.5 * leaf.s}
          transform={`rotate(${leaf.r} ${leaf.x} ${leaf.y})`}
          fill="none"
          stroke="#C9A227"
          strokeWidth="1.2"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 0.6, pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
        />
      ))}
    </g>
  );
}

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Fast start, slow middle, fast finish
        const remaining = 100 - prev;
        const increment = Math.max(1, remaining * 0.08);
        return Math.min(prev + increment, 100);
      });
    }, 30);

    // Complete loading when page is ready
    const handleLoad = () => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 600);
    };

    if (document.readyState === "complete") {
      // Page already loaded, still show animation briefly
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setIsLoading(false), 600);
      }, 1200);
    } else {
      window.addEventListener("load", handleLoad);
    }

    // Fallback: hide after max 3.5 seconds
    const fallback = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 500);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      window.removeEventListener("load", handleLoad);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#ddddd6]"
        >
          {/* Subtle radial glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.04) 45%, transparent 70%)",
            }}
            aria-hidden
          />

          {/* Rotating outer ring */}
          <motion.svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="280"
            height="280"
            viewBox="0 0 280 280"
            fill="none"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{
              opacity: { duration: 0.8 },
              scale: { duration: 0.8 },
              rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            }}
            aria-hidden
          >
            <circle
              cx="140"
              cy="140"
              r="130"
              stroke="#16324F"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="#C9A227"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="8 12"
            />
          </motion.svg>

          {/* Main content */}
          <div className="relative flex flex-col items-center">
            {/* Laurel wreath */}
            <motion.svg
              width="240"
              height="100"
              viewBox="0 0 240 100"
              fill="none"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%]"
              aria-hidden
            >
              <g transform="translate(30, 15)">
                <LaurelLeaves side="left" />
              </g>
              <g transform="translate(210, 15)">
                <LaurelLeaves side="right" />
              </g>
            </motion.svg>

            {/* VIDYA wordmark */}
            <motion.h1
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative font-serif text-5xl font-medium tracking-[0.1em] text-[#16324F] sm:text-6xl"
            >
              VIDYA
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#16324F]/45 sm:text-xs"
            >
              Thinkers over Memorizers
            </motion.p>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-8 h-px w-48 overflow-hidden bg-[#16324F]/10 sm:w-56"
            >
              <motion.div
                className="h-full origin-left bg-gradient-to-r from-[#C9A227]/60 via-[#C9A227] to-[#C9A227]/60"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>

            {/* Loading text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              className="mt-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#C9A227]/60"
            >
              Loading
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {" "}
                · · ·
              </motion.span>
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

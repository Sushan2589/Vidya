"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function ScrollIndicator() {
  const handleClick = () => {
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="group absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-white/60 transition-colors hover:text-white/90"
      aria-label="Scroll to explore"
    >
      <span className="text-xs font-medium tracking-[0.25em] uppercase">
        Explore
      </span>
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
      >
        <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
      </motion.span>
    </motion.button>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Download, BookOpen, ClipboardList } from "lucide-react";

type Category = "All" | "Study Guides" | "Past Papers" | "Practice Sets";

const categories: Category[] = ["All", "Study Guides", "Past Papers", "Practice Sets"];

const resources: {
  title: string;
  category: Exclude<Category, "All">;
  format: string;
}[] = [
  { title: "Algebra Foundations", category: "Study Guides", format: "PDF · 12 pages" },
  { title: "2026 Math Olympiad Paper", category: "Past Papers", format: "PDF · 6 pages" },
  { title: "Logic Drills, Set 1", category: "Practice Sets", format: "PDF · 8 pages" },
  { title: "Reading Comprehension Guide", category: "Study Guides", format: "PDF · 10 pages" },
  { title: "2025 Science Olympiad Paper", category: "Past Papers", format: "PDF · 5 pages" },
  { title: "Number Theory Practice", category: "Practice Sets", format: "PDF · 14 pages" },
];

const categoryIcon: Record<Exclude<Category, "All">, typeof FileText> = {
  "Study Guides": BookOpen,
  "Past Papers": FileText,
  "Practice Sets": ClipboardList,
};

export function ResourcesSection() {
  const [active, setActive] = useState<Category>("All");

  const filtered =
    active === "All" ? resources : resources.filter((r) => r.category === active);

  return (
    <section className="relative overflow-hidden bg-[#ddddd6]">
      {/* Header */}
      <div className="relative px-6 pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.04) 45%, rgba(221,221,214,0) 70%)",
          }}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-2xl text-center"
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
            Resources
          </p>
          <h1 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
            Materials to help you prepare
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#16324F]/65 sm:text-base">
            Study guides, past papers, and practice sets to help you get ready for an olympiad.
          </p>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="relative px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === cat ? "text-[#FBFAF5]" : "text-[#16324F]/60 hover:text-[#16324F]"
                }`}
              >
                {active === cat && (
                  <motion.span
                    layoutId="resource-tab"
                    className="absolute inset-0 rounded-full bg-[#16324F]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{cat}</span>
              </button>
            ))}
          </div>

          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((r) => {
                const Icon = categoryIcon[r.category];
                return (
                  <motion.div
                    key={r.title}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-start gap-4 rounded-xl border border-[#16324F]/10 bg-[#FBFAF5] p-5 transition-colors hover:border-[#C9A227]/50"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#16324F]/5 text-[#16324F] transition-colors group-hover:bg-[#C9A227]/15 group-hover:text-[#C9A227]">
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#C9A227]">
                        {r.category}
                      </p>
                      <h3 className="mb-1 break-words font-serif text-base font-bold text-[#16324F]">
                        {r.title}
                      </h3>
                      <p className="text-xs text-[#16324F]/55">{r.format}</p>
                    </div>
                    <button
                      aria-label={`Download ${r.title}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#16324F]/40 transition-colors hover:bg-[#16324F]/5 hover:text-[#16324F]"
                    >
                      <Download className="size-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
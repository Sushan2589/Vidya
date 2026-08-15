"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Download, BookOpen, ClipboardList, Link2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types — mirrors the row shape returned by GET /api/resources
// ---------------------------------------------------------------------------

type Resource = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  category: string | null;
};

// A few known categories get a tailored icon; anything else (admins can type
// any category string) falls back to a generic link icon rather than
// crashing or guessing.
const knownCategoryIcons: Record<string, typeof FileText> = {
  "Study Guides": BookOpen,
  "Past Papers": FileText,
  "Practice Sets": ClipboardList,
};

function iconFor(category: string) {
  return knownCategoryIcons[category] ?? Link2;
}

// There's no stored file size/page count, so the best available signal for
// a format label is the URL's extension — falls back to a generic label
// when the link doesn't end in a recognizable file extension (e.g. a plain
// webpage link rather than a direct file).
function formatLabel(fileUrl: string) {
  const match = fileUrl.split("?")[0].match(/\.([a-zA-Z0-9]{2,5})$/);
  if (!match) return "Link";
  return match[1].toUpperCase();
}

export function ResourcesSection() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>("All");

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => setResources(data))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) set.add(r.category || "Uncategorized");
    return ["All", ...Array.from(set)];
  }, [resources]);

  const filtered =
    active === "All"
      ? resources
      : resources.filter((r) => (r.category || "Uncategorized") === active);

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
          {!loading && resources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 flex flex-wrap justify-center gap-2"
            >
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
            </motion.div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-[#16324F]/10 bg-[#16324F]/5"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <p className="text-center text-sm text-[#16324F]/55">
              Resources will appear here once they&apos;re added in the admin panel.
            </p>
          ) : (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((r) => {
                  const category = r.category || "Uncategorized";
                  const Icon = iconFor(category);
                  return (
                    <motion.a
                      key={r.id}
                      href={r.fileUrl}
                      target="_blank"
                      rel="noreferrer"
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
                          {category}
                        </p>
                        <h3 className="mb-1 break-words font-serif text-base font-bold text-[#16324F]">
                          {r.title}
                        </h3>
                        {r.description && (
                          <p className="mb-1 line-clamp-2 text-xs text-[#16324F]/60">
                            {r.description}
                          </p>
                        )}
                        <p className="text-xs text-[#16324F]/55">{formatLabel(r.fileUrl)}</p>
                      </div>
                      <span
                        aria-label={`Open ${r.title}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#16324F]/40 transition-colors group-hover:bg-[#16324F]/5 group-hover:text-[#16324F]"
                      >
                        <Download className="size-4" />
                      </span>
                    </motion.a>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
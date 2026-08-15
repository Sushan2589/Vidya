"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarRange,
  ChevronDown,
  X,
  GraduationCap,
  ListChecks,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types — mirrors the row shape returned by GET /api/events
// ---------------------------------------------------------------------------

type Olympiad = {
  slug: string;
  title: string;
  subject: string;
  level: string;
  summary: string;
  details: string;
  eligibility: string; // newline-separated
  syllabus: string; // newline-separated
  heldIn: string;
  registrationLink: string | null;
  imageUrl: string | null;
};

const toLines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// Card — unchanged visually from the original, now driven by fetched data.
// layoutId is the hook that lets the detail overlay morph out of the exact
// card that was clicked, instead of just fading in as a generic modal.
// ---------------------------------------------------------------------------

function OlympiadCard({
  olympiad,
  index,
  onOpen,
}: {
  olympiad: Olympiad;
  index: number;
  onOpen: (slug: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      layoutId={`card-${olympiad.slug}`}
    >
      <button
        onClick={() => onOpen(olympiad.slug)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#16324F]/10 bg-[#FBFAF5] text-left shadow-[0_4px_20px_rgba(22,50,79,0.05)] transition-all hover:-translate-y-1 hover:border-[#C9A227]/50 hover:shadow-[0_12px_28px_rgba(22,50,79,0.1)]"
      >
        <motion.div
          layoutId={`card-media-${olympiad.slug}`}
          className="relative h-40 w-full overflow-hidden bg-[#16324F]/5"
        >
          {olympiad.imageUrl ? (
            <Image
              src={olympiad.imageUrl}
              alt={olympiad.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#16324F]/20 text-lg font-semibold text-[#16324F]/30">
                {olympiad.subject[0]}
              </div>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full border border-[#C9A227]/40 bg-[#FBFAF5]/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[#16324F] backdrop-blur-sm">
            {olympiad.subject}
          </span>
        </motion.div>

        <div className="flex flex-1 flex-col p-6">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#C9A227]">
            {olympiad.level}
          </p>
          <h3 className="mb-2 break-words font-serif text-xl font-bold text-[#16324F]">
            {olympiad.title}
          </h3>
          <p className="mb-5 flex-1 break-words text-sm leading-relaxed text-[#16324F]/65">
            {olympiad.summary}
          </p>

          <div className="flex items-center justify-between border-t border-[#16324F]/10 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-[#16324F]/55">
              <CalendarRange className="size-3.5" />
              {olympiad.heldIn}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-[#16324F] transition-colors group-hover:text-[#C9A227]">
              View details
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Detail overlay — morphs from the clicked card via matching layoutId.
// ---------------------------------------------------------------------------

function OlympiadDetail({
  olympiad,
  onClose,
}: {
  olympiad: Olympiad;
  onClose: () => void;
}) {
  const eligibility = toLines(olympiad.eligibility);
  const syllabus = toLines(olympiad.syllabus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#16324F]/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={onClose}
      />

      <motion.div
        layoutId={`card-${olympiad.slug}`}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto my-6 min-h-[calc(100vh-3rem)] w-[92%] max-w-3xl overflow-hidden rounded-2xl bg-[#FBFAF5] shadow-[0_24px_60px_rgba(22,50,79,0.25)] sm:my-10 sm:min-h-0"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-[#16324F]/80 text-[#F3F1EA] backdrop-blur-sm transition-colors hover:bg-[#16324F]"
        >
          <X className="size-4" />
        </button>

        <motion.div
          layoutId={`card-media-${olympiad.slug}`}
          className="relative h-56 w-full overflow-hidden bg-[#16324F]/5 sm:h-72"
        >
          {olympiad.imageUrl ? (
            <Image
              src={olympiad.imageUrl}
              alt={olympiad.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <div className="flex size-20 items-center justify-center rounded-full border-2 border-[#16324F]/20 text-3xl font-semibold text-[#16324F]/30">
                {olympiad.subject[0]}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#16324F]/50 via-transparent to-transparent" />
          <span className="absolute left-5 top-5 rounded-full border border-[#C9A227]/40 bg-[#FBFAF5]/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[#16324F] backdrop-blur-sm">
            {olympiad.subject}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="p-6 sm:p-10"
        >
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#C9A227]">
            {olympiad.level}
          </p>
          <h2 className="mb-3 font-serif text-3xl font-bold text-[#16324F] sm:text-4xl">
            {olympiad.title}
          </h2>
          <p className="mb-6 flex items-center gap-1.5 text-sm text-[#16324F]/55">
            <CalendarRange className="size-4" />
            {olympiad.heldIn}
          </p>

          <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-[#16324F]/75">
            {olympiad.details}
          </p>

          <div className="grid gap-8 sm:grid-cols-2">
            {eligibility.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-[#16324F]">
                  <GraduationCap className="size-4 text-[#C9A227]" />
                  Eligibility
                </h3>
                <ul className="space-y-2">
                  {eligibility.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-relaxed text-[#16324F]/70"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-[#C9A227]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {syllabus.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-[#16324F]">
                  <ListChecks className="size-4 text-[#C9A227]" />
                  Syllabus
                </h3>
                <ul className="space-y-2">
                  {syllabus.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-relaxed text-[#16324F]/70"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-[#C9A227]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {olympiad.registrationLink && (
            <a
              href={olympiad.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#16324F] px-6 py-3 text-sm font-medium text-[#F3F1EA] transition-colors hover:bg-[#1D3F63]"
            >
              Register
              <ArrowUpRight className="size-4" />
            </a>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section — fetches once on mount, holds which card (if any) is open.
// ---------------------------------------------------------------------------

export function OlympiadsSection() {
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setOlympiads(data))
      .finally(() => setLoading(false));
  }, []);

  // lock background scroll while the detail view is open
  useEffect(() => {
    document.body.style.overflow = openSlug ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openSlug]);

  const openOlympiad = olympiads.find((o) => o.slug === openSlug) ?? null;

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
            Olympiads
          </p>
          <h1 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
            Know your olympiads
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#16324F]/65 sm:text-base">
            VIDYA doesn&apos;t host these olympiads — we help students in Nepal
            discover them, understand eligibility, and know what to prepare for.
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative mt-10 flex flex-col items-center gap-1.5 text-[#16324F]/45"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.25em]">
              Scroll
            </span>
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="size-4" />
            </motion.span>
          </motion.div>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="relative px-6 pb-28">
        {loading ? (
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-[#16324F]/10 bg-[#16324F]/5"
              />
            ))}
          </div>
        ) : olympiads.length === 0 ? (
          <p className="text-center text-sm text-[#16324F]/55">
            Olympiads will appear here once they&apos;re added in the admin panel.
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {olympiads.map((o, i) => (
              <OlympiadCard
                key={o.slug}
                olympiad={o}
                index={i}
                onOpen={setOpenSlug}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {openOlympiad && (
          <OlympiadDetail
            olympiad={openOlympiad}
            onClose={() => setOpenSlug(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
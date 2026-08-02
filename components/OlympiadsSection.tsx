"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight, CalendarRange, ChevronDown  } from "lucide-react";

type Olympiad = {
  slug: string;
  name: string;
  subject: string;
  level: string;
  summary: string;
  heldIn: string;
  image?: { src: string; alt: string };
};

const olympiads: Olympiad[] = [
  {
    slug: "imo",
    name: "International Mathematical Olympiad",
    subject: "Mathematics",
    level: "Grades 9–12",
    summary:
      "The oldest and most prestigious math olympiad in the world, open to pre-university students.",
    heldIn: "Held annually, July",
  },
  {
    slug: "ioi",
    name: "International Olympiad in Informatics",
    subject: "Computer Science",
    level: "Grades 9–12",
    summary:
      "A competitive programming olympiad testing algorithmic thinking and problem-solving.",
    heldIn: "Held annually, August",
  },
  {
    slug: "ipho",
    name: "International Physics Olympiad",
    subject: "Physics",
    level: "Grades 10–12",
    summary:
      "Theoretical and experimental physics problems designed to challenge pre-university students.",
    heldIn: "Held annually, July",
  },
  {
    slug: "icho",
    name: "International Chemistry Olympiad",
    subject: "Chemistry",
    level: "Grades 10–12",
    summary:
      "A rigorous chemistry competition combining theory papers with hands-on lab work.",
    heldIn: "Held annually, July",
  },
  {
    slug: "ibo",
    name: "International Biology Olympiad",
    subject: "Biology",
    level: "Grades 10–12",
    summary:
      "Covers cell biology, genetics, and ecology through both written and practical exams.",
    heldIn: "Held annually, July",
  },
  {
    slug: "ejoi",
    name: "European Junior Olympiad in Informatics",
    subject: "Computer Science",
    level: "Grades 7–9",
    summary:
      "An entry point into competitive programming for younger students building early skills.",
    heldIn: "Held annually, June",
  },
];

function OlympiadCard({ olympiad, index }: { olympiad: Olympiad; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/olympiads/${olympiad.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#16324F]/10 bg-[#FBFAF5] shadow-[0_4px_20px_rgba(22,50,79,0.05)] transition-all hover:-translate-y-1 hover:border-[#C9A227]/50 hover:shadow-[0_12px_28px_rgba(22,50,79,0.1)]"
      >
        <div className="relative h-40 w-full overflow-hidden bg-[#16324F]/5">
          {olympiad.image ? (
            <Image
              src={olympiad.image.src}
              alt={olympiad.image.alt}
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
        </div>

        <div className="flex flex-1 flex-col p-6">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#C9A227]">
            {olympiad.level}
          </p>
          <h3 className="mb-2 break-words font-serif text-xl font-bold text-[#16324F]">
            {olympiad.name}
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
      </Link>
    </motion.div>
  );
}

export function OlympiadsSection() {
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
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {olympiads.map((o, i) => (
            <OlympiadCard key={o.slug} olympiad={o} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
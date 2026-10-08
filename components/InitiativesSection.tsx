"use client";

import Image from "next/image";
import { motion } from "motion/react";

type Initiative = {
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
};

const INITIATIVES: Initiative[] = [
  {
    title: "Outreach Campaigns",
    description:
      "VIDYA has been leading outreach campaigns to raise awareness about olympiads and opportunities across Nepal. What began as our first initiative has now grown into a sustained effort, reaching over 9,000 students across 5 provinces in Nepal.",
    imageUrl: "https://i.ibb.co/m5BSVjfN/Outreach-VIDYA.jpg",
    startDate: "May 2025",
  },
  {
    title: "Opportunity Connect Nepal",
    description:
      "VIDYA is building an online community for Nepali students where aspiring learners can connect with international delegates and build a strong network to help them prepare for olympiads, hackathons, and competitive exams.",
    imageUrl: "https://i.ibb.co/FbzXJ0sF/Screenshot-2026-10-08-185002.png",
    startDate: "August 2026",
  },
  {
    title: "Weekly Olympiad Workshops",
    description:
      "VIDYA hosts weekly olympiad workshops featuring international participants and medalists as keynote speakers. These sessions cover a wide range of topics, including international mathematics, physics, chemistry, biology, AI, and astronomy olympiads, among others.",
    imageUrl: "https://i.ibb.co/35Z3rXkc/image-031.jpg",
    startDate: "August 2026",
  },
  {
    title: "VIDYA X JCI Edutech",
    description:
      "In an era shaped by technology and AI, VIDYA has collaborated with JCI Jr. to conduct awareness sessions across Chandragiri Municipality, reaching more than 1,000 students. These sessions provide valuable knowledge about AI, technology, and its practical applications.",
    imageUrl: "https://i.ibb.co/qMhPbBsQ/image-025.jpg",
    startDate: "July 2026",
  },
];

function InitiativeCard({
  initiative,
  index,
}: {
  initiative: Initiative;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#16324F]/10 bg-white/60 backdrop-blur-sm transition-all duration-500 hover:border-[#C9A227]/40 hover:shadow-[0_8px_40px_-12px_rgba(201,162,39,0.15)]"
    >
      {/* Image */}
      <div className="relative h-56 w-full overflow-hidden bg-[#16324F]/5 sm:h-64">
        <div className="absolute inset-0 z-0 scale-110 overflow-hidden">
          <Image
            src={initiative.imageUrl}
            alt=""
            fill
            className="object-cover opacity-75 blur-[18px] grayscale-[0.1] contrast-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
          <Image
            src={initiative.imageUrl}
            alt={initiative.title}
            fill
            className="object-contain transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#16324F]/30 via-transparent to-transparent" />

        {/* Start date badge */}
        <div className="absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-white/20 bg-[#16324F]/70 px-3 py-1.5 backdrop-blur-md">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <rect
              x="1"
              y="3"
              width="14"
              height="12"
              rx="2"
              stroke="#C9A227"
              strokeWidth="1.5"
            />
            <path d="M1 7h14" stroke="#C9A227" strokeWidth="1.5" />
            <path
              d="M5 1v4M11 1v4"
              stroke="#C9A227"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {initiative.startDate}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 py-6">
        {/* Initiative number */}
        <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C9A227]">
          Initiative {String(index + 1).padStart(2, "0")}
        </span>

        <h3 className="mb-3 font-serif text-xl font-bold leading-snug text-[#16324F] transition-colors duration-300 group-hover:text-[#1D3F63] sm:text-2xl">
          {initiative.title}
        </h3>

        <p className="flex-1 text-sm leading-relaxed text-[#16324F]/65 sm:text-[15px]">
          {initiative.description}
        </p>

        {/* Decorative bottom accent */}
        <div className="mt-5 h-px w-full overflow-hidden bg-[#16324F]/8">
          <motion.div
            className="h-full bg-gradient-to-r from-[#C9A227] to-[#C9A227]/40"
            initial={{ x: "-100%" }}
            whileInView={{ x: "0%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3 + index * 0.15 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function InitiativesSection() {
  return (
    <section className="relative bg-[#ddddd6] px-6 py-20 sm:py-28" id="initiatives">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #16324F 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mb-16 max-w-2xl text-center sm:mb-20"
      >
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
          What We Do
        </p>
        <h2 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
          Our Initiatives
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#16324F]/55 sm:text-base">
          Empowering Nepali students through outreach, community building, and
          world-class olympiad preparation.
        </p>

        {/* Decorative flourish */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-6 h-px w-24 origin-center bg-gradient-to-r from-transparent via-[#C9A227]/60 to-transparent"
        />
      </motion.div>

      {/* Initiative cards grid */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-10">
        {INITIATIVES.map((initiative, i) => (
          <InitiativeCard key={initiative.title} initiative={initiative} index={i} />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";

type Milestone = {
  year: string;
  title: string;
  summary: string;
  image?: { src: string; alt: string };
};

const milestones: Milestone[] = [
  {
    year: "2023",
    title: "VIDYA is founded",
    summary: "Started with one belief — students learn best when taught to think, not memorize.",
  },
  {
    year: "2023",
    title: "First cohort enrolled",
    summary: "A small pilot group tested the curriculum that would shape everything after.",
  },
  {
    year: "2024",
    title: "First Olympiad hosted",
    summary: "Students got a real stage to put what they'd learned to the test.",
  },
  {
    year: "2025",
    title: "Resource library opens",
    summary: "Study guides and past papers became free for every enrolled student.",
  },
  {
    year: "Today",
    title: "Growing every year",
    summary: "More students, more subjects, more olympiads — same mission, bigger reach.",
  },
];

function Medallion({ label, isLast }: { label: string; isLast: boolean }) {
  return (
    <div
      className={`relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border-2 bg-[#ddddd6] text-xs font-semibold tracking-wide sm:size-16 sm:text-sm ${
        isLast ? "border-[#C9A227] text-[#C9A227]" : "border-[#16324F] text-[#16324F]"
      }`}
    >
      {isLast && (
        <span className="absolute inset-0 rounded-full bg-[#C9A227]/15 animate-ping motion-reduce:animate-none" />
      )}
      <span className="relative">{label}</span>
    </div>
  );
}

function MilestonePhoto({ image, isRight }: { image?: Milestone["image"]; isRight: boolean }) {
  return (
    <div
      className={`mb-3 h-36 w-full max-w-[220px] overflow-hidden rounded-lg border border-[#C9A227]/40 bg-[#16324F]/5 sm:mb-4 ${
        isRight ? "sm:ml-auto" : "sm:mr-auto"
      }`}
    >
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={220}
          height={144}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] uppercase tracking-widest text-[#16324F]/35">
          Photo
        </div>
      )}
    </div>
  );
}

export function AboutTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.6"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="relative bg-[#ddddd6] px-6 py-6 " id="about">
      <div className="mx-auto mb-20 max-w-2xl text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
          Our Story
        </p>
        <h2 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
          How VIDYA came to be
        </h2>
      </div>

      <div ref={containerRef} className="relative mx-auto max-w-3xl">
        <div className="absolute left-7 top-0 h-full w-px bg-[#16324F]/12 sm:left-1/2 sm:-translate-x-1/2" />
        <motion.div
          className="absolute left-7 top-0 w-px origin-top bg-[#C9A227] sm:left-1/2 sm:-translate-x-1/2"
          style={{ height: lineHeight }}
        />

        <ol className="flex flex-col gap-16 sm:gap-20">
          {milestones.map((milestone, i) => {
            const isRight = i % 2 === 1;
            const isLast = i === milestones.length - 1;

            return (
              <motion.li
                key={`${milestone.year}-${milestone.title}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative grid w-full grid-cols-[56px_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] sm:gap-8"
              >
                <div className="col-start-1 row-start-1 sm:col-start-2 sm:justify-self-center">
                  <Medallion label={isLast ? "Now" : milestone.year} isLast={isLast} />
                </div>

                <div
                  className={`col-start-2 row-start-1 min-w-0 pt-1.5 ${
                    isRight
                      ? "sm:col-start-3 sm:text-left"
                      : "sm:col-start-1 sm:row-start-1 sm:text-right"
                  }`}
                >
                  <MilestonePhoto image={milestone.image} isRight={isRight} />
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[#16324F]/50">
                    {milestone.year}
                  </p>
                  <h3 className="mb-2 break-words font-serif text-xl font-bold text-[#16324F] sm:text-2xl">
                    {milestone.title}
                  </h3>
                  <p className="break-words text-sm leading-relaxed text-[#16324F]/70 sm:text-base">
                    {milestone.summary}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
"use client";

import Image from "next/image";
import { motion } from "motion/react";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image?: { src: string; alt: string };
};

const founders: TeamMember[] = [
  {
    name: "Founder Name",
    role: "Founder & Director",
    bio: "One or two lines on their background and why they started VIDYA.",
  },
  {
    name: "Founder Name",
    role: "Co-Founder, Academics",
    bio: "One or two lines on their background and what they lead.",
  },
  {
    name: "Founder Name",
    role: "Co-Founder, Operations",
    bio: "One or two lines on their background and what they lead.",
  },
];

function TeamPhoto({ image, alt }: { image?: TeamMember["image"]; alt: string }) {
  return (
    <div className="relative mx-auto mb-5 size-32 overflow-hidden rounded-full border-2 border-[#C9A227]/50 bg-[#16324F]/5 sm:size-36">
      {image ? (
        <Image src={image.src} alt={image.alt} fill className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] uppercase tracking-widest text-[#16324F]/35">
          {alt}
        </div>
      )}
    </div>
  );
}

export function TeamSection() {
  return (
    <section className="relative bg-[#ddddd6] px-6 py-28 sm:py-36" id="team">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-16 max-w-2xl text-center"
      >
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
          Know Your Team
        </p>
        <h2 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
          The people behind VIDYA
        </h2>
      </motion.div>

      <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-3 sm:gap-8">
        {founders.map((member, i) => (
          <motion.div
            key={member.name + i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <TeamPhoto image={member.image} alt="Photo" />
            <h3 className="mb-1 font-serif text-lg font-bold text-[#16324F]">
              {member.name}
            </h3>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
              {member.role}
            </p>
            <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-[#16324F]/70">
              {member.bio}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
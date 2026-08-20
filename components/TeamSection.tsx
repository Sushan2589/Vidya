"use client";

import Image from "next/image";
import { motion } from "motion/react";

type TeamMember = {
  name: string;
  role: string;
  
  image?: { src: string; alt: string };
};

const founders: TeamMember[] = [
  {
    name: "Shubham Shrestha",
    role: "President",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/1.png?raw=true", alt: "Shubham Shrestha" }
  },
  {
    name: "Sulav Poudel",
    role: "Vice President",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/2.png?raw=true", alt: "Sulav Poudel" }
  },

  {
    name: "Aayush Marasini",
    role: "Advisor",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/4.png?raw=true", alt: "Aayush Marasini" }
  },
  {
    name: "Suhit Dhungana",
    role: "Secretary",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/5.png?raw=true", alt: "Suhit Dhungana" }
  },
  {
    name: "Prasiddha Thapa",
    role: "Treasurer",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/6.png?raw=true", alt: "Prasiddha Thapa" }
  },
  {
    name: "Saugat Kharel",
    role: "Spokesperson",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/7.png?raw=true", alt: "Saugat Kharel" }
  },
  {
    name: "Sangam Mudbhari",
    role: "IT Head",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/8.png?raw=true", alt: "Sangam Mudbhari" }
  },
  {
    name: "Piyush Pradhan",
    role: "Public Relation Officer",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/9.png?raw=true", alt: "Piyush Pradhan" }
  },
  {
    name: "Tushar Chimariya",
    role: "Human Resource Manager",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/10.png?raw=true", alt: "Tushar Chimariya" }
  },
  {
    name: "Prakrish Acharya",
    role: "Human Resource Manager",
    image: { src: "https://github.com/Sulav-Poudel/VIDYA-IMG/blob/main/3.png?raw=true", alt: "Prakrish Acharya" }
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
        className="mx-auto mb-20 max-w-2xl text-center"
      >
        <p className="text-base leading-relaxed text-[#16324F]/70 sm:text-lg">
          VIDYA is a youth-led nonprofit making academic
          opportunities and Olympiads accessible to students across Nepal — through outreach,
          mentorship, and a growing volunteer network.
        </p>
        <div className="mx-auto my-5 h-px w-16 bg-[#C9A227]/50" />
        <p className="font-serif text-xl italic text-[#16324F] sm:text-2xl">
          Vidya works to build a Nepal where every student has the confidence to explore,
          challenge themselves, and grow.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-16 max-w-2xl text-center"
      >
        
        <h2 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
          Founding Team
        </h2>
      </motion.div>

      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-1 gap-y-8">
  {founders.map((member, i) => (
    <motion.div
      key={member.name + i}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="w-full text-center sm:w-[calc(33.333%-1.5rem)]"
    >
      <TeamPhoto image={member.image} alt="Photo" />
      <h3 className="mb-1 font-serif text-lg font-bold text-[#16324F]">
        {member.name}
      </h3>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
        {member.role}
      </p>
    </motion.div>
  ))}
</div>

{/* <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
          Know Your Team
        </p>  */}

            <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-24 max-w-md text-center"
      >
        <h2 className="mb-6 font-serif text-4xl text-[#16324F] sm:text-5xl">
          Current Team
        </h2>
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#C9A227]/40 bg-[#16324F]/5 px-8 py-12">
          <span className="text-4xl">🔨</span>
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
            Under Construction
          </span>
          <p className="font-serif text-lg text-[#16324F]/70">
            This section is being built. Check back soon.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
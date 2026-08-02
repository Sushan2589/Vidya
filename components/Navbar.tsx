"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Olympiads", href: "/olympiads" },
  { name: "Resources", href: "/resources" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.8}}
      className="fixed inset-x-0 top-5 z-50 flex justify-center px-4 sm:top-6"
    >
      <nav
        className={cn(
          "flex w-full max-w-3xl items-center justify-between gap-4 rounded-full",
          "border border-[#16324F]/12 bg-[#FBFAF5]/75 px-4 py-2.5 sm:px-6 sm:py-3",
          "shadow-[0_8px_32px_rgba(22,50,79,0.12)] backdrop-blur-xl backdrop-saturate-150"
        )}
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="font-serif text-lg tracking-[0.15em] text-[#16324F] transition-colors hover:text-[#C9A227]"
        >
          VIDYA
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-[#16324F]/65 transition-colors hover:bg-[#16324F]/[0.06] hover:text-[#16324F]"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="w-[52px] md:hidden" aria-hidden />
      </nav>
    </motion.header>
  );
}
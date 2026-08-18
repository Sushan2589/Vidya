"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Image from 'next/image';
import Vidya from "../public/assests/VIDYA.svg"

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Olympiads", href: "/olympiads" },
  { name: "Resources", href: "/resources" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
   const [open, setOpen] = useState(false);
  return (
   <motion.header
  initial={{ y: -80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
  className="fixed inset-x-0 top-5 z-50 flex flex-col items-center px-4 sm:top-6"
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
           onClick={() => setOpen(false)}
          className="font-serif text-lg tracking-[0.15em] text-[#16324F] transition-colors hover:text-[#C9A227]"
        >
          <Image src={Vidya} alt="Vidya logo" width={50} height={50} />
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-full text-[#16324F] transition-colors hover:bg-[#16324F]/[0.06] md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
    <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "mt-2 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl",
              "border border-[#16324F]/12 bg-[#FBFAF5]/95 p-2",
              "shadow-[0_8px_32px_rgba(22,50,79,0.12)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
            )}
          >
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm text-[#16324F]/70 transition-colors hover:bg-[#16324F]/[0.06] hover:text-[#16324F]"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
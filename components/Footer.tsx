"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Mail, MapPin } from "lucide-react";
import { FaInstagram, FaFacebookF, FaLinkedinIn } from "react-icons/fa";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Events", href: "/olympiads" },
  { name: "Resources", href: "/resources" },
  { name: "Contact", href: "/contact" },
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/visionaryinitiativenepal/",
    icon: FaInstagram,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61575748772295",
    icon: FaFacebookF,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/vidyanepal/",
    icon: FaLinkedinIn,
  },
];

const contactDetails = [
  {
    icon: Mail,
    value: "visionaryinitiativenepal@gmail.com",
    href: "mailto:visionaryinitiativenepal@gmail.com",
  },

  { icon: MapPin, value: "Kathmandu, Nepal", href: undefined },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#16324F]">
      {/* Faint concentric ring echo, bookending the hero's seal motif */}
      <svg
        className="pointer-events-none absolute -bottom-24 -right-24 opacity-[0.06]"
        width="360"
        height="360"
        viewBox="0 0 360 360"
        fill="none"
        aria-hidden
      >
        <circle cx="180" cy="180" r="170" stroke="#F3F1EA" strokeWidth="1" />
        <circle cx="180" cy="180" r="140" stroke="#C9A227" strokeWidth="1" />
      </svg>

      <div className="relative mx-auto max-w-5xl px-6 pb-10 pt-16 sm:pt-20">
        <div className="grid gap-12 sm:grid-cols-[1.3fr_1fr_1fr]">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/"
              className="font-serif text-2xl tracking-[0.12em] text-[#F3F1EA] transition-colors hover:text-[#C9A227]"
            >
              VIDYA
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#F3F1EA]/55">
              Visionary Initiatives for Developing Youth Academics — helping
              students in Nepal discover and prepare for academic olympiads.
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.25em] text-[#C9A227]">
              Thinkers over Memorizers
            </p>
          </motion.div>

          {/* Nav column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.5,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-[#F3F1EA]/40">
              Navigate
            </p>
            <ul className="flex flex-col gap-2.5">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#F3F1EA]/65 transition-colors hover:text-[#C9A227]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.5,
              delay: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-[#F3F1EA]/40">
              Contact
            </p>
            <ul className="flex flex-col gap-2.5">
              {contactDetails.map((detail) => {
                const Icon = detail.icon;
                const inner = (
                  <span className="flex items-center gap-2 text-sm text-[#F3F1EA]/65 transition-colors hover:text-[#C9A227]">
                    <Icon className="size-3.5 text-[#C9A227]" />
                    {detail.value}
                  </span>
                );
                return (
                  <li key={detail.value}>
                    {detail.href ? <a href={detail.href}>{inner}</a> : inner}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#F3F1EA]/40">
                Follow us
              </p>

              <div className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      className="flex size-9 items-center justify-center rounded-full border border-[#F3F1EA]/15 text-[#F3F1EA]/60 transition-all hover:border-[#C9A227] hover:bg-[#C9A227]/10 hover:text-[#C9A227]"
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom line */}
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-[#F3F1EA]/10 pt-6 text-xs text-[#F3F1EA]/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} VIDYA. All rights reserved.</p>
          <p>Made with care in Kathmandu, Nepal</p>
        </div>
      </div>
    </footer>
  );
}

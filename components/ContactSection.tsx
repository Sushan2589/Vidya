"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

const contactDetails = [
  { icon: Mail, value: "hello@vidya.org.np", href: "mailto:hello@vidya.org.np" },
  { icon: Phone, value: "+977 1-4XXXXXX", href: "tel:+97714000000" },
  { icon: MapPin, value: "Kathmandu, Nepal", href: undefined },
];

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <section className="relative overflow-hidden bg-[#ddddd6]">
      {/* Header */}
      <div className="relative px-6 pb-10 pt-36 sm:pt-44">
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
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-[#C9A227]">
            Contact
          </p>
          <h1 className="font-serif text-4xl text-[#16324F] sm:text-5xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#16324F]/65">
            Questions about an olympiad, a partnership, or just want to say hello.
          </p>
        </motion.div>

        {/* Inline contact details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {contactDetails.map((detail) => {
            const Icon = detail.icon;
            const inner = (
              <span className="flex items-center gap-2 text-sm text-[#16324F]/75 transition-colors hover:text-[#16324F]">
                <Icon className="size-4 text-[#C9A227]" />
                {detail.value}
              </span>
            );
            return detail.href ? (
              <a key={detail.value} href={detail.href}>
                {inner}
              </a>
            ) : (
              <span key={detail.value}>{inner}</span>
            );
          })}
        </motion.div>
      </div>

      {/* Form */}
      <div className="relative px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl rounded-2xl border border-[#16324F]/10 bg-[#FBFAF5] p-6 shadow-[0_4px_20px_rgba(22,50,79,0.05)] sm:p-8"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <CheckCircle2 className="mb-3 size-9 text-[#C9A227]" />
              <h3 className="mb-1.5 font-serif text-lg font-bold text-[#16324F]">
                Message sent
              </h3>
              <p className="text-sm text-[#16324F]/65">
                Thanks for reaching out — we&apos;ll get back to you soon.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label
        htmlFor="name"
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-[#16324F]/60"
      >
        Name
      </label>
      <input
        id="name"
        type="text"
        required
        placeholder="Your name"
        className="w-full rounded-lg border border-[#16324F]/15 bg-[#ddddd6]/40 px-4 py-2.5 text-sm text-[#16324F] outline-none transition-colors placeholder:text-[#16324F]/35 focus:border-[#C9A227]"
      />
    </div>
    <div>
      <label
        htmlFor="email"
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-[#16324F]/60"
      >
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        placeholder="you@example.com"
        className="w-full rounded-lg border border-[#16324F]/15 bg-[#ddddd6]/40 px-4 py-2.5 text-sm text-[#16324F] outline-none transition-colors placeholder:text-[#16324F]/35 focus:border-[#C9A227]"
      />
    </div>
    <div>
      <label
        htmlFor="reason"
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-[#16324F]/60"
      >
        I am a
      </label>
      <select
        id="reason"
        className="w-full rounded-lg border border-[#16324F]/15 bg-[#ddddd6]/40 px-4 py-2.5 text-sm text-[#16324F] outline-none transition-colors focus:border-[#C9A227]"
      >
        <option>Student</option>
        <option>Parent</option>
        <option>School</option>
        <option>Other</option>
      </select>
    </div>
    <div>
      <label
        htmlFor="message"
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-[#16324F]/60"
      >
        Message
      </label>
      <input
        id="message"
        type="text"
        required
        placeholder="How can we help?"
        className="w-full rounded-lg border border-[#16324F]/15 bg-[#ddddd6]/40 px-4 py-2.5 text-sm text-[#16324F] outline-none transition-colors placeholder:text-[#16324F]/35 focus:border-[#C9A227]"
      />
    </div>
  </div>

  <button
    type="submit"
    disabled={loading}
    className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#16324F] px-6 py-2.5 text-sm font-medium tracking-wide text-[#F3F1EA] transition-colors hover:bg-[#1D3F63] disabled:opacity-60"
  >
    {loading ? "Sending..." : "Send message"}
    {!loading && <Send className="size-4" />}
  </button>
</form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
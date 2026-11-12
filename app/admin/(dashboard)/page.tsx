import Link from "next/link";
import db from "@/lib/db";
import { getSiteStats } from "@/lib/db/stats";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function countOf(table: string) {
  try {
    const result = await db.execute(`SELECT COUNT(*) AS count FROM ${table}`);
    const row = result.rows[0];
    return Number(row?.count ?? row?.[0] ?? 0);
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const [eventsCount, resourcesCount, timelineCount, noticesCount, blogCount, stats] =
    await Promise.all([
      countOf("events"),
      countOf("resources"),
      countOf("timeline_items"),
      countOf("notices"),
      countOf("blog_posts"),
      getSiteStats(),
    ]);

  const cards = [
    { label: "Events", count: eventsCount, href: "/admin/events" },
    { label: "Resources", count: resourcesCount, href: "/admin/resources" },
    { label: "Timeline items", count: timelineCount, href: "/admin/timeline" },
    { label: "Notices & Popups", count: noticesCount, href: "/admin/notices" },
    { label: "Blog Articles", count: blogCount, href: "/admin/blog" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        A quick look at what&apos;s live on the site.
      </p>

      {/* Hero Numbers Spotlight Card */}
      <div className="mt-8 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A227]">
              Hero Highlights
            </span>
            <h2 className="font-serif text-xl font-medium text-[#16324F]">
              Site Numbers
            </h2>
          </div>
          <Link
            href="/admin/stats"
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#16324F] px-3.5 py-1.5 text-xs font-medium text-[#F3F1EA] transition-colors hover:bg-[#16324F]/90 sm:self-auto"
          >
            <span>Change Numbers</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#16324F]/10 bg-white/60 p-4 text-center">
            <p className="font-serif text-2xl font-medium text-[#16324F] sm:text-3xl">
              {stats.studentsGuided.toLocaleString()}+
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#16324F]/50">
              Students Guided
            </p>
          </div>

          <div className="rounded-xl border border-[#16324F]/10 bg-white/60 p-4 text-center">
            <p className="font-serif text-2xl font-medium text-[#16324F] sm:text-3xl">
              {stats.provincesReached}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#16324F]/50">
              Provinces Reached
            </p>
          </div>

          <div className="rounded-xl border border-[#16324F]/10 bg-white/60 p-4 text-center">
            <p className="font-serif text-2xl font-medium text-[#16324F] sm:text-3xl">
              {stats.volunteers.toLocaleString()}+
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#16324F]/50">
              Volunteers
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6 transition-colors hover:border-[#C9A227]/50"
          >
            <p className="text-4xl font-medium text-[#16324F]">{card.count}</p>
            <p className="mt-1 text-sm font-medium uppercase tracking-wide text-[#16324F]/55">
              {card.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

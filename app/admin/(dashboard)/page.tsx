import Link from "next/link";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

async function countOf(table: string) {
  const result = await db.execute(`SELECT COUNT(*) AS count FROM ${table}`);
  const row = result.rows[0];
  return Number(row?.count ?? 0);
}

export default async function DashboardPage() {
  const [eventsCount, resourcesCount, timelineCount] = await Promise.all([
    countOf("events"),
    countOf("resources"),
    countOf("timeline_items"),
  ]);

  const cards = [
    { label: "Events", count: eventsCount, href: "/admin/events" },
    { label: "Resources", count: resourcesCount, href: "/admin/resources" },
    { label: "Timeline items", count: timelineCount, href: "/admin/timeline" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        A quick look at what&apos;s live on the site.
      </p>

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
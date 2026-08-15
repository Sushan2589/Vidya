"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/timeline", label: "Timeline" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh bg-[#ddddd6]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#16324F]/10 bg-[#F3F1EA] px-4 py-6">
        <div className="mb-8 px-2">
          <p className="font-serif text-xl font-medium text-[#16324F]">
            VIDYA
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#16324F]/50">
            Admin
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#16324F] text-[#F3F1EA]"
                    : "text-[#16324F]/70 hover:bg-[#16324F]/8"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#16324F]/60 transition-colors hover:bg-[#16324F]/8 hover:text-[#16324F]"
        >
          Sign out
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}

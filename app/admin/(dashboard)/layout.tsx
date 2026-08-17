"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const activeLabel =
    NAV_ITEMS.find((item) => isActive(item.href))?.label ?? "Dashboard";

  return (
    <div className="flex min-h-svh flex-col bg-[#ddddd6] md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[#16324F]/10 bg-[#F3F1EA] px-4 py-3 md:hidden">
        <div>
          <p className="font-serif text-lg font-medium text-[#16324F]">VIDYA</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#16324F]/50">
            Admin
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="rounded-lg p-2 text-[#16324F]/70 hover:bg-[#16324F]/8 hover:text-[#16324F]"
          >
            <LogOut className="size-5" />
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-[#16324F] hover:bg-[#16324F]/8"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="border-b border-[#16324F]/10 bg-[#F3F1EA] px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#16324F] text-[#F3F1EA]"
                    : "text-[#16324F]/70 hover:bg-[#16324F]/8"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop sidebar — nav only, no sign out here anymore */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[#16324F]/10 bg-[#F3F1EA] px-4 py-6 md:flex">
        <div className="mb-8 px-2">
          <p className="font-serif text-xl font-medium text-[#16324F]">VIDYA</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#16324F]/50">
            Admin
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-[#16324F] text-[#F3F1EA]"
                  : "text-[#16324F]/70 hover:bg-[#16324F]/8"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop top bar — always visible, holds sign out top-right */}
        <div className="hidden items-center justify-between border-b border-[#16324F]/10 bg-[#F3F1EA] px-8 py-4 md:flex">
          <p className="text-sm font-medium text-[#16324F]/70">{activeLabel}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#16324F]/60 transition-colors hover:bg-[#16324F]/8 hover:text-[#16324F]"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
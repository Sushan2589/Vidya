"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, ExternalLink, Bell, ChevronRight, ChevronLeft } from "lucide-react";

type NoticeType = "popup_image" | "popup_text" | "popup_combo" | "banner_text";
type DesignStyle = "gold" | "navy" | "crimson" | "dark" | "minimal";
type DisplayLocation = "popup" | "banner";
type ImageFit = "contain" | "cover";

interface Notice {
  id: number;
  title: string;
  noticeType: NoticeType;
  imageUrl: string | null;
  imageFit: ImageFit;
  tag: string;
  heading: string | null;
  description: string | null;
  designStyle: DesignStyle;
  buttonText: string | null;
  buttonUrl: string | null;
  displayLocation: DisplayLocation;
  isActive: boolean;
  createdAt: number;
}

const STYLE_THEMES: Record<
  DesignStyle,
  {
    cardBg: string;
    textColor: string;
    accentColor: string;
    border: string;
    tagBg: string;
    tagText: string;
    btnClass: string;
    closeBtn: string;
  }
> = {
  gold: {
    cardBg: "bg-neutral-950/95 backdrop-blur-xl",
    textColor: "text-amber-100/90",
    accentColor: "text-[#C9A227]",
    border: "border-[#C9A227]/40 ring-1 ring-[#C9A227]/30 shadow-[0_12px_40px_rgba(201,162,39,0.22)]",
    tagBg: "bg-[#C9A227]/20 border border-[#C9A227]/40",
    tagText: "text-[#C9A227]",
    btnClass: "bg-[#C9A227] hover:bg-[#d4ad2d] text-neutral-950 font-bold shadow-md shadow-[#C9A227]/30",
    closeBtn: "text-amber-200/60 hover:text-white hover:bg-white/10",
  },
  navy: {
    cardBg: "bg-[#16324F]/95 backdrop-blur-xl",
    textColor: "text-[#F3F1EA]/90",
    accentColor: "text-[#F3F1EA]",
    border: "border-[#F3F1EA]/30 ring-1 ring-[#F3F1EA]/20 shadow-[0_12px_40px_rgba(22,50,79,0.35)]",
    tagBg: "bg-[#F3F1EA]/20 border border-[#F3F1EA]/30",
    tagText: "text-[#F3F1EA]",
    btnClass: "bg-[#F3F1EA] hover:bg-white text-[#16324F] font-bold shadow-md",
    closeBtn: "text-[#F3F1EA]/60 hover:text-white hover:bg-white/10",
  },
  crimson: {
    cardBg: "bg-[#2d070f]/95 backdrop-blur-xl",
    textColor: "text-rose-100/90",
    accentColor: "text-rose-300",
    border: "border-rose-500/50 ring-1 ring-rose-500/30 shadow-[0_12px_40px_rgba(225,29,72,0.3)]",
    tagBg: "bg-rose-500/20 border border-rose-500/40",
    tagText: "text-rose-300",
    btnClass: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-950/60",
    closeBtn: "text-rose-200/60 hover:text-white hover:bg-white/10",
  },
  dark: {
    cardBg: "bg-neutral-950/95 backdrop-blur-xl",
    textColor: "text-neutral-300",
    accentColor: "text-white",
    border: "border-neutral-700/80 ring-1 ring-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]",
    tagBg: "bg-neutral-800 border border-neutral-700",
    tagText: "text-neutral-200",
    btnClass: "bg-white hover:bg-neutral-200 text-neutral-950 font-bold shadow-md",
    closeBtn: "text-neutral-400 hover:text-white hover:bg-white/10",
  },
  minimal: {
    cardBg: "bg-[#F3F1EA]/95 backdrop-blur-xl",
    textColor: "text-[#16324F]/85",
    accentColor: "text-[#16324F]",
    border: "border-[#16324F]/30 ring-1 ring-[#16324F]/10 shadow-[0_12px_40px_rgba(22,50,79,0.2)]",
    tagBg: "bg-[#16324F]/10 border border-[#16324F]/20",
    tagText: "text-[#16324F]",
    btnClass: "bg-[#16324F] hover:bg-[#1f4268] text-[#F3F1EA] font-bold shadow-md",
    closeBtn: "text-[#16324F]/50 hover:text-[#16324F] hover:bg-[#16324F]/10",
  },
};

export default function NoticePopup() {
  const pathname = usePathname();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissedFlyerIds, setDismissedFlyerIds] = useState<Set<number>>(new Set());
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<number>>(new Set());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Exclude admin pages
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) return;

    async function loadNotices() {
      try {
        const res = await fetch("/api/notices");
        if (res.ok) {
          const data: Notice[] = await res.json();
          setNotices(data);
        }
      } catch (err) {
        console.error("Failed to load notices:", err);
      }
    }

    loadNotices();
  }, [isAdminRoute]);

  // Read dismissed items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vidya_dismissed_notices");
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const validFlyerIds = new Set<number>();
        const validToastIds = new Set<number>();

        for (const [idStr, expiry] of Object.entries(parsed)) {
          if (typeof expiry === "number" && expiry > now) {
            validFlyerIds.add(Number(idStr));
            validToastIds.add(Number(idStr));
          }
        }
        setDismissedFlyerIds(validFlyerIds);
        setDismissedToastIds(validToastIds);
      }
    } catch {
      // ignore
    }
  }, []);

  // 1. FLYERS (Modal Popups with Posters / Images)
  // These are notices that are image-based and set to popup.
  const activeFlyers = notices.filter(
    (n) =>
      (n.noticeType === "popup_image" || (n.noticeType === "popup_combo" && Boolean(n.imageUrl))) &&
      n.displayLocation === "popup" &&
      !dismissedFlyerIds.has(n.id)
  );

  // The current active flyer is ALWAYS index 0 of the remaining active flyers.
  // When flyer 1 is crossed, it gets removed, and flyer 2 immediately takes its place!
  const currentFlyer = activeFlyers[0] || null;

  // 2. TEXT NOTICES (Top-Right Small Floating Card that comes down without hiding anything)
  // Text announcements, alert notices, or banners that don't block the screen.
  const activeToasts = notices.filter(
    (n) =>
      (n.noticeType === "popup_text" ||
        n.noticeType === "banner_text" ||
        n.displayLocation === "banner" ||
        (!n.imageUrl && n.noticeType !== "popup_image")) &&
      !dismissedToastIds.has(n.id)
  );

  // Hide navbar ONLY when a full flyer modal is open
  useEffect(() => {
    if (currentFlyer && !isAdminRoute) {
      document.body.style.overflow = "hidden";
      const headers = document.querySelectorAll("header");
      headers.forEach((h) => {
        (h as HTMLElement).style.display = "none";
      });

      return () => {
        document.body.style.overflow = "";
        headers.forEach((h) => {
          (h as HTMLElement).style.display = "";
        });
      };
    }
  }, [currentFlyer, isAdminRoute]);

  // Dismiss a flyer: removes it from the queue so the NEXT flyer immediately displays!
  const handleDismissFlyer = useCallback(
    (id: number) => {
      if (dontShowAgain) {
        try {
          const stored = localStorage.getItem("vidya_dismissed_notices");
          const parsed = stored ? JSON.parse(stored) : {};
          parsed[id] = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem("vidya_dismissed_notices", JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }

      // Add to dismissed set: activeFlyers[0] is now replaced by the next flyer!
      setDismissedFlyerIds((prev) => new Set([...prev, id]));
    },
    [dontShowAgain]
  );

  // Dismiss a top-right notice toast
  const handleDismissToast = useCallback((id: number) => {
    setDismissedToastIds((prev) => new Set([...prev, id]));
  }, []);

  if (isAdminRoute || notices.length === 0) {
    return null;
  }

  return (
    <>
      {/* 1. FLYER POPUP MODAL (When there are active flyers) */}
      {/* If there are multiple flyers, crossing one immediately reveals the next one! */}
      {currentFlyer && (
        <div
          onClick={(e) => {
            // Dismiss if clicking backdrop
            if (e.target === e.currentTarget) {
              handleDismissFlyer(currentFlyer.id);
            }
          }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Main flyer container hugging image aspect ratio */}
          <div className="relative flex flex-col items-center max-w-[95vw] max-h-[94vh]">
            {/* Close button placed floating outside the top right of flyer */}
            <button
              onClick={() => handleDismissFlyer(currentFlyer.id)}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-50 flex size-9 sm:size-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-2xl ring-2 ring-black/20 hover:bg-neutral-100 hover:scale-110 active:scale-95 transition-all"
              aria-label="Close notice"
            >
              <X className="size-5 stroke-[2.5]" />
            </button>

            {/* Queue Counter badge when more than 1 flyer exists */}
            {activeFlyers.length > 1 && (
              <div className="absolute top-2 left-2 z-40 flex items-center gap-1.5 rounded-full bg-black/80 border border-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-lg">
                <span>
                  Flyer 1 of {activeFlyers.length}
                </span>
                <span className="text-neutral-400 text-[10px]">
                  (Next flyer opens on close)
                </span>
              </div>
            )}

            {/* Flyer Body */}
            <div className="overflow-y-auto max-h-[calc(94vh-48px)] flex flex-col items-center">
              {renderFlyerCard(currentFlyer)}
            </div>

            {/* Bottom Controls: "Don't show again today" & Dismiss */}
            <div className="mt-2.5 flex items-center justify-between gap-6 px-3.5 py-1 rounded-full bg-neutral-950/75 border border-white/10 text-xs backdrop-blur-md select-none text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-neutral-600 bg-neutral-900 text-[#C9A227] focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Don&apos;t show again today</span>
              </label>

              <button
                onClick={() => handleDismissFlyer(currentFlyer.id)}
                className="text-[11px] font-medium text-neutral-400 hover:text-white transition"
              >
                {activeFlyers.length > 1 ? "Next Flyer ❯" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP-RIGHT NOTICE CARDS (Notice part that comes down in top right without hiding anything) */}
      {/* Does NOT block the screen, does NOT hide navbar, allows user to browse freely! */}
      {activeToasts.length > 0 && (
        <div className="fixed top-20 sm:top-24 right-3 sm:right-6 z-[9990] flex flex-col gap-3 max-w-[calc(100vw-1.5rem)] sm:max-w-md pointer-events-auto">
          {activeToasts.map((notice, idx) => {
            const theme = STYLE_THEMES[notice.designStyle] || STYLE_THEMES.gold;
            const targetUrl = notice.buttonUrl?.trim();

            return (
              <div
                key={notice.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className={`relative w-full rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-2xl animate-in slide-in-from-top-6 fade-in duration-300 transition-all ${theme.cardBg} ${theme.border}`}
              >
                {/* Header row with Tag, Icon, and Close button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
                    >
                      <Bell className="size-3" />
                      {notice.tag || "Notice"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDismissToast(notice.id)}
                    className={`rounded-lg p-1 text-xs transition ${theme.closeBtn}`}
                    aria-label="Dismiss notice"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Notice Heading */}
                <h4
                  className={`mt-2.5 font-serif text-base sm:text-lg font-bold leading-snug ${theme.accentColor}`}
                >
                  {notice.heading || notice.title}
                </h4>

                {/* Description */}
                {notice.description && (
                  <p
                    className={`mt-1.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed line-clamp-4 ${theme.textColor}`}
                  >
                    {notice.description}
                  </p>
                )}

                {/* CTA Action link / button */}
                {targetUrl && (
                  <div className="mt-3.5 flex items-center justify-end">
                    <a
                      href={targetUrl}
                      target={targetUrl.startsWith("http") ? "_blank" : undefined}
                      rel={targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition ${theme.btnClass}`}
                    >
                      <span>{notice.buttonText || "Open Details"}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// Helper to render the flyer poster in its natural aspect ratio
function renderFlyerCard(notice: Notice) {
  const targetUrl = notice.buttonUrl?.trim();
  const isCover = notice.imageFit === "cover";

  const ImageElement = (
    <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border border-white/15 bg-neutral-950 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={notice.imageUrl || ""}
        alt={notice.title}
        className={`block max-h-[80vh] max-w-[90vw] sm:max-w-[560px] md:max-w-[640px] w-auto h-auto transition-transform duration-300 ${
          targetUrl ? "group-hover:scale-[1.015]" : ""
        } ${isCover ? "object-cover" : "object-contain"}`}
      />

      {/* If there is a click destination URL, show interactive cue */}
      {targetUrl && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-2 opacity-95 transition-opacity">
          <span className="text-xs sm:text-sm font-semibold text-white drop-shadow flex items-center gap-1.5">
            <span>{notice.buttonText || "Click to open registration / website"}</span>
            <ExternalLink className="size-3.5 sm:size-4 shrink-0 text-[#C9A227]" />
          </span>
          <span className="rounded-full bg-[#C9A227] px-3 py-1 text-[11px] font-bold text-neutral-950 shadow-md">
            Visit ↗
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      {targetUrl ? (
        <a
          href={targetUrl}
          target={targetUrl.startsWith("http") ? "_blank" : undefined}
          rel={targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          className="block cursor-pointer focus:outline-none"
          title="Click to visit website"
        >
          {ImageElement}
        </a>
      ) : (
        ImageElement
      )}
    </div>
  );
}

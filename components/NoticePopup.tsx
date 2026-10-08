"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, ExternalLink, Bell } from "lucide-react";

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

  // 1. FLYERS (Modal Popups with Posters / Images)
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
  const handleDismissFlyer = useCallback((id: number) => {
    setDismissedFlyerIds((prev) => new Set([...prev, id]));
  }, []);

  // Dismiss a top-right notice toast
  const handleDismissToast = useCallback((id: number) => {
    setDismissedToastIds((prev) => new Set([...prev, id]));
  }, []);

  if (isAdminRoute || notices.length === 0) {
    return null;
  }

  const targetUrl = currentFlyer?.buttonUrl?.trim();
  const isCover = currentFlyer?.imageFit === "cover";

  return (
    <>
      {/* 1. FLYER POPUP MODAL (Academic / Institutional card with header, close button, and bit blurred background) */}
      {currentFlyer && (
        <div
          onClick={(e) => {
            // Dismiss if clicking the backdrop outside the modal
            if (e.target === e.currentTarget) {
              handleDismissFlyer(currentFlyer.id);
            }
          }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-[4px] animate-in fade-in duration-200"
        >
          {/* Main Modal Card */}
          <div className="relative flex flex-col w-auto max-w-[94vw] max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border-2 border-[#16324F]/60 ring-2 ring-[#C9A227]/30 animate-in zoom-in-95 duration-200">
            {/* Header bar matching user's reference: Title on left, Close ✕ on right */}
            <div className="flex items-center justify-between border-b border-[#16324F]/15 bg-[#16324F] px-4 py-3 sm:px-5">
              <h3 className="truncate pr-3 font-sans text-sm sm:text-base font-semibold text-[#F3F1EA]">
                {currentFlyer.heading || currentFlyer.title}
              </h3>

              <div className="flex items-center gap-2 shrink-0">
                {activeFlyers.length > 1 && (
                  <span className="rounded-full bg-[#C9A227]/20 border border-[#C9A227]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#C9A227]">
                    1 of {activeFlyers.length}
                  </span>
                )}
                <button
                  onClick={() => handleDismissFlyer(currentFlyer.id)}
                  className="rounded-lg p-1 text-[#F3F1EA]/70 hover:bg-white/15 hover:text-white transition"
                  aria-label="Close notice"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Flyer Image Body */}
            <div className="overflow-y-auto max-h-[calc(92vh-54px)] bg-neutral-50 flex flex-col items-center">
              {currentFlyer.imageUrl && (
                targetUrl ? (
                  <a
                    href={targetUrl}
                    target={targetUrl.startsWith("http") ? "_blank" : undefined}
                    rel={targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group relative block cursor-pointer"
                    title="Click to visit website"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentFlyer.imageUrl}
                      alt={currentFlyer.heading || currentFlyer.title}
                      className={`block max-h-[78vh] max-w-[90vw] sm:max-w-[620px] md:max-w-[700px] w-auto h-auto transition-transform duration-200 group-hover:opacity-95 ${
                        isCover ? "object-cover" : "object-contain"
                      }`}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-semibold flex items-center gap-1">
                        <span>{currentFlyer.buttonText || "Open link"}</span>
                        <ExternalLink className="size-3.5 text-[#C9A227]" />
                      </span>
                      <span className="rounded-full bg-[#C9A227] px-2.5 py-0.5 text-[11px] font-bold text-neutral-950">
                        Visit ↗
                      </span>
                    </div>
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentFlyer.imageUrl}
                    alt={currentFlyer.heading || currentFlyer.title}
                    className={`block max-h-[78vh] max-w-[90vw] sm:max-w-[620px] md:max-w-[700px] w-auto h-auto ${
                      isCover ? "object-cover" : "object-contain"
                    }`}
                  />
                )
              )}
            </div>

            {/* Optional bottom bar if multiple flyers exist */}
            {activeFlyers.length > 1 && (
              <div className="border-t border-[#16324F]/15 bg-[#16324F]/5 px-4 py-2 flex items-center justify-between text-xs text-[#16324F]/70">
                <span className="text-[11px]">Next flyer will open on close</span>
                <button
                  onClick={() => handleDismissFlyer(currentFlyer.id)}
                  className="font-semibold text-[#16324F] hover:underline text-xs"
                >
                  Next Flyer ❯
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TOP-RIGHT NOTICE CARDS (Notice part that comes down in top right without hiding anything) */}
      {activeToasts.length > 0 && (
        <div className="fixed top-20 sm:top-24 right-3 sm:right-6 z-[9990] flex flex-col gap-3 max-w-[calc(100vw-1.5rem)] sm:max-w-md pointer-events-auto">
          {activeToasts.map((notice, idx) => {
            const theme = STYLE_THEMES[notice.designStyle] || STYLE_THEMES.gold;
            const toastUrl = notice.buttonUrl?.trim();

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
                {toastUrl && (
                  <div className="mt-3.5 flex items-center justify-end">
                    <a
                      href={toastUrl}
                      target={toastUrl.startsWith("http") ? "_blank" : undefined}
                      rel={toastUrl.startsWith("http") ? "noopener noreferrer" : undefined}
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

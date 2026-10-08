"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, ExternalLink, Sparkles, Bell } from "lucide-react";

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
  }
> = {
  gold: {
    cardBg: "bg-neutral-950/95 backdrop-blur-xl",
    textColor: "text-amber-100/90",
    accentColor: "text-[#C9A227]",
    border: "border-[#C9A227]/40 ring-1 ring-[#C9A227]/30 shadow-[0_0_40px_rgba(201,162,39,0.2)]",
    tagBg: "bg-[#C9A227]/20 border border-[#C9A227]/40",
    tagText: "text-[#C9A227]",
    btnClass: "bg-[#C9A227] hover:bg-[#d4ad2d] text-neutral-950 font-bold shadow-lg shadow-[#C9A227]/30",
  },
  navy: {
    cardBg: "bg-[#16324F]/95 backdrop-blur-xl",
    textColor: "text-[#F3F1EA]/90",
    accentColor: "text-[#F3F1EA]",
    border: "border-[#F3F1EA]/30 ring-1 ring-[#F3F1EA]/20 shadow-[0_0_40px_rgba(22,50,79,0.3)]",
    tagBg: "bg-[#F3F1EA]/20 border border-[#F3F1EA]/30",
    tagText: "text-[#F3F1EA]",
    btnClass: "bg-[#F3F1EA] hover:bg-white text-[#16324F] font-bold shadow-lg",
  },
  crimson: {
    cardBg: "bg-[#2d070f]/95 backdrop-blur-xl",
    textColor: "text-rose-100/90",
    accentColor: "text-rose-300",
    border: "border-rose-500/50 ring-1 ring-rose-500/30 shadow-[0_0_45px_rgba(225,29,72,0.25)]",
    tagBg: "bg-rose-500/20 border border-rose-500/40",
    tagText: "text-rose-300",
    btnClass: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/60",
  },
  dark: {
    cardBg: "bg-neutral-950/95 backdrop-blur-xl",
    textColor: "text-neutral-300",
    accentColor: "text-white",
    border: "border-neutral-700/80 ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.7)]",
    tagBg: "bg-neutral-800 border border-neutral-700",
    tagText: "text-neutral-200",
    btnClass: "bg-white hover:bg-neutral-200 text-neutral-950 font-bold shadow-lg",
  },
  minimal: {
    cardBg: "bg-[#F3F1EA]/95 backdrop-blur-xl",
    textColor: "text-[#16324F]/85",
    accentColor: "text-[#16324F]",
    border: "border-[#16324F]/30 ring-1 ring-[#16324F]/10 shadow-[0_0_40px_rgba(22,50,79,0.15)]",
    tagBg: "bg-[#16324F]/10 border border-[#16324F]/20",
    tagText: "text-[#16324F]",
    btnClass: "bg-[#16324F] hover:bg-[#1f4268] text-[#F3F1EA] font-bold shadow-md",
  },
};

export default function NoticePopup() {
  const pathname = usePathname();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activePopupIndex, setActivePopupIndex] = useState<number>(0);
  const [dismissedPopups, setDismissedPopups] = useState<Set<number>>(new Set());
  const [dismissedBanners, setDismissedBanners] = useState<Set<number>>(new Set());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Do not render notices on admin routes
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

  // Read dismissed state from localStorage
  useEffect(() => {
    try {
      const storedDismissed = localStorage.getItem("vidya_dismissed_notices");
      if (storedDismissed) {
        const parsed = JSON.parse(storedDismissed);
        const now = Date.now();
        // filter out entries older than 24 hours
        const validIds = new Set<number>();
        for (const [idStr, expiry] of Object.entries(parsed)) {
          if (typeof expiry === "number" && expiry > now) {
            validIds.add(Number(idStr));
          }
        }
        setDismissedPopups(validIds);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  if (isAdminRoute || notices.length === 0) {
    return null;
  }

  // Filter popup and banner notices
  const popupNotices = notices.filter(
    (n) => n.displayLocation === "popup" && !dismissedPopups.has(n.id)
  );

  const bannerNotices = notices.filter(
    (n) => n.displayLocation === "banner" && !dismissedBanners.has(n.id)
  );

  const currentPopup = popupNotices[activePopupIndex] || null;

  function handleDismissPopup(id: number) {
    if (dontShowAgain) {
      try {
        const stored = localStorage.getItem("vidya_dismissed_notices");
        const parsed = stored ? JSON.parse(stored) : {};
        // dismiss for 24 hours
        parsed[id] = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem("vidya_dismissed_notices", JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }

    setDismissedPopups((prev) => new Set([...prev, id]));
    if (activePopupIndex < popupNotices.length - 1) {
      setActivePopupIndex((i) => i + 1);
    }
  }

  function handleDismissBanner(id: number) {
    setDismissedBanners((prev) => new Set([...prev, id]));
  }

  return (
    <>
      {/* 1. TOP BANNERS */}
      {bannerNotices.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-1 pointer-events-auto">
          {bannerNotices.map((banner) => {
            const theme = STYLE_THEMES[banner.designStyle] || STYLE_THEMES.gold;
            return (
              <div
                key={banner.id}
                className={`w-full border-b px-4 py-2.5 transition-all duration-300 ${theme.cardBg} ${theme.border}`}
              >
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
                    >
                      {banner.tag || "Notice"}
                    </span>
                    <span className={`truncate font-medium ${theme.textColor}`}>
                      {banner.heading || banner.title}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {banner.buttonText && (
                      <a
                        href={banner.buttonUrl || "#"}
                        target={banner.buttonUrl?.startsWith("http") ? "_blank" : undefined}
                        rel={banner.buttonUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${theme.btnClass}`}
                      >
                        {banner.buttonText}
                      </a>
                    )}
                    <button
                      onClick={() => handleDismissBanner(banner.id)}
                      className="rounded-lg p-1 text-neutral-400 hover:text-white"
                      aria-label="Dismiss banner"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. POPUP MODAL */}
      {currentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Modal Container */}
          <div
            className={`relative flex flex-col max-h-[90vh] w-full max-w-lg rounded-3xl border overflow-hidden transition-all duration-300 ${
              (STYLE_THEMES[currentPopup.designStyle] || STYLE_THEMES.gold).cardBg
            } ${(STYLE_THEMES[currentPopup.designStyle] || STYLE_THEMES.gold).border}`}
          >
            {/* Close button */}
            <button
              onClick={() => handleDismissPopup(currentPopup.id)}
              className="absolute top-3.5 right-3.5 z-30 flex size-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-md transition hover:bg-black/75 hover:text-white"
              aria-label="Close notice"
            >
              <X className="size-5" />
            </button>

            {/* Multiple notices indicator */}
            {popupNotices.length > 1 && (
              <div className="absolute top-4 left-4 z-30 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                Notice {activePopupIndex + 1} of {popupNotices.length}
              </div>
            )}

            {/* Modal Body Based on Notice Type */}
            <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
              {renderPopupContent(currentPopup)}
            </div>

            {/* Modal Footer with "Don't show again today" and Close */}
            <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between text-xs bg-black/20">
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-400 hover:text-neutral-200">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-neutral-600 bg-neutral-900 text-[#C9A227] focus:ring-0"
                />
                <span className="text-[11px]">Don&apos;t show again today</span>
              </label>

              <button
                onClick={() => handleDismissPopup(currentPopup.id)}
                className="font-medium text-neutral-400 hover:text-white transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function renderPopupContent(notice: Notice) {
  const theme = STYLE_THEMES[notice.designStyle] || STYLE_THEMES.gold;

  // Case 1: Pure Image Flyer (supports ANY dimension, 1:1, 4:5, 16:9, etc.)
  if (notice.noticeType === "popup_image") {
    return (
      <div className="flex flex-col items-center">
        {notice.imageUrl && (
          <div className="relative w-full flex items-center justify-center bg-black/40 p-2 sm:p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={notice.imageUrl}
              alt={notice.title}
              className={`w-full max-h-[70vh] rounded-2xl object-${notice.imageFit}`}
            />
          </div>
        )}

        {notice.buttonText && (
          <div className="w-full p-4 text-center">
            <a
              href={notice.buttonUrl || "#"}
              target={notice.buttonUrl?.startsWith("http") ? "_blank" : undefined}
              rel={notice.buttonUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`inline-block w-full rounded-2xl py-3 text-sm font-bold transition text-center ${theme.btnClass}`}
            >
              {notice.buttonText}
            </a>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Pure Text Design
  if (notice.noticeType === "popup_text") {
    return (
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
          >
            {notice.tag || "Notice"}
          </span>
        </div>

        <h3 className={`mt-4 font-serif text-2xl sm:text-3xl font-bold leading-tight ${theme.accentColor}`}>
          {notice.heading || notice.title}
        </h3>

        {notice.description && (
          <div className={`mt-4 whitespace-pre-line text-sm sm:text-base leading-relaxed ${theme.textColor}`}>
            {notice.description}
          </div>
        )}

        {notice.buttonText && (
          <div className="mt-6">
            <a
              href={notice.buttonUrl || "#"}
              target={notice.buttonUrl?.startsWith("http") ? "_blank" : undefined}
              rel={notice.buttonUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`inline-flex items-center justify-center w-full gap-2 rounded-2xl py-3.5 text-sm font-bold transition ${theme.btnClass}`}
            >
              <span>{notice.buttonText}</span>
              <ExternalLink className="size-4" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Case 3: Combo (Image + Text)
  return (
    <div>
      {notice.imageUrl && (
        <div className="relative w-full max-h-64 overflow-hidden bg-black/40 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={notice.imageUrl}
            alt={notice.heading || notice.title}
            className={`w-full max-h-64 object-${notice.imageFit}`}
          />
        </div>
      )}

      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
          >
            {notice.tag || "Notice"}
          </span>
        </div>

        <h3 className={`mt-3 font-serif text-xl sm:text-2xl font-bold leading-snug ${theme.accentColor}`}>
          {notice.heading || notice.title}
        </h3>

        {notice.description && (
          <div className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${theme.textColor}`}>
            {notice.description}
          </div>
        )}

        {notice.buttonText && (
          <div className="mt-5">
            <a
              href={notice.buttonUrl || "#"}
              target={notice.buttonUrl?.startsWith("http") ? "_blank" : undefined}
              rel={notice.buttonUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`inline-flex items-center justify-center w-full gap-2 rounded-2xl py-3 text-sm font-bold transition ${theme.btnClass}`}
            >
              <span>{notice.buttonText}</span>
              <ExternalLink className="size-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, ExternalLink } from "lucide-react";

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
    border: "border-[#C9A227]/40 ring-1 ring-[#C9A227]/30 shadow-[0_0_50px_rgba(201,162,39,0.25)]",
    tagBg: "bg-[#C9A227]/20 border border-[#C9A227]/40",
    tagText: "text-[#C9A227]",
    btnClass: "bg-[#C9A227] hover:bg-[#d4ad2d] text-neutral-950 font-bold shadow-lg shadow-[#C9A227]/30",
  },
  navy: {
    cardBg: "bg-[#16324F]/95 backdrop-blur-xl",
    textColor: "text-[#F3F1EA]/90",
    accentColor: "text-[#F3F1EA]",
    border: "border-[#F3F1EA]/30 ring-1 ring-[#F3F1EA]/20 shadow-[0_0_50px_rgba(22,50,79,0.35)]",
    tagBg: "bg-[#F3F1EA]/20 border border-[#F3F1EA]/30",
    tagText: "text-[#F3F1EA]",
    btnClass: "bg-[#F3F1EA] hover:bg-white text-[#16324F] font-bold shadow-lg",
  },
  crimson: {
    cardBg: "bg-[#2d070f]/95 backdrop-blur-xl",
    textColor: "text-rose-100/90",
    accentColor: "text-rose-300",
    border: "border-rose-500/50 ring-1 ring-rose-500/30 shadow-[0_0_50px_rgba(225,29,72,0.3)]",
    tagBg: "bg-rose-500/20 border border-rose-500/40",
    tagText: "text-rose-300",
    btnClass: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/60",
  },
  dark: {
    cardBg: "bg-neutral-950/95 backdrop-blur-xl",
    textColor: "text-neutral-300",
    accentColor: "text-white",
    border: "border-neutral-700/80 ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]",
    tagBg: "bg-neutral-800 border border-neutral-700",
    tagText: "text-neutral-200",
    btnClass: "bg-white hover:bg-neutral-200 text-neutral-950 font-bold shadow-lg",
  },
  minimal: {
    cardBg: "bg-[#F3F1EA]/95 backdrop-blur-xl",
    textColor: "text-[#16324F]/85",
    accentColor: "text-[#16324F]",
    border: "border-[#16324F]/30 ring-1 ring-[#16324F]/10 shadow-[0_0_50px_rgba(22,50,79,0.2)]",
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
        const validIds = new Set<number>();
        for (const [idStr, expiry] of Object.entries(parsed)) {
          if (typeof expiry === "number" && expiry > now) {
            validIds.add(Number(idStr));
          }
        }
        setDismissedPopups(validIds);
      }
    } catch {
      // ignore
    }
  }, []);

  // Filter popup and banner notices
  const popupNotices = notices.filter(
    (n) => n.displayLocation === "popup" && !dismissedPopups.has(n.id)
  );

  const bannerNotices = notices.filter(
    (n) => n.displayLocation === "banner" && !dismissedBanners.has(n.id)
  );

  const currentPopup = popupNotices[activePopupIndex] || null;

  // HIDE NAVBAR AND LOCK BODY SCROLL WHILE POPUP IS VISIBLE
  useEffect(() => {
    if (currentPopup && !isAdminRoute) {
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
  }, [currentPopup, isAdminRoute]);

  const handleDismissPopup = useCallback((id: number) => {
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

    setDismissedPopups((prev) => new Set([...prev, id]));
    if (activePopupIndex < popupNotices.length - 1) {
      setActivePopupIndex((i) => i + 1);
    }
  }, [dontShowAgain, activePopupIndex, popupNotices.length]);

  function handleDismissBanner(id: number) {
    setDismissedBanners((prev) => new Set([...prev, id]));
  }

  if (isAdminRoute || notices.length === 0) {
    return null;
  }

  return (
    <>
      {/* 1. TOP BANNERS */}
      {bannerNotices.length > 0 && !currentPopup && (
        <div className="fixed top-0 left-0 right-0 z-[99998] flex flex-col gap-1 pointer-events-auto">
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

      {/* 2. FULLSCREEN POPUP MODAL OVERLAY (z-[999999] completely above navbar) */}
      {currentPopup && (
        <div
          onClick={(e) => {
            // Dismiss if user clicks outside the modal dialog box
            if (e.target === e.currentTarget) {
              handleDismissPopup(currentPopup.id);
            }
          }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Main Modal Wrapper — dynamic sizing hugs the content/image */}
          <div className="relative flex flex-col items-center max-w-[95vw] max-h-[94vh]">
            {/* Prominent floating close button placed on the outside corner so it never obscures flyer content */}
            <button
              onClick={() => handleDismissPopup(currentPopup.id)}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-50 flex size-9 sm:size-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-2xl ring-2 ring-black/20 hover:bg-neutral-100 hover:scale-110 active:scale-95 transition-all"
              aria-label="Close notice"
            >
              <X className="size-5 stroke-[2.5]" />
            </button>

            {/* Multiple notices indicator */}
            {popupNotices.length > 1 && (
              <div className="absolute top-2 left-2 z-40 rounded-full bg-black/75 border border-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                Notice {activePopupIndex + 1} of {popupNotices.length}
              </div>
            )}

            {/* Modal Body Container */}
            <div className="overflow-y-auto max-h-[calc(94vh-48px)] flex flex-col items-center">
              {renderPopupContent(currentPopup)}
            </div>

            {/* Bottom Controls: "Don't show again today" & Dismiss */}
            <div className="mt-2.5 flex items-center justify-between gap-6 px-3 py-1 rounded-full bg-neutral-950/70 border border-white/10 text-xs backdrop-blur-md select-none text-neutral-300">
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
                onClick={() => handleDismissPopup(currentPopup.id)}
                className="text-[11px] font-medium text-neutral-400 hover:text-white transition"
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
  const targetUrl = notice.buttonUrl?.trim();
  const isCover = notice.imageFit === "cover";

  // CASE 1: Pure Image Flyer (supports ANY dimension, never stretches, hugs exact aspect ratio)
  if (notice.noticeType === "popup_image") {
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

  // CASE 2: Combo (Image + Text)
  if (notice.noticeType === "popup_combo") {
    return (
      <div
        className={`w-full max-w-[90vw] sm:max-w-[480px] md:max-w-[520px] rounded-3xl border overflow-hidden shadow-2xl ${theme.cardBg} ${theme.border}`}
      >
        {notice.imageUrl && (
          <div className="relative w-full bg-black/60 flex items-center justify-center overflow-hidden border-b border-white/10">
            {targetUrl ? (
              <a
                href={targetUrl}
                target={targetUrl.startsWith("http") ? "_blank" : undefined}
                rel={targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group relative block w-full cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={notice.imageUrl}
                  alt={notice.heading || notice.title}
                  className={`block w-full max-h-[50vh] transition-transform duration-300 group-hover:scale-[1.015] ${
                    isCover ? "object-cover" : "object-contain"
                  }`}
                />
                <div className="absolute top-3 right-3 rounded-full bg-black/60 border border-white/20 p-1.5 text-white backdrop-blur-sm group-hover:bg-[#C9A227] group-hover:text-black transition">
                  <ExternalLink className="size-3.5" />
                </div>
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={notice.imageUrl}
                alt={notice.heading || notice.title}
                className={`block w-full max-h-[50vh] ${isCover ? "object-cover" : "object-contain"}`}
              />
            )}
          </div>
        )}

        <div className="p-5 sm:p-7">
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

          {targetUrl && (
            <div className="mt-5">
              <a
                href={targetUrl}
                target={targetUrl.startsWith("http") ? "_blank" : undefined}
                rel={targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`inline-flex items-center justify-center w-full gap-2 rounded-2xl py-3.5 text-sm font-bold transition ${theme.btnClass}`}
              >
                <span>{notice.buttonText || "Open Link"}</span>
                <ExternalLink className="size-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CASE 3: Pure Text Design
  return (
    <div
      className={`w-full max-w-[90vw] sm:max-w-[480px] md:max-w-[540px] rounded-3xl border p-6 sm:p-8 shadow-2xl ${theme.cardBg} ${theme.border}`}
    >
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

      {targetUrl && (
        <div className="mt-6">
          <a
            href={targetUrl}
            target={targetUrl.startsWith("http") ? "_blank" : undefined}
            rel={targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`inline-flex items-center justify-center w-full gap-2 rounded-2xl py-3.5 text-sm font-bold transition ${theme.btnClass}`}
          >
            <span>{notice.buttonText || "Learn More"}</span>
            <ExternalLink className="size-4" />
          </a>
        </div>
      )}
    </div>
  );
}

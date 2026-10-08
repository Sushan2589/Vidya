"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Type,
  LayoutTemplate,
  Bell,
  X,
} from "lucide-react";

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

const DEFAULT_FORM: Omit<Notice, "id" | "createdAt"> = {
  title: "",
  noticeType: "popup_combo",
  imageUrl: "",
  imageFit: "contain",
  tag: "Important Notice",
  heading: "",
  description: "",
  designStyle: "gold",
  buttonText: "",
  buttonUrl: "",
  displayLocation: "popup",
  isActive: true,
};

const STYLE_THEMES: Record<
  DesignStyle,
  {
    name: string;
    description: string;
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
    name: "Royal Gold",
    description: "Deep obsidian dark with radiant gold accents",
    cardBg: "bg-neutral-950",
    textColor: "text-amber-100/90",
    accentColor: "text-[#C9A227]",
    border: "border-[#C9A227]/40 ring-1 ring-[#C9A227]/20",
    tagBg: "bg-[#C9A227]/20 border border-[#C9A227]/40",
    tagText: "text-[#C9A227]",
    btnClass: "bg-[#C9A227] hover:bg-[#d4ad2d] text-neutral-950 font-semibold shadow-lg shadow-[#C9A227]/25",
  },
  navy: {
    name: "Academic Navy",
    description: "VIDYA brand deep sapphire with warm ivory",
    cardBg: "bg-[#16324F]",
    textColor: "text-[#F3F1EA]/90",
    accentColor: "text-[#F3F1EA]",
    border: "border-[#F3F1EA]/25",
    tagBg: "bg-[#F3F1EA]/20 border border-[#F3F1EA]/30",
    tagText: "text-[#F3F1EA]",
    btnClass: "bg-[#F3F1EA] hover:bg-white text-[#16324F] font-semibold shadow-md",
  },
  crimson: {
    name: "Urgent Crimson",
    description: "Vibrant ruby crimson for critical updates and deadlines",
    cardBg: "bg-gradient-to-b from-[#3b0b14] to-[#1e050a]",
    textColor: "text-rose-100/90",
    accentColor: "text-rose-400",
    border: "border-rose-500/40 ring-1 ring-rose-500/20",
    tagBg: "bg-rose-500/20 border border-rose-500/50",
    tagText: "text-rose-300",
    btnClass: "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-900/50",
  },
  dark: {
    name: "Midnight Minimal",
    description: "Monochrome slate and obsidian dark aesthetic",
    cardBg: "bg-neutral-900",
    textColor: "text-neutral-200",
    accentColor: "text-white",
    border: "border-neutral-700",
    tagBg: "bg-neutral-800 border border-neutral-700",
    tagText: "text-neutral-300",
    btnClass: "bg-white hover:bg-neutral-200 text-neutral-950 font-semibold shadow-md",
  },
  minimal: {
    name: "Parchment Light",
    description: "Classic clean parchment ivory with deep blue text",
    cardBg: "bg-[#F3F1EA]",
    textColor: "text-[#16324F]/80",
    accentColor: "text-[#16324F]",
    border: "border-[#16324F]/20",
    tagBg: "bg-[#16324F]/10 border border-[#16324F]/20",
    tagText: "text-[#16324F]",
    btnClass: "bg-[#16324F] hover:bg-[#1f4268] text-[#F3F1EA] font-semibold shadow-md",
  },
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  function openCreateModal() {
    setEditingNotice(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(notice: Notice) {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      noticeType: notice.noticeType,
      imageUrl: notice.imageUrl || "",
      imageFit: notice.imageFit || "contain",
      tag: notice.tag || "Important Notice",
      heading: notice.heading || "",
      description: notice.description || "",
      designStyle: notice.designStyle || "gold",
      buttonText: notice.buttonText || "",
      buttonUrl: notice.buttonUrl || "",
      displayLocation: notice.displayLocation || "popup",
      isActive: notice.isActive,
    });
    setIsModalOpen(true);
  }

  async function handleToggleActive(id: number, current: boolean) {
    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setNotices((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isActive: !current } : n))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error("Failed to delete notice:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        noticeType: formData.noticeType,
        imageUrl: formData.imageUrl?.trim() || null,
        imageFit: formData.imageFit,
        tag: formData.tag.trim() || "Important Notice",
        heading: formData.heading?.trim() || null,
        description: formData.description?.trim() || null,
        designStyle: formData.designStyle,
        buttonText: formData.buttonText?.trim() || null,
        buttonUrl: formData.buttonUrl?.trim() || null,
        displayLocation: formData.displayLocation,
        isActive: formData.isActive,
      };

      const url = editingNotice
        ? `/api/admin/notices/${editingNotice.id}`
        : "/api/admin/notices";
      const method = editingNotice ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchNotices();
      } else {
        const err = await res.json();
        alert(err.error ? JSON.stringify(err.error) : "Failed to save notice");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-medium text-[#16324F]">
              Notices & Popups
            </h1>
            <span className="rounded-full bg-[#C9A227]/20 px-3 py-0.5 text-xs font-semibold text-[#8C6D15]">
              {notices.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-[#16324F]/70">
            Publish interactive announcement popups, flyer notices of any dimension, or custom styled banners.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#16324F] px-4 py-2.5 text-sm font-medium text-[#F3F1EA] shadow-md transition-all hover:bg-[#1a3d61] hover:shadow-lg"
        >
          <Plus className="size-4" />
          Create Notice / Popup
        </button>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-12 text-center text-[#16324F]/50">
          Loading notices...
        </div>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#16324F]/20 bg-[#F3F1EA]/60 p-12 text-center">
          <Bell className="mx-auto size-12 text-[#16324F]/30" />
          <h3 className="mt-3 font-serif text-lg font-medium text-[#16324F]">
            No notices published yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#16324F]/60">
            Create your first notice or popup. You can show flyers of any dimension, text announcements with custom themes, or full screen modal alerts.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#16324F] px-4 py-2 text-sm font-medium text-[#F3F1EA]"
          >
            <Plus className="size-4" />
            Add Notice Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {notices.map((notice) => {
            const theme = STYLE_THEMES[notice.designStyle] || STYLE_THEMES.gold;
            return (
              <div
                key={notice.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] shadow-sm transition hover:shadow-md"
              >
                <div>
                  {/* Card Header & Preview Strip */}
                  <div className="relative border-b border-[#16324F]/10 bg-neutral-900/5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          notice.displayLocation === "popup"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {notice.displayLocation === "popup" ? "Popup Modal" : "Top Banner"}
                      </span>

                      <button
                        onClick={() => handleToggleActive(notice.id, notice.isActive)}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                          notice.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                        }`}
                      >
                        {notice.isActive ? (
                          <>
                            <CheckCircle2 className="size-3.5" />
                            Live on Site
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="mt-3 font-serif text-lg font-semibold text-[#16324F]">
                      {notice.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Notice Type & Theme Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded bg-neutral-200/70 px-2 py-0.5 font-medium text-neutral-700">
                        {notice.noticeType === "popup_image" && "🖼️ Image Only"}
                        {notice.noticeType === "popup_text" && "✍️ Text Design"}
                        {notice.noticeType === "popup_combo" && "🎨 Image + Text"}
                        {notice.noticeType === "banner_text" && "📢 Top Alert"}
                      </span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                        Theme: {theme.name}
                      </span>
                    </div>

                    {/* Image Thumbnail if any */}
                    {notice.imageUrl && (
                      <div className="relative mt-2 max-h-36 overflow-hidden rounded-xl border border-[#16324F]/10 bg-neutral-900/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={notice.imageUrl}
                          alt={notice.title}
                          className={`w-full max-h-36 object-${notice.imageFit}`}
                        />
                      </div>
                    )}

                    {/* Content snippet */}
                    {notice.heading && (
                      <p className="font-serif text-sm font-semibold text-[#16324F]">
                        {notice.heading}
                      </p>
                    )}
                    {notice.description && (
                      <p className="line-clamp-2 text-xs text-[#16324F]/70">
                        {notice.description}
                      </p>
                    )}
                    {notice.buttonText && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#16324F]/60">
                        <span>CTA:</span>
                        <span className="font-semibold text-[#16324F]">{notice.buttonText}</span>
                        {notice.buttonUrl && (
                          <span className="truncate text-xs text-blue-600">({notice.buttonUrl})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between border-t border-[#16324F]/10 bg-white/50 px-4 py-3">
                  <button
                    onClick={() => setPreviewNotice(notice)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#16324F]/70 hover:text-[#16324F]"
                  >
                    <Eye className="size-3.5" />
                    Preview
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(notice)}
                      className="rounded-lg p-1.5 text-[#16324F]/70 hover:bg-[#16324F]/10 hover:text-[#16324F]"
                      title="Edit"
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(notice.id)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-[#F3F1EA] p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-[#16324F]">Delete Notice?</h3>
            <p className="mt-2 text-sm text-[#16324F]/70">
              Are you sure you want to delete this notice? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-[#16324F] hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal with LIVE PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6 backdrop-blur-md">
          <div className="relative my-6 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#16324F]/20 bg-[#F3F1EA] shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#16324F]/10 bg-[#F3F1EA]/95 px-6 py-4 backdrop-blur-sm">
              <h2 className="font-serif text-xl font-bold text-[#16324F]">
                {editingNotice ? "Edit Notice / Popup" : "Create New Notice / Popup"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-[#16324F]/60 hover:bg-[#16324F]/10 hover:text-[#16324F]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              {/* Form Side (7 cols) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                    Notice Title (Internal / Reference) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IMO 2026 Selection Exam Announcement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] placeholder:text-neutral-400 focus:border-[#C9A227] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30"
                  />
                </div>

                {/* Display Location & Active Toggle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                      Display Mode
                    </label>
                    <select
                      value={formData.displayLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayLocation: e.target.value as DisplayLocation,
                        })
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#16324F]/20 bg-white px-3 py-2 text-sm text-[#16324F] focus:border-[#C9A227] focus:outline-none"
                    >
                      <option value="popup">Modal Popup (On Screen)</option>
                      <option value="banner">Top Notification Bar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                      Visibility Status
                    </label>
                    <div className="mt-1.5 flex items-center h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({ ...formData, isActive: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span className="ml-3 text-xs font-semibold text-[#16324F]">
                          {formData.isActive ? "Active (Live)" : "Draft (Hidden)"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notice Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                    Notice Format & Content Type
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        type: "popup_image" as NoticeType,
                        label: "Flyer Poster",
                        desc: "Full modal poster (consecutive queue)",
                        icon: ImageIcon,
                      },
                      {
                        type: "popup_text" as NoticeType,
                        label: "Top-Right Notice",
                        desc: "Slides down in top-right, keeps page open",
                        icon: Bell,
                      },
                      {
                        type: "popup_combo" as NoticeType,
                        label: "Image + Text",
                        desc: "Card with flyer & styled text",
                        icon: LayoutTemplate,
                      },
                      {
                        type: "banner_text" as NoticeType,
                        label: "Top Bar",
                        desc: "Compact bar with link",
                        icon: Type,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = formData.noticeType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setFormData({ ...formData, noticeType: item.type })}
                          className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                            isSelected
                              ? "border-[#16324F] bg-[#16324F] text-[#F3F1EA] shadow-md"
                              : "border-[#16324F]/15 bg-white text-[#16324F] hover:bg-[#16324F]/5"
                          }`}
                        >
                          <Icon className="size-5 mb-1" />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Section (Shown for combo or image) */}
                {(formData.noticeType === "popup_combo" ||
                  formData.noticeType === "popup_image") && (
                  <div className="rounded-2xl border border-[#16324F]/15 bg-white/70 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                        Image / Flyer URL
                      </label>
                      <span className="text-[11px] text-[#16324F]/60">
                        Supports any aspect ratio & dimensions
                      </span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or uploaded URL"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#16324F]/20 bg-white px-3.5 py-2 text-sm text-[#16324F] placeholder:text-neutral-400 focus:border-[#C9A227] focus:outline-none"
                    />



                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-medium text-[#16324F]">Image Fitting:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageFit: "contain" })}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            formData.imageFit === "contain"
                              ? "bg-[#16324F] text-white"
                              : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                          }`}
                        >
                          Natural Aspect Ratio (Contain)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageFit: "cover" })}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            formData.imageFit === "cover"
                              ? "bg-[#16324F] text-white"
                              : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                          }`}
                        >
                          Fill Frame (Cover)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Theme / Design Style */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                    Design Theme & Visual Style
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(Object.keys(STYLE_THEMES) as DesignStyle[]).map((styleKey) => {
                      const t = STYLE_THEMES[styleKey];
                      const isSelected = formData.designStyle === styleKey;
                      return (
                        <button
                          key={styleKey}
                          type="button"
                          onClick={() => setFormData({ ...formData, designStyle: styleKey })}
                          className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                            isSelected
                              ? "border-[#C9A227] bg-[#16324F] text-white shadow-md ring-2 ring-[#C9A227]"
                              : "border-[#16324F]/15 bg-white text-[#16324F] hover:bg-[#16324F]/5"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-xs">
                            <Sparkles className="size-3 text-[#C9A227]" />
                            {t.name}
                          </div>
                          <span
                            className={`mt-1 line-clamp-1 text-[10px] ${
                              isSelected ? "text-neutral-300" : "text-neutral-500"
                            }`}
                          >
                            {t.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text Announcement Details */}
                {formData.noticeType !== "popup_image" && (
                  <div className="rounded-2xl border border-[#16324F]/15 bg-white/70 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                          Badge / Tag Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Urgent Notice"
                          value={formData.tag}
                          onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#16324F]/20 bg-white px-3 py-2 text-sm text-[#16324F] focus:border-[#C9A227] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                          Notice Headline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Nepal Mathematical Olympiad 2026"
                          value={formData.heading || ""}
                          onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#16324F]/20 bg-white px-3 py-2 text-sm text-[#16324F] focus:border-[#C9A227] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                        Announcement Content / Paragraph
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Provide details about the notice, schedule, instructions, or requirements..."
                        value={formData.description || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-[#16324F]/20 bg-white px-3.5 py-2 text-sm text-[#16324F] focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Destination Link & CTA Button */}
                <div className="rounded-2xl border border-[#16324F]/15 bg-white/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#16324F]">
                      Click Destination & Action Link
                    </span>
                    <span className="text-[11px] text-[#16324F]/60">
                      Clicking flyer image or button opens this URL
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#16324F] mb-1">
                      Destination URL (Website, Google Form, Telegram, etc.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://forms.gle/xyz or /resources or /#olympiads"
                      value={formData.buttonUrl || ""}
                      onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#16324F]/20 bg-white px-3 py-2 text-sm text-[#16324F] focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#16324F] mb-1">
                      Button / Banner Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Register Now / Open Link / View Details"
                      value={formData.buttonText || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, buttonText: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#16324F]/20 bg-white px-3 py-2 text-sm text-[#16324F] focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-[#16324F] hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#16324F] px-6 py-2.5 text-sm font-bold text-[#F3F1EA] shadow-md hover:bg-[#1a3d61] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingNotice ? "Save Changes" : "Publish Notice"}
                  </button>
                </div>
              </form>

              {/* LIVE PREVIEW SIDE (5 cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="flex items-center gap-1.5 pb-2 text-xs font-bold uppercase tracking-wider text-[#16324F]/70">
                  <Eye className="size-3.5 text-[#C9A227]" />
                  Live Visitor Preview
                </div>

                <div className="flex-1 rounded-2xl border border-[#16324F]/20 bg-neutral-900/40 p-4 flex flex-col items-center justify-center min-h-[350px]">
                  {renderPreviewBox({
                    ...formData,
                    id: 0,
                    createdAt: Date.now(),
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Preview Modal */}
      {previewNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-xl">
            <button
              onClick={() => setPreviewNotice(null)}
              className="absolute -top-12 right-0 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 backdrop-blur-sm"
            >
              <X className="size-4" /> Close Preview
            </button>
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              {renderPreviewBox(previewNotice)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderPreviewBox(notice: Notice) {
  const theme = STYLE_THEMES[notice.designStyle] || STYLE_THEMES.gold;

  // Banner display preview
  if (notice.displayLocation === "banner") {
    return (
      <div
        className={`w-full rounded-2xl border p-4 shadow-xl ${theme.cardBg} ${theme.border} text-center`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
            >
              {notice.tag || "Notice"}
            </span>
            <span className={`font-serif text-sm font-semibold ${theme.accentColor}`}>
              {notice.heading || notice.title}
            </span>
          </div>

          {notice.buttonText && (
            <button
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${theme.btnClass}`}
            >
              {notice.buttonText}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Pure Image Flyer (supports ANY aspect ratio and dimension without distortion)
  if (notice.noticeType === "popup_image") {
    const isCover = notice.imageFit === "cover";
    return (
      <div className="relative flex flex-col items-center">
        {notice.imageUrl ? (
          <div className="relative group overflow-hidden rounded-2xl shadow-2xl border border-white/20 bg-neutral-950 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={notice.imageUrl}
              alt={notice.title}
              className={`block max-h-[55vh] max-w-full w-auto h-auto ${
                isCover ? "object-cover" : "object-contain"
              }`}
            />
            {notice.buttonUrl && (
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white truncate flex items-center gap-1">
                  <span>{notice.buttonText || "Click to open link"}</span>
                  <ExternalLink className="size-3 text-[#C9A227]" />
                </span>
                <span className="rounded-full bg-[#C9A227] px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                  Visit ↗
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <ImageIcon className="size-12 stroke-[1.5]" />
            <p className="mt-2 text-xs">Enter Image URL to preview flyer</p>
          </div>
        )}
      </div>
    );
  }

  // Top-Right Notice Design (Unobtrusive card that comes down in top right)
  if (notice.noticeType === "popup_text") {
    return (
      <div className="w-full flex flex-col items-end">
        <div className="w-full text-right pb-1 text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
          Top-Right Notice Preview (Slides down, keeps page open)
        </div>
        <div
          className={`relative w-full max-w-sm rounded-2xl border p-4 sm:p-5 shadow-2xl ${theme.cardBg} ${theme.border}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
            >
              <Bell className="size-3" />
              {notice.tag || "Notice"}
            </span>
            <button className="rounded-lg p-1 text-xs text-neutral-400 hover:text-white" aria-label="Close">
              <X className="size-3.5" />
            </button>
          </div>

          <h3 className={`mt-2 font-serif text-base sm:text-lg font-bold leading-tight ${theme.accentColor}`}>
            {notice.heading || notice.title || "Notice Headline"}
          </h3>

          <div className={`mt-1.5 text-xs sm:text-sm leading-relaxed line-clamp-3 ${theme.textColor}`}>
            {notice.description ||
              "Notice announcement details will appear neatly here in the top right corner without blocking your visitors' view."}
          </div>

          {notice.buttonText && (
            <div className="mt-3 flex justify-end">
              <span className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-1 text-xs font-bold ${theme.btnClass}`}>
                <span>{notice.buttonText}</span>
                <ExternalLink className="size-3" />
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Combo: Image + Text Design
  return (
    <div
      className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${theme.cardBg} ${theme.border}`}
    >
      {notice.imageUrl && (
        <div className="relative w-full max-h-56 overflow-hidden bg-black/40 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={notice.imageUrl}
            alt={notice.heading || notice.title}
            className={`w-full max-h-56 ${
              notice.imageFit === "cover" ? "object-cover" : "object-contain"
            }`}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${theme.tagBg} ${theme.tagText}`}
          >
            {notice.tag || "Notice"}
          </span>
        </div>

        <h3 className={`mt-3 font-serif text-xl font-bold leading-snug ${theme.accentColor}`}>
          {notice.heading || notice.title || "Announcement Headline"}
        </h3>

        {notice.description && (
          <p className={`mt-2 text-sm leading-relaxed ${theme.textColor}`}>
            {notice.description}
          </p>
        )}

        {notice.buttonText && (
          <button
            className={`mt-5 w-full rounded-xl py-2.5 text-sm font-bold transition ${theme.btnClass}`}
          >
            {notice.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

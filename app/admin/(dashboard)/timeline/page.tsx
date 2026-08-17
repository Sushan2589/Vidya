"use client";

import { useCallback, useEffect, useState } from "react";

type TimelineItem = {
  id: number;
  year: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

const EMPTY_FORM = {
  year: "",
  title: "",
  description: "",
  imageUrl: "",
  sortOrder: "",
};

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function nextSortOrder(list: TimelineItem[]) {
    if (list.length === 0) return "0";
    const max = Math.max(...list.map((i) => i.sortOrder));
    return String(max + 1);
  }

  const loadItems = useCallback(async () => {
    const res = await fetch("/api/admin/timeline");
    const data: TimelineItem[] = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, [loadItems]);

  function startEdit(item: TimelineItem) {
    setEditingId(item.id);
    setForm({
      year: item.year,
      title: item.title,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      sortOrder: String(item.sortOrder),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: nextSortOrder(items) });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = editingId
      ? `/api/admin/timeline/${editingId}`
      : "/api/admin/timeline";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sortOrder: editingId
          ? Number(form.sortOrder) || 0 // keep existing order when editing
          : Number(nextSortOrder(items)), // auto next-order when adding
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Check the form and try again.",
      );
      return;
    }

    cancelEdit();
    setLoading(true);
    loadItems();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this timeline entry? This can't be undone.")) return;
    await fetch(`/api/admin/timeline/${id}`, { method: "DELETE" });
    setLoading(true);
    loadItems();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        Timeline
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        Milestones shown on the About page. Lower order number shows first.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid max-w-2xl grid-cols-1 gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6 sm:grid-cols-2"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Year
          </label>
          <input
            required
            placeholder="e.g. 2023"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Order
          </label>
          <div className="w-full rounded-lg border border-[#16324F]/10 bg-[#16324F]/5 px-3.5 py-2.5 text-sm text-[#16324F]/50">
            Automatic — added at the end
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Title
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Image URL
          </label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#16324F] px-5 py-2.5 text-sm font-medium tracking-wide text-[#F3F1EA] transition-colors hover:bg-[#1D3F63] disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add entry"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-[#16324F]/20 px-5 py-2.5 text-sm font-medium text-[#16324F]/70 transition-colors hover:bg-[#16324F]/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-10">
        {loading ? (
          <p className="text-sm text-[#16324F]/60">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#16324F]/60">No timeline entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-5"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#C9A227]">
                    {item.year} · order {item.sortOrder}
                  </p>
                  <p className="mt-1 font-medium text-[#16324F]">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-2 text-sm text-[#16324F]/70">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded-full border border-[#16324F]/20 px-4 py-1.5 text-xs font-medium text-[#16324F]/70 hover:bg-[#16324F]/5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

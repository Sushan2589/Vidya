"use client";

import { useCallback, useEffect, useState } from "react";

type NewsArticle = {
  id: number;
  title: string;
  description: string;
  href: string;
};

const EMPTY_FORM = { title: "", description: "", href: "" };

export default function NewsAdminPage() {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const res = await fetch("/api/admin/news");
    if (!res.ok) return;
    setItems(await res.json());
  }, []);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/admin/news");
      if (!res.ok) return;
      setItems(await res.json());
    };

    void run();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const url = editingId ? `/api/admin/news/${editingId}` : "/api/admin/news";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Unable to save news item.");
      return;
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    void loadItems();
  }

  function startEdit(item: NewsArticle) {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description, href: item.href });
    setError(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this news item?")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    void loadItems();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        News & Media
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        Manage the stories shown in the homepage news strip.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid max-w-2xl gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6"
      >
        <div>
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

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Link URL
          </label>
          <input
            required
            type="url"
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Description
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#16324F] px-5 py-2.5 text-sm font-medium tracking-wide text-[#F3F1EA] transition-colors hover:bg-[#1D3F63] disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Save changes" : "Add news item"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
                setError(null);
              }}
              className="rounded-full border border-[#16324F]/20 px-5 py-2.5 text-sm font-medium text-[#16324F]/70 transition-colors hover:bg-[#16324F]/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[#16324F]/60">No news items yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-4"
            >
              <div>
                <p className="font-medium text-[#16324F]">{item.title}</p>
                <p className="mt-1 text-sm text-[#16324F]/70">{item.description}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-[#16324F] underline decoration-[#C9A227] underline-offset-4"
                >
                  Open link
                </a>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-full border border-[#16324F]/20 px-4 py-1.5 text-xs font-medium text-[#16324F]/70 hover:bg-[#16324F]/5"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

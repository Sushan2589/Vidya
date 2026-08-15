"use client";

import { useEffect, useState } from "react";

type Resource = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  category: string | null;
};

const EMPTY_FORM = { title: "", description: "", fileUrl: "", category: "" };

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadResources() {
    setLoading(true);
    const res = await fetch("/api/admin/resources");
    setResources(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, []);

  function startEdit(resource: Resource) {
    setEditingId(resource.id);
    setForm({
      title: resource.title,
      description: resource.description || "",
      fileUrl: resource.fileUrl,
      category: resource.category || "",
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = editingId
      ? `/api/admin/resources/${editingId}`
      : "/api/admin/resources";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Check the form — the link needs to be a full URL."
      );
      return;
    }

    cancelEdit();
    loadResources();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this resource? This can't be undone.")) return;
    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    loadResources();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        Resources
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        Downloads and links shared with students.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid max-w-2xl grid-cols-1 gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6 sm:grid-cols-2"
      >
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

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            Category
          </label>
          <input
            placeholder="e.g. Math Olympiad"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
            File / link URL
          </label>
          <input
            type="url"
            required
            placeholder="https://"
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
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
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Add resource"}
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
        ) : resources.length === 0 ? (
          <p className="text-sm text-[#16324F]/60">No resources yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-5"
              >
                <div>
                  <p className="font-medium text-[#16324F]">
                    {resource.title}
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-[#C9A227]">
                    {resource.category || "Uncategorized"}
                  </p>
                  {resource.description && (
                    <p className="mt-2 text-sm text-[#16324F]/70">
                      {resource.description}
                    </p>
                  )}
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-[#16324F] underline decoration-[#C9A227] underline-offset-4"
                  >
                    View file
                  </a>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(resource)}
                    className="rounded-full border border-[#16324F]/20 px-4 py-1.5 text-xs font-medium text-[#16324F]/70 hover:bg-[#16324F]/5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
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

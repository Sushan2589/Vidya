"use client";

import { useCallback, useEffect, useState } from "react";

type Event = {
  id: number;
  slug: string;
  title: string;
  subject: string;
  level: string;
  summary: string;
  details: string;
  eligibility: string;
  syllabus: string;
  heldIn: string;
  date: string;
  location: string | null;
  registrationLink: string | null;
  imageUrl: string | null;
};

const EMPTY_FORM = {
  title: "",
  subject: "",
  level: "",
  summary: "",
  details: "",
  eligibility: "",
  syllabus: "",
  heldIn: "",
  date: "",
  location: "",
  registrationLink: "",
  imageUrl: "",
};

const inputClass =
  "w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25";
const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

const loadEvents = useCallback(async () => {
  const res = await fetch("/api/admin/events");
  setEvents(await res.json());
  setLoading(false);
}, []);

useEffect(() => {
   // eslint-disable-next-line react-hooks/set-state-in-effect
  loadEvents();
}, [loadEvents]);


  function startEdit(event: Event) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      subject: event.subject,
      level: event.level,
      summary: event.summary,
      details: event.details,
      eligibility: event.eligibility,
      syllabus: event.syllabus,
      heldIn: event.heldIn,
      date: event.date || "",
      location: event.location || "",
      registrationLink: event.registrationLink || "",
      imageUrl: event.imageUrl || "",
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

  const url = editingId ? `/api/admin/events/${editingId}` : "/api/admin/events";
  const res = await fetch(url, {
    method: editingId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  setSaving(false);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    setError(typeof data.error === "string" ? data.error : "Check the form — something's not valid.");
    return;
  }

  cancelEdit();
  setLoading(true);   // manual refetch — safe here, this is a click handler
  loadEvents();
}

async function handleDelete(id: number) {
  if (!confirm("Delete this event? This can't be undone.")) return;
  await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
  setLoading(true);
  loadEvents();
}

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        Events
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        Olympiads shown on the site — card summary plus full detail view.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid max-w-3xl grid-cols-1 gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className={labelClass}>Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            placeholder="International Mathematical Olympiad"
          />
        </div>

        <div>
          <label className={labelClass}>Subject</label>
          <input
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
            placeholder="Mathematics"
          />
        </div>

        <div>
          <label className={labelClass}>Level</label>
          <input
            required
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className={inputClass}
            placeholder="Grades 9–12"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Short summary (shown on the card)</label>
          <textarea
            required
            rows={2}
            maxLength={200}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>
            Full description (shown in detail view)
          </label>
          <textarea
            required
            rows={5}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Eligibility criteria (one per line)
          </label>
          <textarea
            rows={4}
            value={form.eligibility}
            onChange={(e) =>
              setForm({ ...form, eligibility: e.target.value })
            }
            className={inputClass}
            placeholder={
              "Must be enrolled in grades 9–12\nNational olympiad qualification required"
            }
          />
        </div>

        <div>
          <label className={labelClass}>Syllabus / topics (one per line)</label>
          <textarea
            rows={4}
            value={form.syllabus}
            onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
            className={inputClass}
            placeholder={"Algebra\nCombinatorics\nGeometry\nNumber theory"}
          />
        </div>

        <div>
          <label className={labelClass}>Held in (display text)</label>
          <input
            required
            value={form.heldIn}
            onChange={(e) => setForm({ ...form, heldIn: e.target.value })}
            className={inputClass}
            placeholder="Held annually, July"
          />
        </div>

        <div>
          <label className={labelClass}>Exact date (optional)</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Image URL</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Registration link</label>
          <input
            type="url"
            placeholder="https://"
            value={form.registrationLink}
            onChange={(e) =>
              setForm({ ...form, registrationLink: e.target.value })
            }
            className={inputClass}
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Add event"}
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
        ) : events.length === 0 ? (
          <p className="text-sm text-[#16324F]/60">No events yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-5"
              >
                <div>
                  <p className="font-medium text-[#16324F]">{event.title}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-[#C9A227]">
                    {event.subject} · {event.level}
                    {event.heldIn ? ` · ${event.heldIn}` : ""}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  {event.summary && (
                    <p className="mt-2 text-sm text-[#16324F]/70">
                      {event.summary}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(event)}
                    className="rounded-full border border-[#16324F]/20 px-4 py-1.5 text-xs font-medium text-[#16324F]/70 hover:bg-[#16324F]/5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
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
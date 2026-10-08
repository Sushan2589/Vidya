"use client";

import { useEffect, useState } from "react";

type SiteStatsForm = {
  studentsGuided: number;
  provincesReached: number;
  volunteers: number;
};

const EMPTY_FORM: SiteStatsForm = {
  studentsGuided: 9000,
  provincesReached: 5,
  volunteers: 100,
};

export default function SiteSettingsPage() {
  const [form, setForm] = useState<SiteStatsForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/site-stats");
      if (!res.ok) return;
      const rows = await res.json();
      const values = rows.reduce(
        (acc: Record<string, number>, row: { key: string; value: number }) => {
          acc[row.key] = Number(row.value ?? 0);
          return acc;
        },
        {}
      );

      setForm({
        studentsGuided: values.students_guided ?? 9000,
        provincesReached: values.provinces_reached ?? 5,
        volunteers: values.volunteers ?? 100,
      });
    }

    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/site-stats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        students_guided: form.studentsGuided,
        provinces_reached: form.provincesReached,
        volunteers: form.volunteers,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Unable to save site statistics.");
      return;
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[#16324F]">
        Site Settings
      </h1>
      <p className="mt-1 text-sm text-[#16324F]/60">
        Update the numbers shown on the homepage hero section.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-xl rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6"
      >
        <div className="grid gap-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
              Students Guided
            </label>
            <input
              type="number"
              min={0}
              value={form.studentsGuided}
              onChange={(e) =>
                setForm({ ...form, studentsGuided: Number(e.target.value || 0) })
              }
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
              Provinces Reached
            </label>
            <input
              type="number"
              min={0}
              value={form.provincesReached}
              onChange={(e) =>
                setForm({ ...form, provincesReached: Number(e.target.value || 0) })
              }
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70">
              Volunteers
            </label>
            <input
              type="number"
              min={0}
              value={form.volunteers}
              onChange={(e) =>
                setForm({ ...form, volunteers: Number(e.target.value || 0) })
              }
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-full bg-[#16324F] px-5 py-2.5 text-sm font-medium tracking-wide text-[#F3F1EA] transition-colors hover:bg-[#1D3F63] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

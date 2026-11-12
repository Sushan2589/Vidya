"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Eye } from "lucide-react";

interface StatsForm {
  studentsGuided: number | string;
  provincesReached: number | string;
  volunteers: number | string;
}

const DEFAULT_FORM: StatsForm = {
  studentsGuided: 11500,
  provincesReached: 6,
  volunteers: 120,
};

export default function SiteStatsAdminPage() {
  const [form, setForm] = useState<StatsForm>(DEFAULT_FORM);
  const [initialData, setInitialData] = useState<StatsForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        const loaded: StatsForm = {
          studentsGuided: data.studentsGuided ?? 11500,
          provincesReached: data.provincesReached ?? 6,
          volunteers: data.volunteers ?? 120,
        };
        setForm(loaded);
        setInitialData(loaded);
      } else {
        setError("Failed to load statistics from the server.");
      }
    } catch {
      setError("Network error while loading statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, [loadStats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      studentsGuided: Number(form.studentsGuided),
      provincesReached: Number(form.provincesReached),
      volunteers: Number(form.volunteers),
    };

    if (
      isNaN(payload.studentsGuided) ||
      payload.studentsGuided < 0 ||
      isNaN(payload.provincesReached) ||
      payload.provincesReached < 1 ||
      payload.provincesReached > 7 ||
      isNaN(payload.volunteers) ||
      payload.volunteers < 0
    ) {
      setError("Please check the numbers: Provinces must be 1-7, and values cannot be negative.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update statistics.");
      } else {
        setSuccess("Hero statistics have been successfully updated!");
        setInitialData(payload);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch {
      setError("Network error while saving statistics.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(initialData);
    setError(null);
    setSuccess(null);
  }

  const studentsNum = Number(form.studentsGuided) || 0;
  const provincesNum = Number(form.provincesReached) || 0;
  const volunteersNum = Number(form.volunteers) || 0;

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium text-[#16324F]">
            Site Statistics
          </h1>
          <p className="mt-1 text-sm text-[#16324F]/60">
            Control the highlight numbers displayed on the homepage Hero section.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#16324F]/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#16324F] transition-colors hover:bg-white disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="size-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#16324F]/10 bg-[#ddddd6] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#16324F]/70">
          <Eye className="size-4 text-[#C9A227]" />
          <span>Live Homepage Hero Preview</span>
        </div>

        <div className="rounded-xl border border-[#16324F]/10 bg-[#F3F1EA] py-8 px-4">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-y-0">
            {/* Students Guided */}
            <div className="flex flex-col items-center px-4 sm:border-r sm:border-[#16324F]/10">
              <div className="font-serif text-3xl font-medium tracking-tight text-[#16324F] sm:text-4xl">
                {studentsNum.toLocaleString()}+
              </div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
                Students Guided
              </p>
            </div>

            {/* Provinces Reached */}
            <div className="flex flex-col items-center px-4 sm:border-r sm:border-[#16324F]/10">
              <div className="font-serif text-3xl font-medium tracking-tight text-[#16324F] sm:text-4xl">
                {provincesNum}
              </div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
                Provinces Reached
              </p>
            </div>

            {/* Volunteers */}
            <div className="flex flex-col items-center px-4">
              <div className="font-serif text-3xl font-medium tracking-tight text-[#16324F] sm:text-4xl">
                {volunteersNum.toLocaleString()}+
              </div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#16324F]/50 sm:text-[11px]">
                Volunteers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-6 sm:p-8"
      >
        <h2 className="font-serif text-xl font-medium text-[#16324F]">
          Update Numbers
        </h2>
        <p className="mt-1 text-xs text-[#16324F]/60">
          Enter integer values for each metric. The &apos;+&apos; suffix is added automatically where appropriate.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Students Guided Input */}
          <div>
            <label
              htmlFor="studentsGuided"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#16324F]/70"
            >
              Students Guided
            </label>
            <input
              id="studentsGuided"
              type="number"
              min="0"
              step="1"
              required
              value={form.studentsGuided}
              onChange={(e) =>
                setForm({ ...form, studentsGuided: e.target.value })
              }
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-base font-medium text-[#16324F] outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
              placeholder="11500"
            />
            <p className="mt-1.5 text-[11px] text-[#16324F]/50">
              Displays as &quot;{studentsNum.toLocaleString()}+&quot;
            </p>
          </div>

          {/* Provinces Reached Input */}
          <div>
            <label
              htmlFor="provincesReached"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#16324F]/70"
            >
              Provinces Reached
            </label>
            <input
              id="provincesReached"
              type="number"
              min="1"
              max="7"
              step="1"
              required
              value={form.provincesReached}
              onChange={(e) =>
                setForm({ ...form, provincesReached: e.target.value })
              }
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-base font-medium text-[#16324F] outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
              placeholder="6"
            />
            <p className="mt-1.5 text-[11px] text-[#16324F]/50">
              Total provinces in Nepal (1 to 7)
            </p>
          </div>

          {/* Volunteers Input */}
          <div>
            <label
              htmlFor="volunteers"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#16324F]/70"
            >
              Volunteers
            </label>
            <input
              id="volunteers"
              type="number"
              min="0"
              step="1"
              required
              value={form.volunteers}
              onChange={(e) => setForm({ ...form, volunteers: e.target.value })}
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-base font-medium text-[#16324F] outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
              placeholder="120"
            />
            <p className="mt-1.5 text-[11px] text-[#16324F]/50">
              Displays as &quot;{volunteersNum.toLocaleString()}+&quot;
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#16324F]/10 pt-6">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || loading}
            className="rounded-lg border border-[#16324F]/20 px-4 py-2 text-sm font-medium text-[#16324F] transition-colors hover:bg-[#16324F]/5 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16324F] px-5 py-2 text-sm font-medium text-[#F3F1EA] shadow-sm transition-colors hover:bg-[#16324F]/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


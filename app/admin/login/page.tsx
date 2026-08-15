"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Try again.");
      return;
    }

    router.push(params.get("from") || "/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#ddddd6] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#16324F]/10 bg-[#F3F1EA] p-8 shadow-sm">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[#16324F]/55">
          Vidya Admin
        </p>
        <h1 className="mt-2 text-center font-serif text-3xl font-medium text-[#16324F]">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#16324F]/70"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#16324F]/20 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-[#16324F] px-5 py-2.5 text-sm font-medium tracking-wide text-[#F3F1EA] transition-colors hover:bg-[#1D3F63] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogListing, BlogPost, BlogPostSummary } from "@/lib/blog/types";
import { postToInput } from "@/lib/blog/forms";
import { formatBlogDate } from "@/lib/blog/seo";
import { adminButtonClass, adminInputClass, adminRequest } from "./api";

export function BlogAdminList({
  listing,
  search,
  status,
}: {
  listing: BlogListing;
  search: string;
  status?: "draft" | "published";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  async function mutate(post: BlogPostSummary, remove = false) {
    if (remove && !confirm(`Delete “${post.title}”? This cannot be undone.`))
      return;
    if (
      !remove &&
      !confirm(
        `Unpublish “${post.title}”? It will remain saved as a private draft.`,
      )
    )
      return;
    setBusy(post.id);
    setError("");
    try {
      if (remove)
        await adminRequest(`/api/admin/blog/${post.id}`, {
          method: "DELETE",
          body: JSON.stringify({ version: post.version }),
        });
      else {
        const current = await adminRequest<BlogPost>(
          `/api/admin/blog/${post.id}`,
        );
        await adminRequest(`/api/admin/blog/${post.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...postToInput(current),
            version: post.version,
            status: "draft",
          }),
        });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setBusy(null);
    }
  }
  function pageHref(page: number) {
    const query = new URLSearchParams({ page: String(page) });
    if (search) query.set("q", search);
    if (status) query.set("status", status);
    return `/admin/blog?${query}`;
  }
  return (
    <div className="text-[#16324F]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Blog</h1>
          <p className="mt-2 text-sm text-[#16324F]/75">
            Manage private drafts and published articles. {listing.total}{" "}
            {status || "total"} articles.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/blog/categories"
            className="rounded-full border border-[#16324F]/25 px-5 py-2.5 text-sm"
          >
            Categories
          </Link>
          <Link href="/admin/blog/new" className={adminButtonClass}>
            New article
          </Link>
        </div>
      </div>
      <p className="mt-5 rounded-xl bg-[#F3F1EA] p-4 text-sm">
        Start an article and save a private draft at any time. Use{" "}
        <strong>Review &amp; publish</strong> in the editor when it is ready for
        readers.
      </p>
      <nav
        aria-label="Article status"
        className="mt-6 flex flex-wrap gap-2 text-sm"
      >
        {[
          { label: "All articles", value: "" },
          { label: "Drafts · private", value: "draft" },
          { label: "Published · public", value: "published" },
        ].map((tab) => {
          const query = new URLSearchParams();
          if (tab.value) query.set("status", tab.value);
          if (search) query.set("q", search);
          const active = (status || "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/blog${query.size ? `?${query}` : ""}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2 ${active ? "border-[#16324F] bg-[#16324F] text-white" : "border-[#16324F]/20"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <form
        method="get"
        action="/admin/blog"
        className="mt-7 flex max-w-md gap-2"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <label className="sr-only" htmlFor="admin-blog-search">
          Search articles
        </label>
        <input
          id="admin-blog-search"
          type="search"
          name="q"
          maxLength={120}
          defaultValue={search}
          placeholder="Search articles…"
          className={adminInputClass}
        />
        <button className={adminButtonClass} type="submit">
          Search
        </button>
      </form>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <ul className="mt-7 space-y-4">
        {listing.posts.map((post) => (
          <li
            key={post.id}
            className="flex flex-col gap-5 rounded-2xl border border-[#16324F]/15 bg-[#F3F1EA] p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-widest">
                <span
                  className={`rounded-full px-2.5 py-1 ${post.status === "published" ? "bg-green-100 text-green-900" : "bg-[#16324F]/10"}`}
                >
                  {post.status}
                </span>
                {post.featured && (
                  <span className="rounded-full bg-[#C9A227]/20 px-2.5 py-1">
                    Featured
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-serif text-2xl">
                <Link href={`/admin/blog/${post.id}/edit`}>{post.title}</Link>
              </h2>
              <p className="mt-2 text-xs text-[#16324F]/75">
                {post.categoryName} · {post.author} · Updated{" "}
                {formatBlogDate(post.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href={`/admin/blog/${post.id}/edit`} className="underline">
                {post.status === "draft" ? "Edit draft" : "Edit article"}
              </Link>
              <Link
                href={`/admin/blog/${post.id}/preview`}
                className="underline"
              >
                {post.status === "draft" ? "Preview draft" : "Preview"}
              </Link>
              {post.status === "draft" ? (
                <Link
                  href={`/admin/blog/${post.id}/edit?review=1`}
                  className="rounded-full border border-[#16324F]/25 px-4 py-2"
                >
                  Review &amp; publish
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void mutate(post)}
                  className="rounded-full border border-[#16324F]/25 px-4 py-2 disabled:opacity-50"
                >
                  {busy === post.id ? "Working…" : "Unpublish"}
                </button>
              )}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void mutate(post, true)}
                className="text-red-800 underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!listing.posts.length && (
        <div className="mt-7 rounded-2xl bg-[#F3F1EA] p-10 text-center">
          <h2 className="font-serif text-2xl">
            {search ? "No matching articles" : "Start the journal"}
          </h2>
          <p className="mt-3 text-sm">
            {search
              ? "Try a different search."
              : status
                ? "There are no articles with this status yet."
                : "Write your first story. You can create its category inside the editor."}
          </p>
        </div>
      )}
      {listing.pages > 1 && (
        <nav
          aria-label="Admin article pagination"
          className="mt-7 flex items-center justify-between text-sm"
        >
          {listing.page > 1 ? (
            <Link href={pageHref(listing.page - 1)}>Previous</Link>
          ) : (
            <span />
          )}
          <span>
            Page {listing.page} of {listing.pages}
          </span>
          {listing.page < listing.pages ? (
            <Link href={pageHref(listing.page + 1)}>Next</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

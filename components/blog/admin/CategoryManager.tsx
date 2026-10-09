"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogCategory } from "@/lib/blog/types";
import { slugifyBlog } from "@/lib/blog/content";
import { adminButtonClass, adminInputClass, adminRequest } from "./api";

export function CategoryManager({
  categories,
}: {
  categories: BlogCategory[];
}) {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function reset() {
    setId(null);
    setName("");
    setSlug("");
    setSlugEdited(false);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/api/admin/blog/categories${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ name, slug }),
      });
      reset();
      setMessage("Category saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(category: BlogCategory) {
    if (!confirm(`Delete category “${category.name}”?`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/api/admin/blog/categories/${category.id}`, {
        method: "DELETE",
      });
      if (id === category.id) reset();
      setMessage("Category deleted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-3xl text-[#16324F]">
      <Link href="/admin/blog" className="text-sm underline">
        Back to blog management
      </Link>
      <h1 className="mt-6 font-serif text-3xl">Blog categories</h1>
      <p className="mt-2 text-sm text-[#16324F]/75">
        Organize articles. Categories in use cannot be deleted.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-5 text-sm text-green-800">
          {message}
        </p>
      )}
      <form
        onSubmit={save}
        className="mt-7 space-y-4 rounded-2xl border border-[#16324F]/15 bg-[#F3F1EA] p-6"
      >
        <fieldset disabled={busy} className="space-y-4">
          <legend className="mb-4 font-serif text-xl">
            {id ? "Edit category" : "Create category"}
          </legend>
          <label className="block text-sm">
            Name
            <input
              required
              maxLength={80}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugEdited) setSlug(slugifyBlog(event.target.value));
              }}
              className={`${adminInputClass} mt-2`}
            />
          </label>
          <label className="block text-sm">
            Slug
            <input
              required
              maxLength={120}
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
              className={`${adminInputClass} mt-2`}
            />
          </label>
          <div className="flex gap-3">
            <button className={adminButtonClass} type="submit">
              {busy ? "Saving…" : "Save category"}
            </button>
            {id && (
              <button
                type="button"
                onClick={reset}
                className="text-sm underline"
              >
                Cancel
              </button>
            )}
          </div>
        </fieldset>
      </form>
      <ul className="mt-7 space-y-3">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#F3F1EA] p-4"
          >
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="mt-1 text-xs text-[#16324F]/75">
                {category.slug} · {category.postCount} articles
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setId(category.id);
                  setName(category.name);
                  setSlug(category.slug);
                  setSlugEdited(true);
                  setMessage("");
                }}
                className="underline"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy || category.postCount > 0}
                onClick={() => void remove(category)}
                className="text-red-800 underline disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Eye, Save } from "lucide-react";
import { ArticleView } from "../ArticleView";
import { BlogImage } from "../BlogImage";
import type { BlogCategory, BlogPost } from "@/lib/blog/types";
import {
  EMPTY_CONTENT,
  contentText,
  readingMinutes,
  slugifyBlog,
} from "@/lib/blog/content";
import {
  blogPostSchema,
  categorySchema,
  type BlogPostInput,
} from "@/lib/validations/blog";
import { postToInput } from "@/lib/blog/forms";
import { adminButtonClass, adminInputClass, adminRequest } from "./api";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => (
    <p role="status" className="p-6 text-sm">
      Loading editor…
    </p>
  ),
});

export function BlogEditorForm({
  initialPost,
  categories,
  username,
  reviewInitially = false,
}: {
  initialPost?: BlogPost;
  categories: BlogCategory[];
  username: string;
  reviewInitially?: boolean;
}) {
  const [postId, setPostId] = useState(initialPost?.id);
  const [form, setForm] = useState<BlogPostInput>(() =>
    initialPost
      ? postToInput(initialPost)
      : {
          title: "",
          slug: "",
          excerpt: "",
          content: EMPTY_CONTENT,
          author: username,
          categoryId: categories[0]?.id || 0,
          imageId: null,
          imageAlt: "",
          status: "draft",
          featured: false,
          seoTitle: "",
          seoDescription: "",
        },
  );
  const [options, setOptions] = useState(categories);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [slugEdited, setSlugEdited] = useState(!!initialPost);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [preview, setPreview] = useState(reviewInitially);
  const [review, setReview] = useState(reviewInitially);
  const [savedSlug, setSavedSlug] = useState(initialPost?.slug || "");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState(initialPost?.updatedAt);
  const [publishedAt, setPublishedAt] = useState(
    initialPost?.publishedAt || null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const busy = saving || uploading || inlineUploading || categoryBusy;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change<K extends keyof BlogPostInput>(
    key: K,
    value: BlogPostInput[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
    setFields((previous) => ({ ...previous, [key]: "" }));
    setMessage("");
    setError("");
  }
  function focusField(key: string) {
    setPreview(false);
    requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>(
        `[data-field="${key}"]`,
      );
      const details = target?.closest("details");
      if (details) details.open = true;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target
        ?.querySelector<HTMLElement>(
          "input,textarea,select,[contenteditable=true]",
        )
        ?.focus();
    });
  }
  async function save(status: "draft" | "published") {
    if (busy) return;
    setError("");
    setMessage("");
    setFields({});
    const parsed = blogPostSchema.safeParse({ ...form, status });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "content");
        errors[key] =
          issue.code === "unrecognized_keys" ||
          (key === "content" && issue.code !== "custom")
            ? "Some pasted formatting is unsupported. Remove that formatting and try again."
            : issue.message;
      }
      setFields(errors);
      setError(
        status === "published"
          ? "Complete the highlighted items before publishing. Your edits are still here."
          : "Complete the highlighted items to save your draft.",
      );
      focusField(Object.keys(errors)[0]);
      return;
    }
    setSaving(true);
    try {
      const saved = await adminRequest<BlogPost>(
        postId ? `/api/admin/blog/${postId}` : "/api/admin/blog",
        {
          method: postId ? "PUT" : "POST",
          body: JSON.stringify(parsed.data),
        },
      );
      setForm(postToInput(saved));
      setPostId(saved.id);
      setDirty(false);
      setLastSaved(saved.updatedAt);
      setPublishedAt(saved.publishedAt);
      setSavedSlug(saved.slug);
      if (status === "published") setSlugEdited(true);
      setMessage(
        status === "published"
          ? "Article published. It is now visible on the public blog."
          : "Draft saved. It is private and available in your article list.",
      );
      setReview(false);
      // Keep confirmed save feedback intact without a second remote navigation.
      if (!postId)
        window.history.replaceState(null, "", `/admin/blog/${saved.id}/edit`);
    } catch (err) {
      setError(
        `${err instanceof Error ? err.message : "Unable to save article."} Your edits are still in this editor.`,
      );
    } finally {
      setSaving(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.set("file", file);
      const media = await adminRequest<{ id: string }>(
        "/api/admin/blog/media",
        { method: "POST", body: data },
      );
      change("imageId", media.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed. Your article edits have not changed.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function addCategory() {
    const parsed = categorySchema.safeParse({
      name: newCategory,
      slug: slugifyBlog(newCategory),
    });
    if (!parsed.success) {
      setCategoryError("Enter a category name using letters or numbers.");
      return;
    }
    setCategoryBusy(true);
    setCategoryError("");
    try {
      const created = await adminRequest<BlogCategory>(
        "/api/admin/blog/categories",
        { method: "POST", body: JSON.stringify(parsed.data) },
      );
      setOptions((previous) =>
        [...previous, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      change("categoryId", created.id);
      setAddingCategory(false);
      setNewCategory("");
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Unable to create category.",
      );
    } finally {
      setCategoryBusy(false);
    }
  }
  const category = options.find((item) => item.id === form.categoryId);
  const checklist = [
    { key: "title", label: "Article title", ready: !!form.title.trim() },
    { key: "categoryId", label: "Category", ready: !!category },
    { key: "author", label: "Author name", ready: !!form.author.trim() },
    {
      key: "content",
      label: "Article content",
      ready: !!contentText(form.content).trim(),
    },
    {
      key: "excerpt",
      label: "Short introduction",
      ready: !!form.excerpt.trim(),
    },
    { key: "imageId", label: "Cover image", ready: !!form.imageId },
    {
      key: "imageAlt",
      label: "Image description",
      ready: !!form.imageAlt.trim(),
    },
  ];
  const readyToPublish = checklist.every((item) => item.ready);
  const previewPost: BlogPost = {
    ...form,
    id: postId || 0,
    categoryName: category?.name || "Uncategorized",
    categorySlug: category?.slug || "",
    readingMinutes: readingMinutes(form.content),
    publishedAt,
    createdAt: initialPost?.createdAt || 0,
    updatedAt: lastSaved || 0,
    version: form.version || 1,
    status: "draft",
  };
  const fieldError = (key: string) =>
    fields[key] ? (
      <p id={`${key}-error`} className="mt-2 text-xs text-red-800">
        {fields[key]}
      </p>
    ) : null;
  const invalid = (key: string) => ({
    "aria-invalid": !!fields[key],
    "aria-describedby": fields[key] ? `${key}-error` : undefined,
  });
  return (
    <div className="max-w-6xl pb-10 text-[#16324F]">
      <Link
        href="/admin/blog"
        onClick={(event) => {
          if (dirty && !confirm("Leave without saving your changes?"))
            event.preventDefault();
        }}
        className="inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        All articles
      </Link>
      <div className="mb-6 mt-6">
        <h1 className="font-serif text-3xl">
          {postId ? "Edit article" : "Create an article"}
        </h1>
        <p className="mt-2 text-sm text-[#16324F]/75">
          Write your story, save it privately, then review it before publishing.
        </p>
      </div>
      <div className="sticky top-0 z-20 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#16324F]/15 bg-[#F3F1EA]/95 p-4 shadow-sm backdrop-blur">
        <div role="status" aria-live="polite" className="text-sm">
          <span className="font-semibold">
            {form.status === "published"
              ? "Published · public"
              : "Draft · private"}
          </span>
          <p className="mt-1 text-xs text-[#16324F]/70">
            {saving
              ? "Saving…"
              : uploading || inlineUploading
                ? "Uploading image…"
                : dirty
                  ? "Unsaved changes"
                  : lastSaved
                    ? `Saved · ${new Date(lastSaved).toLocaleTimeString("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", hour12: false })} NPT`
                    : "Not saved yet"}{" "}
            · {readingMinutes(form.content)} min read
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPreview(!preview);
              setReview(false);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#16324F]/25 px-4 py-2 text-sm disabled:opacity-50"
          >
            <Eye className="size-4" />
            {preview ? "Return to editor" : "Preview"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(form.status)}
            className={adminButtonClass}
          >
            <Save className="size-4" />
            {saving
              ? "Saving…"
              : form.status === "published"
                ? "Save changes"
                : "Save draft"}
          </button>
          {form.status === "draft" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPreview(true);
                setReview(true);
              }}
              className="rounded-full border border-[#866a15] bg-[#C9A227]/15 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Review &amp; publish
            </button>
          )}
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          {message}{" "}
          <Link href="/admin/blog" className="font-medium underline">
            View all articles
          </Link>
        </p>
      )}
      {review && (
        <section
          aria-label="Review publication"
          className="mb-6 rounded-2xl border border-[#C9A227]/50 bg-[#F3F1EA] p-5"
        >
          <h2 className="font-serif text-2xl">Ready to publish?</h2>
          <p className="mt-2 text-sm">
            Publishing makes this article visible to everyone. You can save a
            draft while these items are incomplete.
          </p>
          <ul className="my-4 grid gap-2 text-sm sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => focusField(item.key)}
                  className="flex items-center gap-2 text-left underline decoration-[#16324F]/25 underline-offset-4"
                >
                  {item.ready ? (
                    <Check className="size-4 text-green-700" />
                  ) : (
                    <span className="size-4 rounded-full border border-[#866a15]" />
                  )}
                  <span>
                    {item.label}
                    {item.ready ? " — ready" : " — add this"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !readyToPublish}
              onClick={() => void save("published")}
              className={adminButtonClass}
            >
              Publish article
            </button>
            <button
              type="button"
              onClick={() => {
                setReview(false);
                setPreview(false);
              }}
              className="text-sm underline"
            >
              Keep editing
            </button>
          </div>
        </section>
      )}
      {preview && (
        <div className="mb-8 rounded-2xl bg-[#ddddd6] p-6 sm:p-10">
          <p className="mb-5 text-sm">
            Preview of your current edits. Nothing is published by previewing.
          </p>
          <ArticleView post={previewPost} preview />
        </div>
      )}
      <form
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save(form.status);
        }}
        className={
          preview
            ? "hidden"
            : "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        }
      >
        <fieldset
          disabled={busy}
          className="min-w-0 space-y-6 rounded-2xl border border-[#16324F]/15 bg-white/50 p-5 sm:p-6"
        >
          <legend className="sr-only">Write your article</legend>
          <h2 className="font-serif text-2xl">1. Write your article</h2>
          <label data-field="title" className="block text-sm font-medium">
            Title
            <input
              {...invalid("title")}
              maxLength={180}
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                change("title", title);
                if (!slugEdited)
                  setForm((previous) => ({
                    ...previous,
                    slug: slugifyBlog(title),
                  }));
              }}
              className={`${adminInputClass} mt-2`}
              placeholder="Give your story a clear title"
            />
            {fieldError("title")}
          </label>
          <label data-field="excerpt" className="block text-sm font-medium">
            Short introduction
            <textarea
              {...invalid("excerpt")}
              rows={3}
              maxLength={320}
              value={form.excerpt}
              onChange={(event) => change("excerpt", event.target.value)}
              className={`${adminInputClass} mt-2`}
              placeholder="What will readers learn from this article?"
            />
            <span className="mt-1 block text-xs font-normal text-[#16324F]/70">
              Shown on article cards. Required to publish, optional for drafts.{" "}
              {form.excerpt.length}/320
            </span>
            {fieldError("excerpt")}
          </label>
          <div data-field="content">
            <p className="mb-2 text-sm font-medium">Article content</p>
            <RichTextEditor
              initialContent={form.content}
              onChange={(content) => change("content", content)}
              disabled={saving || uploading || categoryBusy}
              onUploadState={setInlineUploading}
            />
            {fieldError("content")}
          </div>
          <section className="border-t border-[#16324F]/15 pt-6">
            <h2 className="font-serif text-2xl">2. Add a cover image</h2>
            <p className="mt-2 text-xs text-[#16324F]/70">
              Used on blog listing cards and social previews. Article pages show
              only the images you add to the content below. You can add this after saving a draft.
            </p>
            <label
              data-field="imageId"
              className="mt-4 block text-sm font-medium"
            >
              Featured image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block w-full text-sm"
                onChange={(event) => {
                  void upload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span className="mt-2 block text-xs font-normal text-[#16324F]/70">
                JPEG, PNG or WebP · up to 5 MB
              </span>
              {fieldError("imageId")}
            </label>
            {form.imageId && (
              <div className="mt-4">
                <div className="relative aspect-[16/10] max-w-md overflow-hidden rounded-xl">
                  <BlogImage
                    key={form.imageId}
                    src={`/api/blog/media/${form.imageId}`}
                    alt={form.imageAlt || "Featured image preview"}
                    fill
                    sizes="(max-width: 640px) 90vw, 448px"
                    className="object-cover"
                    showRetry
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    change("imageId", null);
                    change("imageAlt", "");
                  }}
                  className="mt-2 text-xs underline"
                >
                  Remove cover image
                </button>
              </div>
            )}
            <label
              data-field="imageAlt"
              className="mt-4 block text-sm font-medium"
            >
              Image description (alt text)
              <input
                {...invalid("imageAlt")}
                maxLength={300}
                value={form.imageAlt}
                onChange={(event) => change("imageAlt", event.target.value)}
                className={`${adminInputClass} mt-2`}
                placeholder="Describe the image for readers who cannot see it"
              />
              {fieldError("imageAlt")}
            </label>
          </section>
        </fieldset>
        <fieldset
          disabled={busy}
          className="min-w-0 space-y-5 rounded-2xl border border-[#16324F]/15 bg-[#F3F1EA] p-5"
        >
          <legend className="sr-only">Article details</legend>
          <h2 className="font-serif text-2xl">3. Article details</h2>
          <label data-field="categoryId" className="block text-sm font-medium">
            Category
            <select
              {...invalid("categoryId")}
              value={form.categoryId || ""}
              onChange={(event) =>
                change("categoryId", Number(event.target.value))
              }
              className={`${adminInputClass} mt-2`}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {fieldError("categoryId")}
          </label>
          <button
            type="button"
            onClick={() => setAddingCategory(!addingCategory)}
            className="text-xs underline"
          >
            {addingCategory ? "Cancel new category" : "+ New category"}
          </button>
          {addingCategory && (
            <div className="rounded-xl border border-[#16324F]/15 bg-white p-3">
              <label className="block text-sm">
                New category name
                <input
                  maxLength={80}
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addCategory();
                    }
                  }}
                  className={`${adminInputClass} mt-2`}
                />
              </label>
              {categoryError && (
                <p role="alert" className="mt-2 text-xs text-red-800">
                  {categoryError}
                </p>
              )}
              <button
                type="button"
                disabled={categoryBusy}
                onClick={() => void addCategory()}
                className={`${adminButtonClass} mt-3`}
              >
                {categoryBusy ? "Adding…" : "Add category"}
              </button>
            </div>
          )}
          {!options.length && (
            <p className="text-xs text-[#16324F]/75">
              Add your first category here to save this article.
            </p>
          )}
          <label data-field="author" className="block text-sm font-medium">
            Author
            <input
              {...invalid("author")}
              maxLength={100}
              value={form.author}
              onChange={(event) => change("author", event.target.value)}
              className={`${adminInputClass} mt-2`}
            />
            {fieldError("author")}
          </label>
          <details className="border-t border-[#16324F]/15 pt-4">
            <summary className="cursor-pointer text-sm font-medium">
              URL &amp; search appearance (optional)
            </summary>
            <p className="mt-3 text-xs text-[#16324F]/70">
              The URL comes from your title. Search engines use your title and
              introduction unless you customize them.
            </p>
            <label data-field="slug" className="mt-4 block text-sm">
              URL slug
              <input
                {...invalid("slug")}
                maxLength={120}
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  change("slug", event.target.value);
                }}
                className={`${adminInputClass} mt-2`}
              />
              <span className="mt-1 block break-all text-xs">
                /blog/{form.slug || "your-article"}
              </span>
              {fieldError("slug")}
            </label>
            {publishedAt && (
              <p className="mt-2 text-xs">
                Changing a published URL breaks existing shared links.
              </p>
            )}
            <label className="mt-4 block text-sm">
              SEO title
              <input
                maxLength={70}
                value={form.seoTitle}
                onChange={(event) => change("seoTitle", event.target.value)}
                className={`${adminInputClass} mt-2`}
                placeholder="Uses your title"
              />
            </label>
            <label className="mt-4 block text-sm">
              SEO description
              <textarea
                rows={3}
                maxLength={180}
                value={form.seoDescription}
                onChange={(event) =>
                  change("seoDescription", event.target.value)
                }
                className={`${adminInputClass} mt-2`}
                placeholder="Uses your introduction"
              />
            </label>
          </details>
          {form.status === "published" && (
            <div className="border-t border-[#16324F]/15 pt-4">
              <Link
                href={`/blog/${savedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                View public article
              </Link>
              <p className="mt-3 text-xs">
                Saving changes updates the public article immediately.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Remove this article from the public blog and keep it as a private draft?",
                    )
                  )
                    void save("draft");
                }}
                className="mt-3 text-sm underline"
              >
                Unpublish to draft
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BlogPost } from "@/lib/blog/types";
import { formatBlogDate } from "@/lib/blog/seo";
import { ArticleContent } from "./ArticleContent";

export function ArticleView({
  post,
  preview = false,
}: {
  post: BlogPost;
  preview?: boolean;
}) {
  return (
    <article className="mx-auto max-w-4xl">
      <Link
        href={preview ? "/admin/blog" : "/blog"}
        className="inline-flex items-center gap-2 rounded-sm text-sm text-[#16324F]/75 hover:text-[#16324F]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {preview ? "Back to blog management" : "Back to all articles"}
      </Link>
      {preview && (
        <p className="mt-6 rounded-xl border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-3 text-sm text-[#16324F]">
          Private preview ·{" "}
          {post.status === "draft"
            ? "This draft is not visible to readers."
            : "This article is published."}
        </p>
      )}
      <header className="py-9 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#866a15]">
          {post.categoryName}
        </p>
        <h1 className="mt-4 text-balance font-serif text-4xl leading-[1.1] text-[#16324F] sm:text-5xl lg:text-6xl">
          {post.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#16324F]/75">
          {post.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#16324F]/75">
          <span>By {post.author}</span>
          <span aria-hidden="true">·</span>
          {post.publishedAt ? (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatBlogDate(post.publishedAt)}
            </time>
          ) : (
            <span>Unpublished draft</span>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl">
        <ArticleContent content={post.content} />
      </div>
    </article>
  );
}

import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { BlogImage } from "./BlogImage";
import type { BlogPostSummary } from "@/lib/blog/types";
import { formatBlogDate } from "@/lib/blog/seo";

export function ArticleCard({
  post,
  featured = false,
}: {
  post: BlogPostSummary;
  featured?: boolean;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-[#16324F]/12 bg-[#F3F1EA] ${featured ? "grid md:grid-cols-2" : "flex flex-col"}`}
    >
      <Link
        href={`/blog/${encodeURIComponent(post.slug)}`}
        tabIndex={-1}
        aria-hidden="true"
        className={`relative block overflow-hidden bg-[#16324F]/5 ${featured ? "min-h-64 md:min-h-96" : "aspect-[16/10]"}`}
      >
        {post.imageId ? (
          <BlogImage
            src={`/api/blog/media/${post.imageId}`}
            alt=""
            fill
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 50vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            preload={featured}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="size-12 text-[#C9A227]" strokeWidth={1} />
          </div>
        )}
      </Link>
      <div
        className={`flex flex-1 flex-col ${featured ? "justify-center p-7 sm:p-10" : "p-6"}`}
      >
        {featured && (
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#866a15]">
            Featured story
          </p>
        )}
        <p className="text-xs font-medium uppercase tracking-widest text-[#16324F]/70">
          {post.categoryName}
        </p>
        <h2
          className={`mt-3 font-serif leading-tight text-[#16324F] ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}
        >
          <Link
            href={`/blog/${encodeURIComponent(post.slug)}`}
            className="rounded-sm hover:text-[#866a15] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#866a15]"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#16324F]/75">
          {post.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#16324F]/70">
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatBlogDate(post.publishedAt)}
            </time>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <Link
          href={`/blog/${encodeURIComponent(post.slug)}`}
          className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#16324F]"
        >
          Read article{" "}
          <ArrowUpRight className="size-4 text-[#866a15]" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

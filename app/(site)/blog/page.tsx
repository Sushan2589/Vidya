import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { listCategories, listPosts } from "@/lib/blog/repository";
import { siteOrigin } from "@/lib/blog/seo";

export const dynamic = "force-dynamic";
type Params = { q?: string; category?: string; page?: string };
const description =
  "Ideas, practical guides and stories to help curious students discover Olympiads and academic opportunities in Nepal.";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Params>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(
    1,
    Number.parseInt(typeof params.page === "string" ? params.page : "1") || 1,
  );
  const url = `${siteOrigin()}/blog${page > 1 ? `?page=${page}` : ""}`;
  return {
    title: "Blog | VIDYA Olympiad",
    description,
    alternates: { canonical: url },
    robots:
      params.q || params.category ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "The VIDYA Journal",
      description,
      url,
      type: "website",
      siteName: "VIDYA",
    },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const search =
    typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const category =
    typeof params.category === "string" ? params.category.slice(0, 120) : "";
  const page =
    Number.parseInt(typeof params.page === "string" ? params.page : "1") || 1;
  const [listing, categories] = await Promise.all([
    listPosts({ search, category, page }),
    listCategories(true),
  ]);
  function href(nextPage: number, nextCategory = category) {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (nextCategory) query.set("category", nextCategory);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/blog${query.size ? `?${query}` : ""}`;
  }
  return (
    <main className="min-h-svh bg-[#ddddd6] px-6 pb-20 pt-36 text-[#16324F] sm:pt-44">
      <div className="mx-auto max-w-6xl">
        <section aria-labelledby="articles-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 id="articles-heading" className="font-serif text-3xl sm:text-4xl">
                Explore the journal
              </h1>
              <p className="mt-2 text-sm text-[#16324F]/70">
                {listing.total} {listing.total === 1 ? "article" : "articles"}
                {search ? ` matching “${search}”` : " to spark your next idea"}
              </p>
            </div>
            <form
              action="/blog"
              method="get"
              role="search"
              className="flex w-full gap-2 sm:max-w-sm"
            >
              <label htmlFor="blog-search" className="sr-only">
                Search articles
              </label>
              <input
                id="blog-search"
                name="q"
                type="search"
                maxLength={120}
                defaultValue={search}
                placeholder="Search the journal…"
                className="min-w-0 flex-1 rounded-full border border-[#16324F]/25 bg-[#F3F1EA] px-5 py-3 text-sm outline-none focus:border-[#866a15] focus:ring-2 focus:ring-[#C9A227]/30"
              />
              {category && (
                <input type="hidden" name="category" value={category} />
              )}
              <button
                type="submit"
                aria-label="Search articles"
                className="rounded-full bg-[#16324F] p-3 text-[#F3F1EA] hover:bg-[#1D3F63]"
              >
                <Search className="size-5" />
              </button>
            </form>
          </div>
          <nav
            aria-label="Filter by category"
            className="mb-8 mt-6 flex flex-wrap gap-2"
          >
            <Link
              href={href(1, "")}
              aria-current={!category ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm ${!category ? "border-[#16324F] bg-[#16324F] text-[#F3F1EA]" : "border-[#16324F]/20 hover:bg-[#F3F1EA]"}`}
            >
              All articles
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={href(1, item.slug)}
                aria-current={category === item.slug ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm ${category === item.slug ? "border-[#16324F] bg-[#16324F] text-[#F3F1EA]" : "border-[#16324F]/20 hover:bg-[#F3F1EA]"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          {listing.posts.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listing.posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#16324F]/15 bg-[#F3F1EA] px-6 py-16 text-center">
              <BookOpen
                className="mx-auto mb-5 size-10 text-[#866a15]"
                strokeWidth={1}
                aria-hidden="true"
              />
              <h3 className="font-serif text-2xl">
                {search || category
                  ? "No articles found"
                  : "Good stories take a little time"}
              </h3>
              <p className="mt-3 text-sm text-[#16324F]/75">
                {search || category
                  ? "Try another search or explore all articles."
                  : "Our first articles are on their way. Come back soon for ideas, guides and stories."}
              </p>
              {(search || category) && (
                <Link
                  href="/blog"
                  className="mt-6 inline-block rounded-full bg-[#16324F] px-5 py-2.5 text-sm text-[#F3F1EA]"
                >
                  Clear filters
                </Link>
              )}
            </div>
          )}
          {listing.pages > 1 && (
            <nav
              aria-label="Article pagination"
              className="mt-10 flex items-center justify-between gap-4"
            >
              {listing.page > 1 ? (
                <Link
                  href={href(listing.page - 1)}
                  rel="prev"
                  className="inline-flex items-center gap-2 rounded-full border border-[#16324F]/20 px-4 py-2 text-sm"
                >
                  <ArrowLeft className="size-4" />
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm">
                Page {listing.page} of {listing.pages}
              </span>
              {listing.page < listing.pages ? (
                <Link
                  href={href(listing.page + 1)}
                  rel="next"
                  className="inline-flex items-center gap-2 rounded-full border border-[#16324F]/20 px-4 py-2 text-sm"
                >
                  Next
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

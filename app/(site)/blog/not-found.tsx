import Link from "next/link";
export default function ArticleNotFound() {
  return (
    <main className="min-h-svh bg-[#ddddd6] px-6 py-44 text-center text-[#16324F]">
      <p className="text-xs uppercase tracking-widest text-[#866a15]">
        404 · Article not found
      </p>
      <h1 className="mt-4 font-serif text-4xl">There’s more to explore</h1>
      <p className="mt-4 text-sm">
        This article is unavailable or hasn’t been published yet.
      </p>
      <Link
        href="/blog"
        className="mt-8 inline-block rounded-full bg-[#16324F] px-6 py-3 text-sm text-[#F3F1EA]"
      >
        Explore the journal
      </Link>
    </main>
  );
}

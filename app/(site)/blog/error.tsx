"use client";
import Link from "next/link";

export default function BlogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-svh bg-[#ddddd6] px-6 py-44 text-center text-[#16324F]">
      <h1 className="font-serif text-4xl">
        The journal is temporarily unavailable
      </h1>
      <p role="alert" className="mx-auto mt-4 max-w-md text-sm leading-relaxed">
        We couldn’t load the articles. Please try again in a moment.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#16324F] px-6 py-3 text-sm text-[#F3F1EA]"
        >
          Try again
        </button>
        <Link
          href="/blog"
          className="rounded-full border border-[#16324F]/25 px-6 py-3 text-sm"
        >
          Back to blog
        </Link>
      </div>
    </main>
  );
}

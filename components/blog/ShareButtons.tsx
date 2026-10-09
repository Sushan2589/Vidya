"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [message, setMessage] = useState("");
  const encoded = encodeURIComponent(url);
  const linkClass =
    "rounded-full border border-[#16324F]/20 px-4 py-2 text-xs font-medium hover:bg-[#16324F]/5 focus-visible:outline-2 focus-visible:outline-offset-2";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Could not copy. Copy the address from your browser.");
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ url, title });
      else await copy();
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setMessage("Could not share. Try copying the link.");
    }
  }
  return (
    <div className="text-[#16324F]">
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="Share this article"
      >
        <button
          type="button"
          className={`${linkClass} inline-flex items-center gap-2`}
          onClick={share}
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share
        </button>
        <button
          type="button"
          className={`${linkClass} inline-flex items-center gap-2`}
          onClick={copy}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Copy link
        </button>
        <a
          className={linkClass}
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook<span className="sr-only"> (opens a new tab)</span>
        </a>
        <a
          className={linkClass}
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn<span className="sr-only"> (opens a new tab)</span>
        </a>
        <a
          className={linkClass}
          href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          X<span className="sr-only"> (opens a new tab)</span>
        </a>
      </div>
      <p role="status" className="mt-2 min-h-4 text-xs">
        {message}
      </p>
    </div>
  );
}

"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

// Our media endpoint checks publication/auth before returning each variant.
// This avoids putting private draft images into Next's public optimizer cache.
export function BlogImage({
  alt,
  showRetry = false,
  onError,
  ...props
}: Omit<ImageProps, "loader"> & { showRetry?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <Image
        key={attempt}
        {...props}
        alt={alt}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
        onLoad={() => setFailed(false)}
        loader={({ src, width }) =>
          `${src}?w=${Math.min(width, 1600)}${attempt ? `&retry=${attempt}` : ""}`
        }
      />
      {failed && showRetry && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F3F1EA] p-4 text-center text-sm text-[#16324F]"
          role="status"
        >
          <p>
            Image preview could not load. This does not change your saved
            article.
          </p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((previous) => previous + 1);
            }}
            className="rounded-full border border-[#16324F]/30 px-4 py-2 text-xs"
          >
            Retry image
          </button>
        </div>
      )}
    </>
  );
}

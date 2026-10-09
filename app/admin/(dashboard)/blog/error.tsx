"use client";
export default function BlogAdminError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-[#16324F]">
      <h1 className="font-serif text-3xl">Blog management is unavailable</h1>
      <p role="alert" className="mt-3 text-sm">
        Please try again. Your saved articles are unchanged.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-[#16324F] px-5 py-2.5 text-sm text-white"
      >
        Try again
      </button>
    </div>
  );
}

export default function BlogLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading articles"
      className="min-h-svh bg-[#ddddd6] px-6 py-36"
    >
      <div className="mx-auto max-w-6xl">
        <p role="status" className="mb-8 font-serif text-3xl text-[#16324F]">
          Opening the journal…
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((id) => (
            <div
              key={id}
              aria-hidden="true"
              className="h-96 animate-pulse rounded-2xl bg-[#16324F]/10 motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

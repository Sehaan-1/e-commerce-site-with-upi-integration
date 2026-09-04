export default function GlobalLoading() {
  return (
    <div className="animate-fade-in-up py-6" role="status" aria-label="Loading content">
      <span className="sr-only">Loading Kalpa Living...</span>

      {/* Hero skeleton */}
      <section className="grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="skeleton h-4 w-32 rounded-full" />
          <div className="skeleton h-12 w-4/5 rounded-xl sm:h-16" />
          <div className="skeleton h-6 w-full max-w-lg rounded-lg" />
          <div className="skeleton h-6 w-2/3 max-w-md rounded-lg" />
          <div className="flex gap-3 pt-4">
            <div className="skeleton h-12 w-40 rounded-xl" />
            <div className="skeleton h-12 w-36 rounded-xl" />
          </div>
        </div>
        <div className="hidden rounded-3xl p-8 lg:block">
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </section>

      {/* Categories & Filter Bar skeleton */}
      <section className="scroll-mt-20 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="skeleton h-8 w-44 rounded-lg" />
          <div className="flex flex-wrap gap-2">
            <div className="skeleton h-9 w-14 rounded-full" />
            <div className="skeleton h-9 w-20 rounded-full" />
            <div className="skeleton h-9 w-20 rounded-full" />
            <div className="skeleton h-9 w-20 rounded-full" />
            <div className="skeleton h-9 w-20 rounded-full" />
          </div>
        </div>

        {/* Product Cards Grid skeleton */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="card flex flex-col overflow-hidden border border-ink-900/10 bg-white"
            >
              {/* Product Image skeleton */}
              <div className="skeleton aspect-square w-full rounded-none" />
              {/* Card Details skeleton */}
              <div className="flex flex-1 flex-col p-4 space-y-2.5">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
                <div className="skeleton h-4 w-3/5 rounded" />
                <div className="pt-2">
                  <div className="skeleton h-5 w-20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

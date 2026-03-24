function SkeletonPill({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-12 rounded-full border border-black/10 bg-white/70 animate-pulse ${className}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-4">
      <div className="relative">
        <div className="aspect-[4/5] w-full rounded-2xl bg-black/5 animate-pulse" />
        <div className="absolute right-3 top-3 h-10 w-10 rounded-full border border-black/10 bg-white/80 animate-pulse" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-4 w-20 rounded bg-black/5 animate-pulse" />
        <div className="h-5 w-3/4 rounded bg-black/5 animate-pulse" />
        <div className="h-4 w-full rounded bg-black/5 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-black/5 animate-pulse" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#DBEBF1]/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-10">
        <div className="space-y-8">
          {/* Hero */}
          <section className="rounded-[32px] border border-black/10 bg-white px-6 py-10 sm:px-10 sm:py-12">
            <div className="h-5 w-12 rounded bg-black/5 animate-pulse" />
            <div className="mt-5 h-12 w-48 rounded bg-black/5 animate-pulse sm:h-16 sm:w-64" />
            <div className="mt-6 h-10 w-16 rounded-full bg-black/5 animate-pulse" />
          </section>

          {/* Filters */}
          <section className="rounded-[32px] border border-black/10 bg-white p-6 sm:p-8">
            <div className="h-5 w-16 rounded bg-black/5 animate-pulse" />

            <div className="mt-6 flex flex-wrap gap-3">
              <SkeletonPill className="w-16" />
              <SkeletonPill className="w-18" />
              <SkeletonPill className="w-20" />
              <SkeletonPill className="w-18" />
              <SkeletonPill className="w-18" />
              <SkeletonPill className="w-16" />
              <SkeletonPill className="w-18" />
              <SkeletonPill className="w-16" />
              <SkeletonPill className="w-24" />
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="h-12 w-36 rounded-full border border-black/10 bg-white/70 animate-pulse" />

              <div className="w-full max-w-md">
                <div className="mb-3 h-5 w-10 rounded bg-black/5 animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-12 flex-1 rounded-full border border-black/10 bg-white/70 animate-pulse" />
                  <div className="h-12 w-20 rounded-full bg-black/5 animate-pulse" />
                </div>
              </div>
            </div>
          </section>

          {/* Product Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

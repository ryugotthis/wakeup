function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/5 ${className}`} />;
}

function SidebarSkeleton() {
  return (
    <aside className="hidden rounded-3xl border border-black/10 bg-white p-4 lg:block lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="px-2 py-2">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="mt-2 h-6 w-24" />
      </div>

      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} className="h-10 w-full rounded-2xl" />
        ))}
      </div>

      <div className="my-4 h-px bg-black/10" />

      <div className="rounded-2xl bg-black/5 p-3">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="mt-2 h-4 w-3/4" />
        <SkeletonBox className="mt-4 h-10 w-full rounded-full" />
      </div>
    </aside>
  );
}

function ResultItemSkeleton() {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-2">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-4 w-24" />
      </div>
      <SkeletonBox className="h-10 w-16 rounded-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#DBEBF1]/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-10">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          {/* Sidebar */}
          <SidebarSkeleton />

          <section className="min-w-0 space-y-6">
            {/* Header */}
            <section className="rounded-3xl border border-black/10 bg-white p-8">
              <SkeletonBox className="h-5 w-24" />
              <SkeletonBox className="mt-4 h-10 w-64" />
              <SkeletonBox className="mt-4 h-4 w-48" />
            </section>

            {/* SKTI Results */}
            <section className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-5 w-24" />
                <SkeletonBox className="h-10 w-28 rounded-full" />
              </div>

              <div className="mt-6 divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ResultItemSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Recommendation */}
            <section>
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-5 w-16" />
                <SkeletonBox className="h-10 w-20 rounded-full" />
              </div>

              <SkeletonBox className="mt-2 h-8 w-40" />

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-black/10 bg-white p-4"
                  >
                    <SkeletonBox className="aspect-[4/5] w-full rounded-2xl" />
                    <div className="mt-4 space-y-2">
                      <SkeletonBox className="h-4 w-20" />
                      <SkeletonBox className="h-5 w-3/4" />
                      <SkeletonBox className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

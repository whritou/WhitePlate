import { Skeleton } from "@/components/ui/skeleton"

export function WorkspaceLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>

      <main
        aria-busy="true"
        data-skeleton-page="overview"
        className="min-h-[70vh]"
      >
        <div aria-hidden="true" className="grid gap-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-3">
              <Skeleton className="h-4 w-28" />

              <Skeleton className="h-9 w-56" />
            </div>

            <Skeleton className="h-10 w-32 rounded-lg" />
          </header>

          <section
            data-skeleton-region="overview-restaurant-orders"
            className="grid gap-4"
          >
            <Skeleton className="h-6 w-48" />

            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <Skeleton className="h-4 w-2/5" />

                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </section>

          <section
            data-skeleton-region="overview-menu-settings"
            className="grid gap-4"
          >
            <Skeleton className="h-6 w-40" />

            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <Skeleton className="h-4 w-2/5" />

                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-4 w-24" />

                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            data-skeleton-region="overview-organizations"
            className="grid gap-4"
          >
            <Skeleton className="h-6 w-44" />

            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="grid min-h-36 content-between gap-5 rounded-lg border border-border bg-card p-6"
                >
                  <div className="grid gap-3">
                    <Skeleton className="h-5 w-2/5" />

                    <Skeleton className="h-4 w-full" />

                    <Skeleton className="h-4 w-3/4" />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-9 w-24 rounded-lg" />

                    <Skeleton className="h-9 w-28 rounded-lg" />

                    <Skeleton className="h-9 w-36 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

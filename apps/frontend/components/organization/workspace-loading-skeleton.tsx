import { Skeleton } from "@/components/ui/skeleton"

export function WorkspaceLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>

      <main aria-busy="true" className="min-h-[70vh]">
        <div aria-hidden="true" className="grid gap-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-3">
              <Skeleton className="h-4 w-28" />

              <Skeleton className="h-9 w-56" />
            </div>

            <Skeleton className="h-10 w-32 rounded-lg" />
          </header>

          <section className="grid gap-4">
            <Skeleton className="h-6 w-44" />

            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="grid min-h-36 content-between gap-5 rounded-2xl border border-border bg-card p-6"
                >
                  <div className="grid gap-3">
                    <Skeleton className="h-5 w-2/5" />

                    <Skeleton className="h-4 w-full" />

                    <Skeleton className="h-4 w-3/4" />
                  </div>

                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-24 rounded-lg" />

                    <Skeleton className="h-9 w-28 rounded-lg" />
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

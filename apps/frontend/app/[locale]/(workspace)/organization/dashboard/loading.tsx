import { Skeleton } from "@/components/ui/skeleton"
import { getTranslations } from "next-intl/server"

export default async function DashboardLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
      <p role="status" aria-live="polite" className="sr-only">
        {t("workspace")}
      </p>

      <main aria-busy="true" data-skeleton-page="restaurant-dashboard">
        <div aria-hidden="true" className="grid gap-7">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-3">
              <Skeleton className="h-4 w-32" />

              <Skeleton className="h-9 w-60 max-w-full" />

              <Skeleton className="h-4 w-80 max-w-full" />
            </div>

            <Skeleton className="h-11 w-40" />
          </header>

          <section
            data-skeleton-region="dashboard-order-overview"
            className="grid gap-5"
          >
            <div className="grid gap-2 border-y py-5 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="grid gap-3 py-2 sm:px-4">
                  <Skeleton className="h-4 w-32" />

                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>

            <Skeleton className="h-7 w-48" />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="grid gap-3 rounded-lg border p-4">
                  <Skeleton className="h-6 w-2/3" />

                  <Skeleton className="h-4 w-1/2" />

                  <Skeleton className="h-20 w-full" />

                  <Skeleton className="h-10 w-1/3" />
                </div>
              ))}
            </div>
          </section>

          <section
            data-skeleton-region="dashboard-secondary-panels"
            className="grid gap-8 border-t pt-7 lg:grid-cols-2"
          >
            <Skeleton className="h-36 w-full" />

            <Skeleton className="h-36 w-full" />
          </section>
        </div>
      </main>
    </div>
  )
}

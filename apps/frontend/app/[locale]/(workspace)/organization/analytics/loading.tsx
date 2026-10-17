import { Skeleton } from "@/components/ui/skeleton"
import { getTranslations } from "next-intl/server"

export default async function AnalyticsLoading() {
  const t = await getTranslations("LiveWorkspace")

  return (
    <main
      aria-busy="true"
      data-skeleton-page="restaurant-analytics"
      className="mx-auto max-w-[1600px] min-w-0 px-6 pb-12"
    >
      <p role="status" aria-live="polite" className="sr-only">
        {t("metricsLoading")}
      </p>

      <div aria-hidden="true">
        <header className="grid gap-3 py-8">
          <Skeleton className="h-4 w-32" />

          <Skeleton className="h-9 w-48" />
        </header>

        <section
          data-skeleton-region="analytics-metrics"
          className="grid gap-4 border-t pt-7"
        >
          <div className="grid gap-2">
            <Skeleton className="h-7 w-48" />

            <Skeleton className="h-4 w-72 max-w-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-4">
                <Skeleton className="h-5 w-2/3" />

                <Skeleton className="h-4 w-1/2" />

                <Skeleton className="h-9 w-1/3" />
              </div>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
            <Skeleton className="h-64 rounded-lg" />

            <Skeleton className="h-64 rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  )
}

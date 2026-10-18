"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { browserRequest } from "@/lib/api/browser-request"
import { parseAnalyticsMetrics } from "@/lib/analytics-metrics"
import { AnalyticsPageProvider } from "@/components/workspace/analytics/page/context"
import { AnalyticsPageView } from "@/components/workspace/analytics/page/view"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { buildAnalyticsViewModel } from "./analytics-workspace-model"
import type { AnalyticsRange, AnalyticsRestaurant } from "@/types/analytics"

class AnalyticsRequestError extends Error {
  constructor(readonly status: number) {
    super("Analytics request failed")
  }
}

export function AnalyticsWorkspaceClient({
  restaurants,
  locale,
  requestedTenantId,
  initialErrorStatus,
}: {
  restaurants: AnalyticsRestaurant[]
  locale: string
  requestedTenantId?: string
  initialErrorStatus?: number
}) {
  const t = useTranslations("AnalyticsLive")
  const router = useRouter()
  const queryClient = useQueryClient()
  const initialRestaurant = restaurants.findIndex(
    (item) => item.id.toLowerCase() === requestedTenantId?.toLowerCase()
  )
  const [rest, setRest] = useState(
    initialRestaurant >= 0 ? initialRestaurant + 1 : 0
  )
  const [range, setRange] = useState<AnalyticsRange>("30")
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue")
  const selector = rest === 0 ? "all" : (restaurants[rest - 1]?.id ?? "all")
  const scope = restaurants
    .map(
      (item) =>
        `${item.id}:${item.role}:${[...item.permissions].sort().join(",")}`
    )
    .sort()
    .join("|")
  const queryKey = [
    "organization-analytics",
    scope,
    selector,
    range,
    locale,
  ] as const
  const query = useQuery({
    queryKey,
    enabled: restaurants.length > 0,
    staleTime: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const url = new URLSearchParams({ restaurant: selector, days: range })
      const response = await browserRequest<{ ok: boolean; data?: unknown }>(
        `/api/organization-analytics?${url}`,
        { signal }
      )

      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          await queryClient.removeQueries({
            queryKey: ["organization-analytics"],
          })
        throw new AnalyticsRequestError(response.status)
      }

      if (!response.data?.ok) throw new AnalyticsRequestError(response.status)

      const data = parseAnalyticsMetrics(response.data.data)

      if (!data) throw new AnalyticsRequestError(502)

      return data
    },
  })

  useEffect(() => {
    if (
      query.error instanceof AnalyticsRequestError &&
      [401, 403].includes(query.error.status)
    )
      void queryClient.removeQueries({ queryKey: ["organization-analytics"] })
  }, [query.error, queryClient])

  const data = query.data
  const viewModel = useMemo(
    () =>
      data
        ? buildAnalyticsViewModel(data, {
            range,
            setRange,
            rest,
            setRest,
            metric,
            setMetric,
            locale,
            t,
            restaurants,
          })
        : null,
    [data, locale, metric, range, rest, restaurants, t]
  )

  if (initialErrorStatus !== undefined)
    return (
      <AnalyticsError
        status={initialErrorStatus}
        onRetry={() => router.refresh()}
        title={t("title")}
      />
    )

  if (restaurants.length === 0) {
    return (
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <h1 className="font-display text-4xl font-bold">{t("title")}</h1>

        <Alert variant="info" className="mt-6">
          <AlertDescription>{t("noRestaurants")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  if (query.isLoading || !data || !viewModel) {
    if (query.isError)
      return (
        <AnalyticsError
          status={
            query.error instanceof AnalyticsRequestError
              ? query.error.status
              : 503
          }
          onRetry={() => void query.refetch()}
          title={t("title")}
        />
      )

    return (
      <main className="mx-auto max-w-[1600px] px-6 py-8" aria-busy="true">
        <p role="status" className="label-mono text-muted-foreground">
          {t("loading")}
        </p>

        <div className="mt-6 h-10 w-64 animate-pulse bg-muted" />

        <div className="mt-6 grid grid-cols-2 gap-px border bg-foreground md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse bg-background" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <>
      {query.isError && (
        <div className="px-6 pt-4">
          <Alert variant="destructive" role="alert">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("refreshError")}</span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
              >
                {t("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {data.orders === 0 && (
        <div className="px-6 pt-4">
          <Alert variant="info" role="status">
            <AlertDescription>{t("emptyPeriod")}</AlertDescription>
          </Alert>
        </div>
      )}

      <div
        className={query.isRefetching ? "opacity-70" : ""}
        aria-busy={query.isRefetching}
      >
        <AnalyticsPageProvider model={viewModel}>
          <AnalyticsPageView />
        </AnalyticsPageProvider>
      </div>

      <p className="mx-6 mb-8 text-xs text-muted-foreground">{t("dataNote")}</p>
    </>
  )
}

function AnalyticsError({
  status,
  onRetry,
  title,
}: {
  status: number
  onRetry: () => void
  title: string
}) {
  const t = useTranslations("AnalyticsLive")
  const message =
    status === 401
      ? t("sessionExpired")
      : status === 403
        ? t("forbidden")
        : status === 404
          ? t("notFound")
          : t("loadError")

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <h1 className="font-display text-4xl font-bold">{title}</h1>

      <Alert variant="destructive" role="alert" className="mt-6">
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{message}</span>

          <Button variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  )
}

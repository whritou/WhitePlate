"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  fetchDashboardMetrics,
  OrderRequestError,
} from "@/lib/api/order-browser"
import { dashboardMetricsQueryKeys } from "@/lib/query/dashboard-metrics-query"
import { useRouter } from "@/i18n/navigation"
import type { DashboardMetrics } from "@/types/dashboard-metrics"
import type { RestaurantRole } from "@/types/orders"

export function useDashboardMetrics({
  userId,
  tenantId,
  locale,
  role,
  initialMetrics,
}: {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
  initialMetrics: DashboardMetrics | null
}) {
  const client = useQueryClient()
  const router = useRouter()
  const queryKey = dashboardMetricsQueryKeys.tenant({
    userId,
    tenantId,
    locale,
    role,
  })
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchDashboardMetrics(tenantId, signal),
    initialData: initialMetrics ?? undefined,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  })
  const error =
    query.error instanceof OrderRequestError
      ? query.error.code
      : query.error
        ? "unavailable"
        : null

  useEffect(() => {
    if (error === "unauthorized") {
      client.clear()
      router.push("/sign-in")
    } else if (error === "forbidden") {
      client.removeQueries({
        queryKey: dashboardMetricsQueryKeys.tenant({
          userId,
          tenantId,
          locale,
          role,
        }),
        type: "inactive",
      })
    }
  }, [client, error, locale, role, router, tenantId, userId])

  return {
    metrics:
      error === "forbidden" || error === "unauthorized"
        ? null
        : (query.data ?? null),
    loadError: error,
    isInitialLoading: query.isPending && !query.data,
    isFetching: query.isFetching,
    retry: query.refetch,
    canViewOrderValue: role !== "Kitchen",
  }
}

import type { DashboardMetricsScope } from "@/types/dashboard-metrics"

export const dashboardMetricsQueryKeys = {
  tenant: ({ userId, tenantId, locale, role }: DashboardMetricsScope) =>
    [
      "whiteplate",
      "dashboard-metrics",
      userId,
      tenantId.toLowerCase(),
      locale,
      role,
    ] as const,
}

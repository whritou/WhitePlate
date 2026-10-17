import type { DashboardMetricsScope } from "@/types/dashboard-metrics"

export const dashboardMetricsQueryKeys = {
  tenant: ({ userId, tenantId, locale, role, permissions }: DashboardMetricsScope) =>
    [
      "whiteplate",
      "dashboard-metrics",
      userId,
      tenantId.toLowerCase(),
      locale,
      role,
      [...permissions].sort().join(","),
    ] as const,
}

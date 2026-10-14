import { expect, it } from "vitest"
import { dashboardMetricsQueryKeys } from "./dashboard-metrics-query"

const scope = {
  userId: "user-a",
  tenantId: "11111111-1111-4111-8111-111111111111",
  locale: "en",
  role: "Manager" as const,
}

it("scopes cached dashboard metrics by account, tenant and locale", () => {
  const baseKey = dashboardMetricsQueryKeys.tenant(scope)

  expect(
    dashboardMetricsQueryKeys.tenant({
      ...scope,
      tenantId: scope.tenantId.toUpperCase(),
    })
  ).toEqual(baseKey)
  expect(
    dashboardMetricsQueryKeys.tenant({ ...scope, userId: "user-b" })
  ).not.toEqual(baseKey)
  expect(
    dashboardMetricsQueryKeys.tenant({
      ...scope,
      tenantId: "22222222-2222-4222-8222-222222222222",
    })
  ).not.toEqual(baseKey)
  expect(
    dashboardMetricsQueryKeys.tenant({ ...scope, locale: "fr" })
  ).not.toEqual(baseKey)
  expect(
    dashboardMetricsQueryKeys.tenant({ ...scope, role: "Kitchen" })
  ).not.toEqual(baseKey)
})

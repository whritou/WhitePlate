import { getLocale } from "next-intl/server"
import { AnalyticsWorkspaceClient } from "@/components/organization/analytics-workspace-client"
import { selectAnalyticsMemberships } from "@/lib/analytics-access"
import { getRestaurantMemberships } from "@/services/orders"
import type { SearchParams } from "@/types/navigation"

export default async function AnalyticsWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [params, locale, memberships] = await Promise.all([
    searchParams,
    getLocale(),
    getRestaurantMemberships(),
  ])

  if (!memberships.ok || memberships.data === null)
    return (
      <AnalyticsWorkspaceClient
        restaurants={[]}
        locale={locale}
        initialErrorStatus={memberships.ok ? 502 : memberships.status}
      />
    )

  const restaurants = selectAnalyticsMemberships(memberships.data)
  const requestedTenantId =
    typeof params.tenantId === "string" ? params.tenantId : undefined

  return (
    <AnalyticsWorkspaceClient
      restaurants={restaurants}
      locale={locale}
      requestedTenantId={requestedTenantId}
    />
  )
}

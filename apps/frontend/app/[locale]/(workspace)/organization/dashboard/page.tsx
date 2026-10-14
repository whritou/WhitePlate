import { auth } from "@/lib/auth"
import { isValidTenantId, resolveOrderHubUrl } from "@/lib/order-dashboard"
import {
  getManagedCatalog,
  getProductAvailability,
} from "@/services/catalog-management"
import {
  getDashboardMetrics,
  getOrderPage,
  getRestaurantMemberships,
} from "@/services/orders"
import { getOrderingOperations } from "@/services/ordering-operations"
import { restaurantShopUrl } from "@/lib/restaurant-shop-url"
import { LiveDashboard } from "@/components/organization/live-dashboard"
import { BackLink } from "@/components/organization/back-link"
import { MenuBuilderRetry } from "@/components/organization/menu-builder-retry"
import { Card } from "@/components/ui/card"
import type {
  OrderDashboardProps,
  OrderLoadError,
  OrderPage,
} from "@/types/orders"
import type { SearchParams } from "@/types/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const params = await searchParams
  const tenantId = singleValue(params.tenantId)

  if (!isValidTenantId(tenantId)) redirect(`/${locale}/organization`)

  const [memberships, workspaceTranslations, orderTranslations] =
    await Promise.all([
      getRestaurantMemberships(),
      getTranslations("LiveWorkspace"),
      getTranslations("KitchenOrders"),
    ])

  if (!memberships.ok) {
    if (memberships.status === 401) redirect(`/${locale}/sign-in`)

    return (
      <DashboardMessage
        title={workspaceTranslations("dashboard")}
        message={workspaceTranslations("loadError")}
        showRetry
      />
    )
  }

  const restaurant = memberships.data?.find(
    (item) => item.id.toLowerCase() === tenantId.toLowerCase()
  )

  if (!restaurant)
    return (
      <DashboardMessage
        title={orderTranslations("accessDeniedTitle")}
        message={orderTranslations("errors.forbidden")}
      />
    )

  const [
    orderResponse,
    metricsResponse,
    operationsResponse,
    catalogResponse,
    availabilityResponse,
  ] = await Promise.all([
    getOrderPage(restaurant.id, null, null),
    getDashboardMetrics(restaurant.id),
    getOrderingOperations(restaurant.id),
    restaurant.role === "Kitchen"
      ? Promise.resolve(null)
      : getManagedCatalog(restaurant.id),
    getProductAvailability(restaurant.id),
  ])

  if (!orderResponse.ok && orderResponse.status === 401)
    redirect(`/${locale}/sign-in`)
  if (!metricsResponse.ok && metricsResponse.status === 401)
    redirect(`/${locale}/sign-in`)
  if (!operationsResponse.ok && operationsResponse.status === 401)
    redirect(`/${locale}/sign-in`)
  if (!availabilityResponse.ok && availabilityResponse.status === 401)
    redirect(`/${locale}/sign-in`)

  let page: OrderPage | null = null
  let loadError: OrderLoadError | null = null

  if (!orderResponse.ok) {
    loadError =
      orderResponse.status === 403 || orderResponse.status === 404
        ? "forbidden"
        : orderResponse.error === "invalid"
          ? "invalid"
          : "unavailable"
  } else if (!orderResponse.data) {
    loadError = "unavailable"
  } else {
    page = orderResponse.data
  }

  const dashboardProps: OrderDashboardProps = {
    userId: session.user.id,
    tenantId: restaurant.id,
    tenantName: restaurant.name,
    role: restaurant.role,
    locale,
    selectedStatus: null,
    cursor: null,
    page,
    loadError,
    hubUrl: resolveOrderHubUrl(
      process.env.PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL,
      process.env.NODE_ENV === "production"
    ),
  }

  return (
    <LiveDashboard
      {...dashboardProps}
      initialDashboardMetrics={
        metricsResponse.ok ? (metricsResponse.data ?? null) : null
      }
      initialOrderingOperations={
        operationsResponse.ok ? (operationsResponse.data ?? null) : null
      }
      catalog={
        catalogResponse?.ok ? (catalogResponse.data ?? undefined) : undefined
      }
      productAvailability={
        availabilityResponse.ok
          ? (availabilityResponse.data ?? undefined)
          : undefined
      }
      availabilityLoadError={!availabilityResponse.ok}
      storefrontUrl={restaurantShopUrl(
        restaurant.subdomain,
        process.env.STOREFRONT_BASE_DOMAIN,
        locale
      )}
    />
  )
}

async function DashboardMessage({
  title,
  message,
  showRetry = false,
}: {
  title: string
  message: string
  showRetry?: boolean
}) {
  const t = await getTranslations("KitchenOrders")

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-[1600px] min-w-0 px-4 py-8 sm:px-6">
      <Card className="rounded-lg border bg-card p-5 sm:p-6">
        <h1 className="font-display text-2xl font-bold">{title}</h1>

        <p role="alert" className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>

        {showRetry ? (
          <MenuBuilderRetry />
        ) : (
          <BackLink label={t("backToOrganizations")} className="mt-3 w-fit" />
        )}
      </Card>
    </main>
  )
}

function singleValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? null : (value ?? null)
}

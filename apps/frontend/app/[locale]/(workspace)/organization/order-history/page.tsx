import { OrderHistoryTable } from "@/components/orders/order-history-table"
import { Card } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { isValidTenantId, parseOrderStatusFilter } from "@/lib/order-dashboard"
import { getOrderHistory, getRestaurantMemberships } from "@/services/orders"
import type { OrderHistoryFilters } from "@/types/orders"
import type { SearchParams } from "@/types/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const locale = await getLocale()
  const t = await getTranslations("OrderHistory")
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const params = await searchParams
  const tenantId = one(params.tenantId)

  if (!isValidTenantId(tenantId)) redirect(`/${locale}/organization`)

  const memberships = await getRestaurantMemberships()

  if (!memberships.ok) {
    if (memberships.status === 401) redirect(`/${locale}/sign-in`)

    return <PageError title={t("title")} message={t("loadError")} />
  }

  if (!memberships.data)
    return <PageError title={t("title")} message={t("loadError")} />

  const restaurant = memberships.data.find(
    (item) => item.id.toLowerCase() === tenantId.toLowerCase()
  )

  if (!restaurant || restaurant.role === "Kitchen")
    return (
      <PageError title={t("accessDeniedTitle")} message={t("accessDenied")} />
    )

  const statusResult = parseOrderStatusFilter(one(params.status))
  const page = parsePositiveInt(one(params.page), 1, 100_000)
  const from = optionalDate(one(params.from))
  const through = optionalDate(one(params.through))
  const sortValue = one(params.sort)
  const directionValue = one(params.direction)
  const sort =
    sortValue === "total"
      ? "total"
      : sortValue === undefined || sortValue === "createdAt"
        ? "createdAt"
        : null
  const direction =
    directionValue === "asc"
      ? "asc"
      : directionValue === undefined || directionValue === "desc"
        ? "desc"
        : null
  const searchValue = one(params.search)
  const search = searchValue?.trim() ?? ""

  if (
    !statusResult.ok ||
    page === null ||
    from === null ||
    through === null ||
    sort === null ||
    direction === null ||
    searchValue === null ||
    search.length > 100 ||
    (from && through && from > through)
  )
    return <PageError title={t("title")} message={t("invalidFilter")} />

  const filters: OrderHistoryFilters = {
    tenantId: restaurant.id,
    status: statusResult.status,
    search: search || null,
    from,
    through,
    sort,
    direction,
    page,
    pageSize: 25,
  }
  const result = await getOrderHistory(filters)

  if (!result.ok) {
    if (result.status === 401) redirect(`/${locale}/sign-in`)
    if (result.status === 403 || result.status === 404)
      return (
        <PageError title={t("accessDeniedTitle")} message={t("accessDenied")} />
      )

    return <PageError title={t("title")} message={t("loadError")} />
  }

  if (!result.data)
    return <PageError title={t("title")} message={t("loadError")} />

  return (
    <OrderHistoryTable
      tenantName={restaurant.name}
      locale={locale}
      filters={filters}
      page={result.data}
    />
  )
}

function PageError({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl p-4 sm:p-6 lg:p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <p role="alert" className="mt-3 text-sm text-destructive">
          {message}
        </p>
      </Card>
    </main>
  )
}

function one(value: string | string[] | undefined): string | null | undefined {
  if (Array.isArray(value)) return null

  return value
}

function parsePositiveInt(
  value: string | null | undefined,
  fallback: number,
  max: number
): number | null {
  if (value === undefined) return fallback
  if (value === null) return null
  if (!/^\d+$/.test(value)) return null

  const parsed = Number(value)

  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max
    ? parsed
    : null
}

function optionalDate(value: string | null | undefined): string | null {
  if (value === undefined) return null
  if (value === null) return null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const parsed = new Date(`${value}T00:00:00Z`)

  return !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
    ? value
    : null
}

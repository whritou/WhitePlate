import { OrderDashboard } from "@/components/orders/order-dashboard"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { auth } from "@/lib/auth"
import {
  isValidTenantId,
  parseOrderCursor,
  parseOrderStatusFilter,
  resolveOrderHubUrl,
} from "@/lib/order-dashboard"
import { getOrderPage, getRestaurantMemberships } from "@/services/orders"
import type { SearchParams } from "@/types/navigation"
import type { OrderPage } from "@/types/orders"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function KitchenOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const locale = await getLocale()
  const t = await getTranslations("KitchenOrders")
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const params = await searchParams
  const tenantId = singleValue(params.tenantId)

  if (!isValidTenantId(tenantId)) redirect(`/${locale}/organization`)

  const currentUser = await getRestaurantMemberships()

  if (!currentUser.ok) {
    if (currentUser.status === 401) redirect(`/${locale}/sign-in`)

    return <PageMessage title={t("title")} message={t("errors.unavailable")} />
  }

  const memberships = currentUser.data

  if (!memberships)
    return <PageMessage title={t("title")} message={t("errors.unavailable")} />

  const membership = memberships.find(
    (item) => item.id.toLowerCase() === tenantId.toLowerCase()
  )

  if (!membership)
    return (
      <PageMessage
        title={t("accessDeniedTitle")}
        message={t("errors.forbidden")}
      />
    )

  const statusResult = parseOrderStatusFilter(
    singleValue(params.status, params.status !== undefined)
  )
  const cursorResult = parseOrderCursor(
    singleValue(params.cursor, params.cursor !== undefined)
  )
  let page: OrderPage | null = null
  let loadError: "forbidden" | "invalid" | "unavailable" | null = null

  if (!statusResult.ok || !cursorResult.ok) {
    loadError = "invalid"
  } else {
    const response = await getOrderPage(
      tenantId,
      statusResult.status,
      cursorResult.cursor
    )

    if (!response.ok) {
      if (response.status === 401) redirect(`/${locale}/sign-in`)
      if (response.status === 403 || response.status === 404)
        return (
          <PageMessage
            title={t("accessDeniedTitle")}
            message={t("errors.forbidden")}
          />
        )
      loadError = response.error === "invalid" ? "invalid" : "unavailable"
    } else {
      page = response.data
      if (!page) loadError = "unavailable"
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12 sm:py-16">
      <OrderDashboard
        key={`${session.user.id}:${membership.id}:${locale}`}
        userId={session.user.id}
        tenantId={membership.id}
        tenantName={membership.name}
        role={membership.role}
        locale={locale}
        selectedStatus={statusResult.ok ? statusResult.status : null}
        cursor={cursorResult.ok ? cursorResult.cursor : null}
        page={page}
        loadError={loadError}
        hubUrl={resolveOrderHubUrl(
          process.env.PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL,
          process.env.NODE_ENV === "production"
        )}
      />
    </main>
  )
}

async function PageMessage({
  title,
  message,
}: {
  title: string
  message: string
}) {
  const t = await getTranslations("KitchenOrders")

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12 sm:py-16">
      <Card className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <p role="alert" className="mt-3 text-sm text-destructive">
          {message}
        </p>

        <Link
          href="/organization"
          className="mt-5 inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("backToOrganizations")}
        </Link>
      </Card>
    </main>
  )
}

function singleValue(
  value: string | string[] | undefined,
  rejectArray = false
): unknown {
  if (Array.isArray(value)) return rejectArray ? null : undefined

  return value
}

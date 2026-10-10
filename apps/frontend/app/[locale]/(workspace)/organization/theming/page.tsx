import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import { getRestaurantMemberships } from "@/services/orders"
import { getBrandAssets } from "@/services/brand-assets"
import { LiveStudio } from "@/components/organization/live-studio"
import { MenuBuilderRetry } from "@/components/organization/menu-builder-retry"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { BrandPageProps } from "@/types/brand-assets"

export default async function ThemingPage({ searchParams }: BrandPageProps) {
  const [locale, query, session] = await Promise.all([
    getLocale(),
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("BrandAssets")
  const memberships = await getRestaurantMemberships()
  const restaurant =
    memberships.ok && isUuid(query.tenantId)
      ? memberships.data?.find(
          (item) => item.id === query.tenantId && item.role !== "Kitchen"
        )
      : undefined
  const initial = restaurant ? await getBrandAssets(restaurant.id) : undefined

  return (
    <main className="w-full min-w-0">
      {restaurant ? (
        <LiveStudio
          key={`${session.user.id}:${restaurant.id}`}
          userId={session.user.id}
          tenantId={restaurant.id}
          restaurantName={restaurant.name}
          initialData={initial?.ok ? initial.data : undefined}
        />
      ) : (
        <>
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t(memberships.ok ? "errors.forbidden" : "loadFailed")}
            </AlertDescription>
          </Alert>

          <MenuBuilderRetry />
        </>
      )}
    </main>
  )
}

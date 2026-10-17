import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { getBrandAssets } from "@/services/brand-assets"
import { getThemeDraft } from "@/services/theme-settings"
import { getThemePublication } from "@/services/theme-publication"
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
  const restaurant = await getManagedWorkspaceRestaurant(query.tenantId, [
    "storefront.manage",
  ])
  const [initial, theme, publication] = restaurant
    ? await Promise.all([
        getBrandAssets(restaurant.id),
        getThemeDraft(restaurant.id),
        getThemePublication(restaurant.id),
      ])
    : []

  return (
    <main className="w-full min-w-0">
      {restaurant ? (
        <LiveStudio
          key={`${session.user.id}:${restaurant.id}`}
          userId={session.user.id}
          tenantId={restaurant.id}
          restaurantName={restaurant.name}
          initialData={initial?.ok ? initial.data : undefined}
          initialTheme={theme?.ok && theme.data ? theme.data : undefined}
          initialPublication={
            publication?.ok && publication.data ? publication.data : undefined
          }
        />
      ) : (
        <>
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {t("errors.forbidden")}
            </AlertDescription>
          </Alert>

          <MenuBuilderRetry />
        </>
      )}
    </main>
  )
}

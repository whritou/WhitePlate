import { MenuBuilderWorkspace } from "@/components/organization/menu-builder-workspace"
import { MenuBuilderRetry } from "@/components/organization/menu-builder-retry"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import { getRestaurantMemberships } from "@/services/orders"
import { getManagedCatalog } from "@/services/catalog-management"
import {
  getMenuLanguageSettings,
  getRestaurantDescriptionTranslations,
} from "@/services/organization-queries"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CatalogPageProps } from "@/types/catalog-management"

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("Catalog")
  const memberships = await getRestaurantMemberships()
  const restaurant =
    memberships.ok && isUuid(query.tenantId)
      ? memberships.data?.find(
          (item) =>
            item.id === query.tenantId &&
            (item.role === "OrganizationOwner" || item.role === "Manager")
        )
      : null
  const [response, languages, description] = restaurant
    ? await Promise.all([
        getManagedCatalog(restaurant.id),
        getMenuLanguageSettings(restaurant.id),
        getRestaurantDescriptionTranslations(restaurant.id),
      ])
    : [null, null, null]
  const catalog = response?.ok ? response.data : null

  if (!catalog || !restaurant) {
    return (
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t(
              `errors.${!memberships.ok || (response && !response.ok && response.error === "unavailable") ? "unavailable" : "forbidden"}`
            )}
          </AlertDescription>
        </Alert>

        <MenuBuilderRetry />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[100rem] min-w-0 p-4 sm:p-6 lg:p-8">
      <MenuBuilderWorkspace
        userId={session.user.id}
        key={`${session.user.id}:${catalog.tenantId}`}
        catalog={catalog}
        restaurantName={restaurant.name}
        settings={languages?.ok ? (languages.data ?? undefined) : undefined}
        description={
          description?.ok ? (description.data ?? undefined) : undefined
        }
        initialView={
          query.view === "categories"
            ? "categories"
            : query.view === "translations"
              ? "translations"
              : "products"
        }
      />
    </main>
  )
}

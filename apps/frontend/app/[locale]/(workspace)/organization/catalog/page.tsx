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
  getCatalogTranslationReviews,
  getCatalogTranslationGlossary,
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
            (item.permissions.includes("catalog.manage") ||
              item.permissions.includes("discounts.manage"))
        )
      : null
  const canManageCatalog =
    restaurant?.permissions.includes("catalog.manage") ?? false
  const canManageDiscounts =
    restaurant?.permissions.includes("discounts.manage") ?? false
  const [
    response,
    languages,
    description,
    translationReviews,
    translationGlossary,
  ] = restaurant
    ? await Promise.all([
        getManagedCatalog(restaurant.id),
        canManageCatalog
          ? getMenuLanguageSettings(restaurant.id)
          : Promise.resolve(null),
        canManageCatalog
          ? getRestaurantDescriptionTranslations(restaurant.id)
          : Promise.resolve(null),
        canManageCatalog
          ? getCatalogTranslationReviews(restaurant.id)
          : Promise.resolve(null),
        canManageCatalog
          ? getCatalogTranslationGlossary(restaurant.id)
          : Promise.resolve(null),
      ])
    : [null, null, null, null, null]
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
    <main className="w-full min-w-0">
      <MenuBuilderWorkspace
        userId={session.user.id}
        key={`${session.user.id}:${catalog.tenantId}`}
        catalog={catalog}
        canManageCatalog={canManageCatalog}
        canManageDiscounts={canManageDiscounts}
        restaurantName={restaurant.name}
        settings={languages?.ok ? (languages.data ?? undefined) : undefined}
        description={
          description?.ok ? (description.data ?? undefined) : undefined
        }
        translationReviews={
          translationReviews?.ok
            ? (translationReviews.data ?? undefined)
            : undefined
        }
        translationGlossary={
          translationGlossary?.ok
            ? (translationGlossary.data ?? undefined)
            : undefined
        }
        translationWorkflowUnavailable={
          canManageCatalog &&
          (!translationReviews?.ok || !translationGlossary?.ok)
        }
        initialView={
          !canManageCatalog
            ? "discounts"
            : query.view === "discounts"
              ? "discounts"
              : query.view === "languages"
                ? "languages"
                : query.view === "versions"
                  ? "versions"
                  : query.view === "categories"
                    ? "categories"
                    : query.view === "translations"
                      ? "translations"
                      : "products"
        }
      />
    </main>
  )
}

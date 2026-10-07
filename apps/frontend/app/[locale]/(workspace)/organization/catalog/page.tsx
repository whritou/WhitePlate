import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CatalogWorkspace } from "@/components/organization/catalog-workspace"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import { getRestaurantMemberships } from "@/services/orders"
import { getManagedCatalog } from "@/services/catalog-management"
import { Link } from "@/i18n/navigation"
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
  const response = restaurant ? await getManagedCatalog(restaurant.id) : null
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
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{restaurant.name}</p>

          <h1 className="mt-2 text-2xl font-semibold sm:text-[2rem]">
            {t("title")}
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">{t("intro")}</p>
        </div>

        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={`/organization/restaurant-languages?tenantId=${encodeURIComponent(catalog.tenantId)}`}
            />
          }
        >
          <Languages aria-hidden="true" />

          {t("menuLanguagesLink")}
        </Button>
      </header>

      <CatalogWorkspace catalog={catalog} />
    </main>
  )
}

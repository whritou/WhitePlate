import { Button } from "@/components/ui/button"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { auth } from "@/lib/auth"
import { getRestaurantMemberships } from "@/services/orders"
import { getOrganizations } from "@/services/organization-queries"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { OrganizationArchiveAction } from "@/components/organization/organization-archive-action"

export default async function OrganizationPage() {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("Auth")
  const [organizationsResponse, currentUserResponse] = await Promise.all([
    getOrganizations(),
    getRestaurantMemberships(),
  ])
  const organizations =
    organizationsResponse.ok && Array.isArray(organizationsResponse.data)
      ? organizationsResponse.data
      : null
  const restaurants = currentUserResponse.ok
    ? (currentUserResponse.data ?? [])
    : []
  const manageableRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.role === "OrganizationOwner" || restaurant.role === "Manager"
  )

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
            {t("organizationsHeading")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SignOutButton />

          <Button
            size="lg"

            nativeButton={false}
            render={<Link href="/organization/sign-up" />}
          >
            {t("newOrganizationAction")}
          </Button>
        </div>
      </header>

      {restaurants.length > 0 && (
        <section className="mb-8 grid gap-3">
          <h2 className="text-base font-semibold">{t("restaurantOrders")}</h2>

          <ul className="grid gap-2 sm:grid-cols-2">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <Card className="flex flex-row flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <span className="truncate text-sm font-medium">
                    {restaurant.name}
                  </span>

                  <Link
                    href={`/organization/orders?tenantId=${restaurant.id}`}
                    className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t("openOrders")}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {manageableRestaurants.length > 0 && (
        <section className="mb-8 grid gap-3">
          <h2 className="text-base font-semibold">
            {t("restaurantMenuSettings")}
          </h2>

          <ul className="grid gap-2 sm:grid-cols-2">
            {manageableRestaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <Card className="flex flex-row flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <span className="truncate text-sm font-medium">
                    {restaurant.name}
                  </span>

                  <div
                    role="group"
                    aria-label={t("restaurantMenuActions")}
                    className="flex min-w-0 flex-wrap gap-3"
                  >
                    <Link
                      href={`/organization/catalog?view=translations&tenantId=${restaurant.id}`}
                      className="inline-flex min-h-11 max-w-full min-w-0 items-center text-sm font-medium whitespace-normal text-primary underline-offset-4 hover:underline"
                    >
                      {t("editMenuLanguages")}
                    </Link>

                    <Link
                      href={`/organization/catalog?tenantId=${restaurant.id}`}
                      className="inline-flex min-h-11 max-w-full min-w-0 items-center text-sm font-medium whitespace-normal text-primary underline-offset-4 hover:underline"
                    >
                      {t("editCatalog")}
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {organizations === null ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t("serviceError")}</AlertDescription>
        </Alert>
      ) : organizations.length === 0 &&
        restaurants.length > 0 ? null : organizations.length === 0 ? (
        <Card className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center has-data-[slot=card-footer]:pb-12">
          <CardHeader className="px-0">
            <CardTitle>
              <h2 className="text-xl font-semibold">
                {t("noOrganizationsTitle")}
              </h2>
            </CardTitle>

            <CardDescription className="mx-auto mt-2 max-w-md text-sm leading-6">
              {t("noOrganizationsDescription")}
            </CardDescription>
          </CardHeader>

          <CardFooter className="justify-center border-0 p-0">
            <Button
              size="lg"
              className="mt-6"
              nativeButton={false}
              render={<Link href="/organization/sign-up" />}
            >
              {t("createOrganizationAction")}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {organizations.map((organization) => (
            <li key={organization.id}>
              <Card className="gap-0 rounded-lg border border-border p-6 has-data-[slot=card-footer]:pb-6">
                <CardHeader className="px-0">
                  {!organization.isActive && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("organizationArchived")}
                    </p>
                  )}

                  <CardTitle>
                    <h2 className="text-lg font-semibold">
                      {organization.name}
                    </h2>
                  </CardTitle>
                </CardHeader>

                <CardFooter className="border-0 p-0">
                  {organization.isActive ? (
                    <div
                      role="group"
                      aria-label={t("organizationActions")}
                      className="mt-5 flex min-w-0 flex-wrap gap-3"
                    >
                      <Link
                        href={`/organization/team?organizationId=${organization.id}`}
                        className="inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 text-sm font-medium whitespace-normal text-primary underline-offset-4 hover:underline"
                      >
                        {t("manageTeamAction")}
                      </Link>

                      <Link
                        href={`/organization/settings?organizationId=${organization.id}`}
                        className="inline-flex min-h-11 max-w-full min-w-0 items-center text-sm font-medium whitespace-normal text-primary underline-offset-4 hover:underline"
                      >
                        {t("organizationSettingsAction")}
                      </Link>

                      <Link
                        href={`/organization/restaurants/new?organizationId=${organization.id}`}
                        className="inline-flex min-h-11 max-w-full min-w-0 items-center text-sm font-medium whitespace-normal text-primary underline-offset-4 hover:underline"
                      >
                        {t("createRestaurantAction")}
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <OrganizationArchiveAction
                        organizationId={organization.id}
                        active={false}
                        compact
                      />
                    </div>
                  )}
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

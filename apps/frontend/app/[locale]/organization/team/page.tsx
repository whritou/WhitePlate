import { StaffInvitationForm } from "@/components/auth/staff-invitation-form"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { auth } from "@/lib/auth"
import {
  getOrganizationRestaurants,
  getOrganizations,
} from "@/services/organization-queries"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function OrganizationTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("Auth")
  const organizationsResponse = await getOrganizations()

  if (!organizationsResponse.ok || !Array.isArray(organizationsResponse.data)) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16">
        <Alert
          variant="destructive"
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertDescription>{t("serviceError")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  const organizations = organizationsResponse.data
  const organization =
    organizations.find((item) => item.id === query.organizationId) ??
    organizations[0]

  if (!organization) redirect(`/${locale}/organization/sign-up`)

  const restaurantsResponse = await getOrganizationRestaurants(organization.id)
  const restaurants =
    restaurantsResponse.ok && Array.isArray(restaurantsResponse.data)
      ? restaurantsResponse.data
      : null

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href="/organization"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("backToOrganizations")}
      </Link>

      <Card className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <CardHeader className="px-0">
          <p className="mb-2 text-sm font-medium text-primary">
            {organization.name}
          </p>

          <CardTitle>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("teamTitle")}
            </h1>
          </CardTitle>

          <CardDescription className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {t("teamDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          <Button
            className="mt-6"
            nativeButton={false}
            render={
              <Link
                href={`/organization/restaurants/new?organizationId=${organization.id}`}
              />
            }
          >
            {t("createRestaurantAction")}
          </Button>

          {restaurants && restaurants.length > 0 && (
            <section className="mt-8 grid gap-3">
              <h2 className="text-base font-semibold">
                {t("restaurantMenuSettings")}
              </h2>

              <ul className="grid gap-2 sm:grid-cols-2">
                {restaurants.map((restaurant) => (
                  <li
                    key={restaurant.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <span className="truncate text-sm font-medium">
                      {restaurant.name}
                    </span>

                    <Link
                      href={`/organization/restaurant-languages?tenantId=${restaurant.id}`}
                      className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t("editMenuLanguages")}
                    </Link>

                    <Link
                      href={`/organization/catalog?tenantId=${restaurant.id}`}
                      className="shrink-0 text-sm font-medium text-primary hover:underline"
                    >
                      {t("editCatalog")}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            {restaurants === null ? (
              <Alert
                variant="destructive"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertDescription>{t("serviceError")}</AlertDescription>
              </Alert>
            ) : (
              <StaffInvitationForm
                organizationId={organization.id}
                restaurants={restaurants}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

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
  getOrganizationInvitations,
  getOrganizationMembers,
  getOrganizations,
} from "@/services/organization-queries"
import { OrganizationTeamDirectory } from "@/components/organization/organization-team-directory"
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
      <main className="mx-auto min-h-[70vh] max-w-3xl p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive" role="alert">
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

  const [restaurantsResponse, membersResponse, invitationsResponse] =
    await Promise.all([
      getOrganizationRestaurants(organization.id),
      getOrganizationMembers(organization.id),
      getOrganizationInvitations(organization.id),
    ])
  const restaurants =
    restaurantsResponse.ok && Array.isArray(restaurantsResponse.data)
      ? restaurantsResponse.data
      : null
  const teamDirectory = await OrganizationTeamDirectory({
    organizationId: organization.id,
    members: membersResponse.ok ? membersResponse.data : null,
    invitations: invitationsResponse.ok ? invitationsResponse.data : null,
  })

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/organization"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("backToOrganizations")}
      </Link>

      <Card className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-10">
        <CardHeader className="px-0">
          <p className="mb-2 text-sm font-medium text-primary">
            {organization.name}
          </p>

          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
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

          <div className="mt-8">{teamDirectory}</div>

          <section className="mt-8 grid gap-2">
            <h2 className="text-base font-semibold">{t("teamInviteTitle")}</h2>

            <p className="text-sm text-muted-foreground">
              {t("teamInviteDescription")}
            </p>
          </section>

          <div className="mt-4">
            {restaurants === null ? (
              <Alert variant="destructive" role="alert">
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

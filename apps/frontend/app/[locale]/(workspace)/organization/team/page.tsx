import { StaffInvitationForm } from "@/components/auth/staff-invitation-form"
import { BackLink } from "@/components/organization/back-link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
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
      <main className="mx-auto min-h-[70vh] max-w-[1600px] px-6 py-8">
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
    <main className="mx-auto min-h-[70vh] max-w-[1600px] px-6 py-8">
      <BackLink label={t("backToOrganizations")} />

      <div className="mt-6">
        <CardHeader className="px-0">
          <p className="mb-2 text-sm font-medium text-brand-text">
            {organization.name}
          </p>

          <CardTitle>
            <h1 className="font-display text-4xl font-bold">
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

              <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
                {restaurants.map((restaurant) => (
                  <li
                    key={restaurant.id}
                    className="grid min-w-0 gap-2 rounded-lg border border-border px-4 py-3"
                  >
                    <span className="min-w-0 text-sm font-medium break-words">
                      {restaurant.name}
                    </span>

                    <div className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-2">
                      <Link
                        href={`/organization/catalog?view=translations&tenantId=${restaurant.id}`}
                        className="min-w-0 text-sm font-medium break-words text-brand-text underline-offset-4 hover:underline"
                      >
                        {t("editMenuLanguages")}
                      </Link>

                      <Link
                        href={`/organization/catalog?tenantId=${restaurant.id}`}
                        className="min-w-0 text-sm font-medium break-words text-brand-text hover:underline"
                      >
                        {t("editCatalog")}
                      </Link>
                    </div>
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
      </div>
    </main>
  )
}

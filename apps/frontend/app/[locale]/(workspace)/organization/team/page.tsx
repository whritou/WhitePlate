import { StaffInviteDialog } from "@/components/organization/staff-invite-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const v = await getTranslations("LiveParity")
  const teamDirectory = await OrganizationTeamDirectory({
    organizationId: organization.id,
    members: membersResponse.ok ? membersResponse.data : null,
    invitations: invitationsResponse.ok ? invitationsResponse.data : null,
    heading: (
      <div>
        <p className="label-mono text-muted-foreground">{organization.name}</p>

        <h1 className="mt-1 font-display text-4xl font-bold">
          {v("staffTitle")}
        </h1>
      </div>
    ),
    action: (
      <StaffInviteDialog
        organizationId={organization.id}
        restaurants={restaurants}
      />
    ),
  })

  return (
    <main className="min-w-0 bg-background px-6 pt-8 pb-12">
      {teamDirectory}
    </main>
  )
}

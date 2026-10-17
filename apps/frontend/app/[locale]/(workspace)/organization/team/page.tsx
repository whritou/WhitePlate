import { StaffInviteDialog } from "@/components/organization/staff-invite-dialog"
import { OrganizationTeamDirectory } from "@/components/organization/organization-team-directory"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/auth"
import {
  getOrganizationRestaurants,
  getOrganizationInvitations,
  getOrganizationMembers,
  getOrganizationRoleGrants,
  getOrganizations,
} from "@/services/organization-queries"
import { getRestaurantMemberships } from "@/services/orders"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function OrganizationTeamPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
    tenantId?: string
  }>
}) {
  const [locale, query, session] = await Promise.all([
    getLocale(),
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const [t, organizationsResponse, membershipsResponse] = await Promise.all([
    getTranslations("Auth"),
    getOrganizations(),
    getRestaurantMemberships(),
  ])

  if (!organizationsResponse.ok || !membershipsResponse.ok) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-[1600px] px-6 py-8">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t("serviceError")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  const organizations = organizationsResponse.data ?? []
  const ownerOrganization = query.organizationId
    ? organizations.find((item) => item.id === query.organizationId)
    : organizations[0]
  const staffMembership = membershipsResponse.data?.find(
    (item) =>
      item.organizationId &&
      item.permissions.includes("staff.manage") &&
      (!query.organizationId || item.organizationId === query.organizationId) &&
      (!query.tenantId || item.id === query.tenantId)
  )
  const isOrganizationOwner = ownerOrganization !== undefined
  const organization = ownerOrganization ??
    (staffMembership?.organizationId
      ? { id: staffMembership.organizationId, name: staffMembership.name }
      : undefined)

  if (!organization || (!isOrganizationOwner && !staffMembership)) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-[1600px] px-6 py-8">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t("teamAccessDenied")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  const [restaurantsResponse, membersResponse, invitationsResponse, roleResponse] =
    await Promise.all([
      isOrganizationOwner
        ? getOrganizationRestaurants(organization.id)
        : Promise.resolve(null),
      getOrganizationMembers(organization.id),
      getOrganizationInvitations(organization.id),
      isOrganizationOwner
        ? getOrganizationRoleGrants(organization.id)
        : Promise.resolve(null),
    ])
  const restaurants = isOrganizationOwner
    ? restaurantsResponse?.ok
      ? restaurantsResponse.data
      : null
    : (membershipsResponse.data ?? [])
        .filter(
          (item) =>
            item.organizationId === organization.id &&
            item.permissions.includes("staff.manage")
        )
        .map(({ id, name }) => ({ id, name }))
  const roleGrants = roleResponse?.ok ? roleResponse.data : null
  const v = await getTranslations("LiveParity")
  const teamDirectory = await OrganizationTeamDirectory({
    organizationId: organization.id,
    members: membersResponse.ok ? membersResponse.data : null,
    invitations: invitationsResponse.ok ? invitationsResponse.data : null,
    roleGrants,
    isOrganizationOwner,
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
        allowOwnerInvitation={isOrganizationOwner}
      />
    ),
  })

  return (
    <main className="min-w-0 bg-background px-6 pt-8 pb-12">
      {teamDirectory}
    </main>
  )
}

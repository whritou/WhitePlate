import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { auth } from "@/lib/auth"
import { getRestaurantMemberships } from "@/services/orders"
import { getOrganizations } from "@/services/organization-queries"
import { getLocale } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { WorkspaceLayoutProps } from "@/types/workspace-navigation"

export default async function OrganizationWorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const [organizationsResponse, membershipsResponse] = await Promise.all([
    getOrganizations(),
    getRestaurantMemberships(),
  ])
  const organizations =
    organizationsResponse.ok && Array.isArray(organizationsResponse.data)
      ? organizationsResponse.data
      : []
  const restaurants = membershipsResponse.ok
    ? (membershipsResponse.data ?? [])
    : []

  return (
    <WorkspaceShell organizations={organizations} restaurants={restaurants}>
      {children}
    </WorkspaceShell>
  )
}

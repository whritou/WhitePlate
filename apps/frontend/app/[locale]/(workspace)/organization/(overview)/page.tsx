import { OrganizationOverview } from "@/components/organization/organization-overview"
import { auth } from "@/lib/auth"
import { getRestaurantMemberships } from "@/services/orders"
import { getOrganizations } from "@/services/organization-queries"
import { getLocale } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { SearchParams } from "@/types/navigation"

export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const [organizations, restaurants] = await Promise.all([
    getOrganizations(),
    getRestaurantMemberships(),
  ])

  return (
    <OrganizationOverview
      organizations={organizations.ok ? (organizations.data ?? []) : null}
      restaurants={restaurants.ok ? (restaurants.data ?? []) : []}
      organizationId={
        typeof params.organizationId === "string"
          ? params.organizationId
          : params.organizationId
            ? "invalid"
            : undefined
      }
    />
  )
}

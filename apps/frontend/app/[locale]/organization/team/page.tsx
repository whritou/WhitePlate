import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { StaffInvitationForm } from "@/components/auth/organization-forms"
import { auth } from "@/lib/auth"
import { whitePlateApi } from "@/lib/api"

type Organization = { id: string; name: string }
type Restaurant = { id: string; name: string; subdomain: string; currency: string }

export default async function OrganizationTeamPage({ searchParams }: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)
  const t = await getTranslations("Auth")
  const organizationsResponse = await whitePlateApi.get<Organization[]>("/api/v1/organizations")
  if (!organizationsResponse.ok || !Array.isArray(organizationsResponse.data)) {
    return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16"><p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t("serviceError")}</p></main>
  }
  const organizations = organizationsResponse.data
  const organization = organizations.find((item) => item.id === query.organizationId) ?? organizations[0]
  if (!organization) redirect(`/${locale}/organization/sign-up`)
  const restaurantsResponse = await whitePlateApi.get<Restaurant[]>(`/api/v1/organizations/${organization.id}/restaurants`)
  const restaurants = restaurantsResponse.ok && Array.isArray(restaurantsResponse.data) ? restaurantsResponse.data : null

  return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16">
    <Link href="/organization" className="text-sm font-medium text-primary underline-offset-4 hover:underline">{t("backToOrganizations")}</Link>
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <p className="mb-2 text-sm font-medium text-primary">{organization.name}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{t("teamTitle")}</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("teamDescription")}</p>
      {restaurants && restaurants.length > 0 && <section className="mt-8 grid gap-3">
        <h2 className="text-base font-semibold">{t("restaurantMenuSettings")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">{restaurants.map((restaurant) => <li key={restaurant.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
          <span className="truncate text-sm font-medium">{restaurant.name}</span>
          <Link href={`/organization/restaurant-languages?tenantId=${restaurant.id}`} className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline">{t("editMenuLanguages")}</Link>
        </li>)}</ul>
      </section>}
      <div className="mt-8">{restaurants === null ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t("serviceError")}</p> : <StaffInvitationForm organizationId={organization.id} restaurants={restaurants} />}</div>
    </div>
  </main>
}

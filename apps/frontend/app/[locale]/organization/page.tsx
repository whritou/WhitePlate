import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { auth } from "@/lib/auth"
import { whitePlateApi } from "@/lib/api"

type Organization = { id: string; name: string }

export default async function OrganizationPage() {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)
  const t = await getTranslations("Auth")
  const response = await whitePlateApi.get<Organization[]>("/api/v1/organizations")
  const organizations = response.ok && Array.isArray(response.data) ? response.data : null

  return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-12 sm:py-16">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-sm font-medium text-primary">WhitePlate</p><h1 className="text-3xl font-semibold tracking-tight">{t("organizationsHeading")}</h1></div>
      <div className="flex items-center gap-3"><SignOutButton /><Link href="/organization/sign-up" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">{t("newOrganizationAction")}</Link></div>
    </header>
    {organizations === null ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t("serviceError")}</p> : organizations.length === 0 ? <section className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-xl font-semibold">{t("noOrganizationsTitle")}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t("noOrganizationsDescription")}</p>
      <Link href="/organization/sign-up" className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">{t("createOrganizationAction")}</Link>
    </section> : <ul className="grid gap-4 sm:grid-cols-2">{organizations.map((organization) => <li key={organization.id} className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{organization.name}</h2>
      <Link href={`/organization/team?organizationId=${organization.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">{t("manageTeamAction")}</Link>
    </li>)}</ul>}
  </main>
}

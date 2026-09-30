import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { OrganizationForm } from "@/components/auth/organization-forms"
import { auth } from "@/lib/auth"

export default async function OrganizationSignUpPage() {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)
  const t = await getTranslations("Auth")
  return <main className="mx-auto min-h-[70vh] max-w-2xl px-5 py-12 sm:py-20">
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
      <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>
      <h1 className="text-3xl font-semibold tracking-tight">{t("organizationTitle")}</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("organizationDescription")}</p>
      <div className="mt-8"><OrganizationForm /></div>
    </div>
  </main>
}

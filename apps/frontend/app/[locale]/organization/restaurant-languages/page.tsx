import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { MenuLanguageSettingsForm } from "@/components/organization/menu-language-settings-form"
import { CatalogTranslationsEditor } from "@/components/organization/catalog-translations-editor"
import { auth } from "@/lib/auth"
import { whitePlateApi } from "@/lib/api"

type MenuLanguageSettings = { tenantId: string; locales: string[]; defaultLocale: string }
type CatalogManagement = {
  categories: { id: string; name: string; isArchived: boolean; translations: Record<string, { name: string; description: string | null }> }[]
  products: { id: string; categoryId: string; name: string; description: string | null; isArchived: boolean; translations: Record<string, { name: string; description: string | null }> }[]
  optionGroups: { id: string; productId: string; name: string; isArchived: boolean; translations: Record<string, { name: string; description: string | null }> }[]
  options: { id: string; groupId: string; name: string; isArchived: boolean; translations: Record<string, { name: string; description: string | null }> }[]
}

export default async function RestaurantMenuLanguagesPage({ searchParams }: {
  searchParams: Promise<{ tenantId?: string }>
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("Auth")
  const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
  if (!query.tenantId || !validUuid.test(query.tenantId)) redirect(`/${locale}/organization`)
  const [response, catalogResponse] = await Promise.all([
    whitePlateApi.get<MenuLanguageSettings>(`/api/v1/tenants/${query.tenantId}/menu-languages`),
    whitePlateApi.get<CatalogManagement>(`/api/v1/tenants/${query.tenantId}/catalog`),
  ])
  if (!response.ok || !response.data || !catalogResponse.ok || !catalogResponse.data) {
    return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16">
      <Link href="/organization" className="text-sm font-medium text-primary underline-offset-4 hover:underline">{t("backToOrganizations")}</Link>
      <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t("menuLanguagesError")}</p>
    </main>
  }

  return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16">
    <Link href="/organization" className="text-sm font-medium text-primary underline-offset-4 hover:underline">{t("backToOrganizations")}</Link>
    <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium text-primary">WhitePlate</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("menuLanguagesTitle")}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t("menuLanguagesDescription")}</p>
      <div className="mt-8">
        <MenuLanguageSettingsForm tenantId={response.data.tenantId} locales={response.data.locales}
          defaultLocale={response.data.defaultLocale} />
        <CatalogTranslationsEditor tenantId={response.data.tenantId} locales={response.data.locales}
          defaultLocale={response.data.defaultLocale} catalog={catalogResponse.data} />
      </div>
    </section>
  </main>
}

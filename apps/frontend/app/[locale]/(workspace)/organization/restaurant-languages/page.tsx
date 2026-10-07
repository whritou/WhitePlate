import { CatalogTranslationsEditor } from "@/components/organization/catalog-translations-editor"
import { BackLink } from "@/components/organization/back-link"
import { MenuLanguageSettings } from "@/components/organization/menu-language-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import {
  getCatalog,
  getMenuLanguageSettings,
} from "@/services/organization-queries"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function RestaurantMenuLanguagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const [t, catalogT] = await Promise.all([
    getTranslations("Auth"),
    getTranslations("Catalog"),
  ])

  if (!isUuid(query.tenantId)) redirect(`/${locale}/organization`)

  const [response, catalogResponse] = await Promise.all([
    getMenuLanguageSettings(query.tenantId),
    getCatalog(query.tenantId),
  ])

  if (
    !response.ok ||
    !response.data ||
    !catalogResponse.ok ||
    !catalogResponse.data
  ) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl p-4 sm:p-6 lg:p-8">
        <BackLink label={t("backToOrganizations")} />

        <Alert variant="destructive" role="alert" className="mt-6">
          <AlertDescription>{t("menuLanguagesError")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid justify-items-start">
          <BackLink label={t("backToOrganizations")} className="mb-1" />

          <h1 className="text-2xl font-semibold sm:text-[2rem]">
            {t("menuLanguagesTitle")}
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("menuLanguagesDescription")}
          </p>
        </div>

        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={`/organization/catalog?tenantId=${encodeURIComponent(response.data.tenantId)}`}
            />
          }
        >
          <Package aria-hidden="true" />

          {catalogT("catalogLink")}
        </Button>
      </header>

      <MenuLanguageSettings
        tenantId={response.data.tenantId}
        locales={response.data.locales}
        defaultLocale={response.data.defaultLocale}
      />

      <CatalogTranslationsEditor
        tenantId={response.data.tenantId}
        locales={response.data.locales}
        defaultLocale={response.data.defaultLocale}
        catalog={catalogResponse.data}
      />
    </main>
  )
}

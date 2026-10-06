import { CatalogTranslationsEditor } from "@/components/organization/catalog-translations-editor"
import { MenuLanguageSettingsForm } from "@/components/organization/menu-language-settings-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

  const t = await getTranslations("Auth")

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
        <Link
          href="/organization"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("backToOrganizations")}
        </Link>

        <Alert variant="destructive" role="alert" className="mt-6">
          <AlertDescription>{t("menuLanguagesError")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/organization"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("backToOrganizations")}
      </Link>

      <Card className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-8">
        <CardHeader className="px-0">
          <p className="text-sm font-medium text-primary">WhitePlate</p>

          <CardTitle>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {t("menuLanguagesTitle")}
            </h1>
          </CardTitle>

          <CardDescription className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("menuLanguagesDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          <div className="mt-8">
            <MenuLanguageSettingsForm
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
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

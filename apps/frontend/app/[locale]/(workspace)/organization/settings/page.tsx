import { OrganizationSettingsForm } from "@/components/organization/organization-settings-form"
import { BackLink } from "@/components/organization/back-link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import { getOrganizations } from "@/services/organization-queries"
import type { SearchParams } from "@/types/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("OrganizationSettings")
  const organizationId = params.organizationId

  if (!isUuid(organizationId)) {
    return (
      <OrganizationMessage title={t("notFoundTitle")} message={t("notFound")} />
    )
  }

  const response = await getOrganizations()

  if (!response.ok) {
    if (response.status === 401) redirect(`/${locale}/sign-in`)

    return (
      <OrganizationMessage
        title={t("notFoundTitle")}
        message={t("serviceError")}
      />
    )
  }

  if (!response.data) {
    return (
      <OrganizationMessage
        title={t("notFoundTitle")}
        message={t("serviceError")}
      />
    )
  }

  const organization = response.data.find((item) => item.id === organizationId)

  if (!organization) {
    return (
      <OrganizationMessage title={t("notFoundTitle")} message={t("notFound")} />
    )
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl p-4 sm:p-6 lg:p-8">
      <BackLink label={t("backToOrganizations")} />

      <Card className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-10">
        <CardHeader className="px-0">
          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
          </CardTitle>

          <CardDescription className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          <OrganizationSettingsForm
            key={`${organization.id}:${organization.name}`}
            organizationId={organization.id}
            organizationName={organization.name}
            organizationActive={organization.isActive}
          />
        </CardContent>
      </Card>
    </main>
  )
}

function OrganizationMessage({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl p-4 sm:p-6 lg:p-8">
      <Card className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <Alert variant="destructive" role="alert" className="mt-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </Card>
    </main>
  )
}

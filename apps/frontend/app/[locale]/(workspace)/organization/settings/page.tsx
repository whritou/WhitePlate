import { LiveSettings } from "@/components/organization/live-settings"
import { OrganizationSettingsForm } from "@/components/organization/organization-settings-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
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
    <LiveSettings
      key={`${session.user.id}:${organization.id}`}
      organization={organization}
      userId={session.user.id}
    >
      <OrganizationSettingsForm
        key={`${organization.id}:${organization.name}`}
        organizationId={organization.id}
        organizationName={organization.name}
        organizationActive={organization.isActive}
      />
    </LiveSettings>
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

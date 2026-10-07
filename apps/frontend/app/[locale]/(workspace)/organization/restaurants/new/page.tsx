import { RestaurantForm } from "@/components/organization/restaurant-form"
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
import type { RestaurantPageProps } from "@/types/restaurant"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function NewRestaurantPage({
  searchParams,
}: RestaurantPageProps) {
  const [locale, query, t] = await Promise.all([
    getLocale(),
    searchParams,
    getTranslations("Restaurants"),
  ])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)
  if (!isUuid(query.organizationId)) redirect(`/${locale}/organization`)

  const organizations = await getOrganizations()
  const organization = organizations.ok
    ? organizations.data?.find((item) => item.id === query.organizationId)
    : null

  return (
    <main className="mx-auto min-h-[70vh] max-w-2xl p-4 sm:p-6 lg:p-8">
      <BackLink label={t("back")} />

      {organization ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <h1>{t("title")}</h1>
            </CardTitle>

            <CardDescription>
              {t("description", { organization: organization.name })}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <RestaurantForm organizationId={organization.id} />
          </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive" role="alert" className="mt-6">
          <AlertDescription>
            {t(`errors.${organizations.ok ? "forbidden" : "unavailable"}`)}
          </AlertDescription>
        </Alert>
      )}
    </main>
  )
}

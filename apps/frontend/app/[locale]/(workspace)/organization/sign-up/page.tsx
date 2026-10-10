import { OrganizationForm } from "@/components/auth/organization-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function OrganizationSignUpPage() {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("Auth")

  return (
    <main className="live-create-page mx-auto min-h-[70vh] max-w-3xl px-6 py-8">
      <Card className="gap-6 border-0 bg-transparent p-0 shadow-none">
        <CardHeader className="px-0">
          <p className="mb-2 text-sm font-medium text-brand-text">WhitePlate</p>

          <CardTitle>
            <h1 className="font-display text-4xl font-bold">
              {t("organizationTitle")}
            </h1>
          </CardTitle>

          <CardDescription className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {t("organizationDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          <div className="mt-8">
            <OrganizationForm />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

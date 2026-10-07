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
    <main className="mx-auto min-h-[70vh] max-w-2xl px-5 py-12 sm:py-20">
      <Card className="rounded-lg border border-border bg-card p-6 sm:p-10">
        <CardHeader className="px-0">
          <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>

          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
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

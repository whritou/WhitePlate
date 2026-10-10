import { AuthFrame } from "@/components/auth/auth-frame"
import { BackLink } from "@/components/organization/back-link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import { ShieldAlert } from "lucide-react"

export default async function UnauthorizedPage() {
  const t = await getTranslations("StatusPages")

  return (
    <AuthFrame>
      <section className="grid min-h-[70vh] place-items-center p-4 sm:p-6">
        <Card className="w-full max-w-xl p-6 sm:p-10">
          <CardHeader className="px-0">
            <ShieldAlert
              aria-hidden="true"
              className="mb-4 size-9 text-destructive"
            />

            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
                {t("unauthorizedTitle")}
              </h1>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 px-0">
            <p className="max-w-prose text-sm leading-6 text-muted-foreground">
              {t("unauthorizedDescription")}
            </p>

            <BackLink label={t("backToOrganizations")} />
          </CardContent>
        </Card>
      </section>
    </AuthFrame>
  )
}

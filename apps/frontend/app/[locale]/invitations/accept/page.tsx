import { Button } from "@/components/ui/button"

import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const query = await searchParams
  const t = await getTranslations("Auth")
  const token = query.token ?? ""
  const validToken = /^[a-f0-9]{64}$/i.test(token)
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-2xl content-center px-5 py-12">
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <CardHeader className="px-0">
          <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>

          <CardTitle>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("invitationTitle")}
            </h1>
          </CardTitle>

          <CardDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            {validToken ? t("invitationDescription") : t("invalidInvitation")}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          {validToken && session?.user.emailVerified ? (
            <div className="mt-7">
              <AcceptInvitationForm token={token} />
            </div>
          ) : null}

          {validToken && !session && (
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-10 rounded-lg"
                render={
                  <Link href={`/sign-in?invite=${encodeURIComponent(token)}`} />
                }
              >
                {t("signInAction")}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-10 rounded-lg"
                render={
                  <Link href={`/sign-up?invite=${encodeURIComponent(token)}`} />
                }
              >
                {t("signUpAction")}
              </Button>
            </div>
          )}

          {validToken && session && !session.user.emailVerified && (
            <p className="mt-5 text-sm text-muted-foreground">
              {t("verifyBeforeAccept")}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

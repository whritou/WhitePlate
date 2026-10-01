import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form"
import { auth } from "@/lib/auth"
import { Link } from "@/i18n/navigation"

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
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("invitationTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {validToken ? t("invitationDescription") : t("invalidInvitation")}
        </p>
        {validToken && session?.user.emailVerified ? (
          <div className="mt-7">
            <AcceptInvitationForm token={token} />
          </div>
        ) : null}
        {validToken && !session && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/sign-in?invite=${encodeURIComponent(token)}`}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {t("signInAction")}
            </Link>
            <Link
              href={`/sign-up?invite=${encodeURIComponent(token)}`}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium"
            >
              {t("signUpAction")}
            </Link>
          </div>
        )}
        {validToken && session && !session.user.emailVerified && (
          <p className="mt-5 text-sm text-muted-foreground">
            {t("verifyBeforeAccept")}
          </p>
        )}
      </section>
    </main>
  )
}

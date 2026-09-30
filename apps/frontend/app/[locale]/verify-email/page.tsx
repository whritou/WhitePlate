import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

export default async function VerifyEmailPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  const t = await getTranslations("Auth")
  const invalid = Boolean(query.error)
  return <main className="mx-auto grid min-h-[60vh] max-w-xl content-center px-5 py-16 text-center">
    <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>
    <h1 className="text-3xl font-semibold tracking-tight">{invalid ? t("verificationInvalidTitle") : t("verificationPendingTitle")}</h1>
    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{invalid ? t("verificationInvalidDescription") : t("verificationPendingDescription")}</p>
    <Link href="/sign-in" className="mx-auto mt-7 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">{t("backToSignIn")}</Link>
  </main>
}

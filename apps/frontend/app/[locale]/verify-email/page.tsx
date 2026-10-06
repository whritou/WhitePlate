import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  const t = await getTranslations("Auth")
  const invalid = Boolean(query.error)

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-xl content-center px-5 py-16 text-center">
      <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
        {invalid
          ? t("verificationInvalidTitle")
          : t("verificationPendingTitle")}
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {invalid
          ? t("verificationInvalidDescription")
          : t("verificationPendingDescription")}
      </p>

      <Button
        size="lg"
        className="mx-auto mt-7"
        nativeButton={false}
        render={<Link href="/sign-in" />}
      >
        {t("backToSignIn")}
      </Button>
    </main>
  )
}

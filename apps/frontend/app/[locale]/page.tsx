import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

export async function generateMetadata() {
  const t = await getTranslations("HomePage")

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function Page() {
  const t = await getTranslations("HomePage")

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-3xl min-w-0 flex-col gap-8">
        <nav className="flex gap-3" aria-label={t("languageSelector")}>
          <Link href="/" locale="en" lang="en">
            {t("english")}
          </Link>
          <Link href="/" locale="fr" lang="fr">
            {t("french")}
          </Link>
        </nav>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-sm font-medium text-primary">WhitePlate</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{t("description")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("getStarted")}</Link>
            <Link href="/sign-in" className="inline-flex h-11 items-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{t("signIn")}</Link>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {t("themeHint", { key: "d" })}
        </p>
      </div>
    </main>
  )
}

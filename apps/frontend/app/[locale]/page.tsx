import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

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
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <nav className="flex gap-3" aria-label={t("languageSelector")}>
          <Link href="/" locale="en" lang="en">
            {t("english")}
          </Link>
          <Link href="/" locale="fr" lang="fr">
            {t("french")}
          </Link>
        </nav>
        <div>
          <h1 className="font-medium">{t("title")}</h1>
          <p>{t("ready")}</p>
          <p>{t("buttonAvailable")}</p>
          <Button className="mt-2">{t("button")}</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {t("themeHint", { key: "d" })}
        </div>
      </div>
    </div>
  )
}

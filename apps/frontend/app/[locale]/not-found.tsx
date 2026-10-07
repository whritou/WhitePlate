import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { FileQuestion, Home } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function NotFoundPage() {
  const t = await getTranslations("StatusPages")

  return (
    <main className="grid min-h-[70vh] place-items-center p-4 sm:p-6">
      <section
        data-not-found-page="localized"
        className="grid w-full max-w-3xl gap-6 rounded-lg border border-border bg-card p-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 sm:p-10"
      >
        <div className="grid size-14 place-items-center rounded-lg bg-accent text-primary">
          <FileQuestion aria-hidden="true" className="size-7" />
        </div>

        <div className="grid justify-items-start gap-4">
          <p className="text-sm font-semibold text-primary">404</p>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
            {t("notFoundTitle")}
          </h1>

          <p className="max-w-prose text-sm leading-6 text-muted-foreground">
            {t("notFoundDescription")}
          </p>

          <Button
            className="w-fit"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <Home aria-hidden="true" />

            {t("home")}
          </Button>
        </div>
      </section>
    </main>
  )
}

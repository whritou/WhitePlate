import { AuthFrame } from "@/components/auth/auth-frame"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { FileQuestion, Home } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function NotFoundPage() {
  const t = await getTranslations("StatusPages")

  return (
    <AuthFrame aside>
      <div data-not-found-page="localized" className="grid gap-6">
        <div className="grid size-14 place-items-center border bg-secondary">
          <FileQuestion aria-hidden="true" className="size-7" />
        </div>

        <div className="grid gap-3">
          <p className="label-mono text-primary">404</p>

          <h1 className="font-display text-4xl font-bold">
            {t("notFoundTitle")}
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            {t("notFoundDescription")}
          </p>
        </div>

        <Button
          nativeButton={false}
          role="link"
          render={<Link href="/" />}
        >
          <Home aria-hidden="true" />
          {t("home")}
        </Button>
      </div>
    </AuthFrame>
  )
}

import { AuthFrame } from "@/components/auth/auth-frame"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { ShieldAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function UnauthorizedPage() {
  const t = await getTranslations("StatusPages")

  return (
    <AuthFrame aside>
      <div data-unauthorized-page className="grid gap-6">
        <div className="grid size-14 place-items-center border border-destructive/40 bg-destructive/10 text-destructive">
          <ShieldAlert aria-hidden="true" className="size-7" />
        </div>

        <div className="grid gap-3">
          <p className="label-mono text-destructive">403</p>

          <h1 className="font-display text-4xl font-bold">
            {t("unauthorizedTitle")}
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            {t("unauthorizedDescription")}
          </p>
        </div>

        <Button
          variant="outline"
          nativeButton={false}
          role="link"
          render={<Link href="/organization" />}
        >
          {t("backToOrganizations")}
        </Button>
      </div>
    </AuthFrame>
  )
}

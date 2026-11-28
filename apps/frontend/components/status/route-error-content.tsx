"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Home, RotateCcw, TriangleAlert } from "lucide-react"
import { AuthFrame } from "@/components/auth/auth-frame"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export function RouteErrorContent({
  digest,
  onRetry,
}: {
  digest?: string
  onRetry: () => void
}) {
  const t = useTranslations("StatusPages")
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <AuthFrame aside>
      <div data-error-page="localized" role="alert" className="grid gap-6">
        <div className="grid size-14 place-items-center border bg-secondary">
          <TriangleAlert aria-hidden="true" className="size-7" />
        </div>

        <div className="grid gap-3">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-4xl font-bold outline-none"
          >
            {t("errorTitle")}
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            {t("errorDescription")}
          </p>

          {digest && (
            <p className="label-mono text-muted-foreground">
              {t("errorReference", { digest })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />

            {t("retry")}
          </Button>

          <Button
            variant="outline"
            nativeButton={false}
            role="link"
            render={<Link href="/" />}
          >
            <Home aria-hidden="true" />

            {t("home")}
          </Button>
        </div>
      </div>
    </AuthFrame>
  )
}

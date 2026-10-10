"use client"
import type { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { BrandAssetImage } from "@/components/brand/asset-image"
import { VisualScopeProvider } from "@/components/ui/visual-scope"
import { DEFAULT_THEME, themeVariables } from "@/lib/lovable/storeTheme"
import { useTranslations } from "next-intl"

const style = themeVariables(DEFAULT_THEME)

export function LiveCustomerShell({
  name,
  children,
  headerActions,
}: {
  name?: string
  children: ReactNode
  headerActions?: ReactNode
}) {
  const t = useTranslations("BrandAssets")

  return (
    <VisualScopeProvider
      value={{ className: "lovable-surface lovable-live customer-page", style }}
    >
      <div
        className="lovable-surface lovable-live customer-page min-h-screen"
        style={style}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
          <Link href="/" className="flex max-w-full min-w-0 items-center gap-3">
            {name && (
              <BrandAssetImage
                src="/api/public/brand-assets/logo"
                label={t("logoFallback")}
                className="size-10 shrink-0"
              />
            )}

            <span className="min-w-0 font-display text-xl font-bold wrap-anywhere">
              {name ?? "WhitePlate"}
            </span>
          </Link>

          {headerActions}
        </header>

        {children}

        <footer className="border-t px-6 py-6 text-xs text-muted-foreground">
          <Link href="/">WhitePlate · Click & collect</Link>
        </footer>
      </div>
    </VisualScopeProvider>
  )
}

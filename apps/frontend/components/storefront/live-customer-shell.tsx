"use client"
import type { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { BrandAssetImage } from "@/components/brand/asset-image"
import { VisualScopeProvider } from "@/components/ui/visual-scope"
import { DEFAULT_THEME, themeVariables } from "@/lib/lovable/storeTheme"
import { useTranslations } from "next-intl"
import type { StoreTheme } from "@/types/lovable/storeTheme"

export function LiveCustomerShell({
  name,
  theme = DEFAULT_THEME,
  restaurantSlug,
  homeHref,
  children,
  headerActions,
  showCover = false,
  stickyHeader = false,
}: {
  name?: string
  theme?: StoreTheme
  restaurantSlug?: string
  homeHref?: string
  children: ReactNode
  headerActions?: ReactNode
  showCover?: boolean
  stickyHeader?: boolean
}) {
  const t = useTranslations("BrandAssets")
  const style = themeVariables(theme)

  return (
    <VisualScopeProvider
      value={{ className: "lovable-surface lovable-live customer-page", style }}
    >
      <div
        className="lovable-surface lovable-live customer-page min-h-screen"
        data-button-style={theme.buttonStyle}
        style={style}
      >
        <header
          className={`flex flex-wrap items-center justify-between gap-3 border-b bg-background px-[var(--customer-padding)] py-3 ${stickyHeader ? "sticky top-0 z-30" : ""}`}
        >
          <Link
            href={homeHref ?? (restaurantSlug ? `/${restaurantSlug}` : "/")}
            className="flex max-w-full min-w-0 items-center gap-3"
          >
            {name && theme.logo && (
              <BrandAssetImage
                src={theme.logo}
                label={t("logoFallback")}
                className="size-10 shrink-0"
              />
            )}

            <span
              className="min-w-0 text-xl font-bold wrap-anywhere"
              style={{
                fontFamily: "var(--customer-heading-font)",
                fontWeight: "var(--customer-heading-weight)",
              }}
            >
              {name ?? "WhitePlate"}
            </span>
          </Link>

          {headerActions}
        </header>

        {showCover && theme.showBanner && theme.banner && (
          <div className="customer-cover overflow-hidden">
            <BrandAssetImage
              src={theme.banner}
              label={t("bannerFallback")}
              cover
              className="h-full w-full"
            />
          </div>
        )}

        {children}

        <footer className="border-t px-6 py-6 text-xs text-muted-foreground">
          <Link
            href={homeHref ?? (restaurantSlug ? `/${restaurantSlug}` : "/")}
          >
            WhitePlate · Click & collect
          </Link>
        </footer>
      </div>
    </VisualScopeProvider>
  )
}

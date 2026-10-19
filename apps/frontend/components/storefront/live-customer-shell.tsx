"use client"
import type { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { ShoppingBag } from "lucide-react"
import { Copy } from "@/components/shared/translated-copy"
import { CustomerShell } from "./demo/shared/customer-shell"
import { VisualScopeProvider } from "@/components/ui/visual-scope"
import { DEFAULT_THEME, themeVariables } from "@/lib/lovable/storeTheme"
import type { StoreTheme } from "@/types/lovable/storeTheme"

export function LiveCustomerShell({
  name,
  theme = DEFAULT_THEME,
  restaurantSlug,
  homeHref,
  children,
  headerActions,
  showCover = false,
}: {
  name?: string
  theme?: StoreTheme
  restaurantSlug?: string
  homeHref?: string
  children: ReactNode
  headerActions?: ReactNode
  showCover?: boolean
  stickyHeader?: boolean
  storefrontPage?: boolean
}) {
  const style = themeVariables(theme)

  return (
    <VisualScopeProvider
      value={{
        className: "lovable-surface customer-page",
        style,
        buttonStyle: theme.buttonStyle,
      }}
    >
      <div className="lovable-surface">
        <CustomerShell
          t={{ ...theme, name: name ?? theme.name }}
          showCover={showCover}
          headerActions={
            headerActions ?? (
              <Link
                className="flex items-center gap-2 text-sm"
                href={homeHref ?? (restaurantSlug ? `/${restaurantSlug}` : "/")}
              >
                <ShoppingBag size={16} />
                <Copy> Click & collect</Copy>
              </Link>
            )
          }
        >
          {children}
        </CustomerShell>
      </div>
    </VisualScopeProvider>
  )
}

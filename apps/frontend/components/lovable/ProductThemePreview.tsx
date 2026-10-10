"use client"
import { Copy } from "@/components/lovable/copy"
import { useState } from "react"
import { Link } from "@/components/lovable/navigation"
import { ArrowUpRight, Palette } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { Storefront } from "@/components/lovable/Storefront"
import { CustomerCheckout } from "@/components/lovable/CustomerCheckout"
import { CustomerTracking } from "@/components/lovable/CustomerTracking"
import {
  DEFAULT_THEME,
  PRESETS,
  FONT_LINK,
  type StoreTheme,
} from "@/lib/lovable/storeTheme"
import { DEFAULT_MENU } from "@/lib/lovable/menu"
import { PREVIEW_CART, PREVIEW_ORDER } from "@/lib/lovable/customerOrder"
export function ProductThemePreview() {
  const [selected, setSelected] = useState(0)
  const [page, setPage] = useState<"store" | "checkout" | "tracking">("store")
  const [cart, setCart] = useState(PREVIEW_CART)
  const preset = PRESETS[selected]
  const theme: StoreTheme = {
    ...DEFAULT_THEME,
    ...preset?.theme,
    headingFont: preset?.theme.font ?? DEFAULT_THEME.headingFont,
    bannerHeight: 180,
  }

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Store theme presets">
          <Copy>
            {PRESETS.map((p, i) => (
              <Button
                key={p.label}
                variant={i === selected ? "default" : "outline"}
                size="sm"
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
              >
                <Palette />

                <Copy>{p.label}</Copy>
              </Button>
            ))}
          </Copy>
        </div>

        <Button asChild variant="link">
          <Link to="/studio">
            <Copy>View Studio demo</Copy>

            <ArrowUpRight />
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted px-4 py-3">
          <span className="text-xs text-muted-foreground">
            <Copy>Maison Verte · Customer preview</Copy>
          </span>

          <div className="flex gap-1" aria-label="Customer preview pages">
            <Copy>
              {(
                [
                  ["store", "Store"],
                  ["checkout", "Checkout"],
                  ["tracking", "Order tracking"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={page === value ? "default" : "ghost"}
                  aria-pressed={page === value}
                  onClick={() => setPage(value)}
                >
                  <Copy>{label}</Copy>
                </Button>
              ))}
            </Copy>
          </div>
        </div>

        <div
          className="h-[620px] overflow-auto"
          aria-label="Themed customer experience"
        >
          <Copy>
            {page === "store" ? (
              <Storefront
                key={`store-${selected}`}
                t={theme}
                menu={DEFAULT_MENU}
                preview
              />
            ) : page === "checkout" ? (
              <CustomerCheckout
                key={`checkout-${selected}`}
                t={theme}
                menu={DEFAULT_MENU}
                cart={cart}
                onChange={setCart}
                preview
              />
            ) : (
              <CustomerTracking
                key={`tracking-${selected}`}
                t={theme}
                order={PREVIEW_ORDER}
                preview
              />
            )}
          </Copy>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        <Copy>One brand across your store, checkout and order tracking.</Copy>
      </p>
    </div>
  )
}

export { FONT_LINK }

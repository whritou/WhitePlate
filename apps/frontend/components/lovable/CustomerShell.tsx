"use client"
import { Copy } from "@/components/lovable/copy"
import type { ReactNode } from "react"
import { Link } from "@/components/lovable/navigation"
import { ArrowLeft, MapPin, Phone, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { themeVariables, type StoreTheme } from "@/lib/lovable/storeTheme"
export function CustomerShell({
  t,
  children,
  preview = false,
}: {
  t: StoreTheme
  children: ReactNode
  preview?: boolean
}) {
  return (
    <div
      data-button-style={t.buttonStyle}
      className={`customer-page bg-background text-foreground ${preview ? "min-h-full" : "min-h-screen"}`}
      style={themeVariables(t)}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Copy>
            {t.logo && (
              <img
                src={t.logo}
                alt={`${t.name} logo`}
                className="h-11 w-11 shrink-0 object-contain"
              />
            )}
          </Copy>

          <span className="text-xl font-bold break-words">
            <Copy>{t.name}</Copy>
          </span>
        </div>

        <Copy>
          {preview ? (
            <span className="flex items-center gap-2 text-sm">
              <ShoppingBag size={16} /> <Copy> Click & collect</Copy>
            </span>
          ) : (
            <Button asChild variant="ghost">
              <Link to="/store">
                <ArrowLeft /> <Copy> Menu</Copy>
              </Link>
            </Button>
          )}
        </Copy>
      </header>

      <Copy>
        {t.showBanner && t.banner && (
          <div className="customer-cover overflow-hidden">
            <img
              src={t.banner}
              alt={`${t.name} restaurant`}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </Copy>

      <div className="customer-shell-content mx-auto max-w-5xl px-5 py-8">
        <Copy>{children}</Copy>
      </div>

      <footer className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 border-t px-6 py-6 text-sm text-muted-foreground">
        <span className="flex items-start gap-2">
          <MapPin size={16} className="shrink-0" />

          <Copy>{t.address}</Copy>
        </span>

        <a
          href={`tel:${t.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-2"
        >
          <Phone size={16} />

          <Copy>{t.phone}</Copy>
        </a>
      </footer>
    </div>
  )
}

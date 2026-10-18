"use client"
import { Storefront } from "@/components/storefront/demo/storefront/storefront"
import { Link } from "@/components/demo/shared/navigation"
import { useStoreTheme } from "@/hooks/lovable/use-store-theme"
import { Copy } from "@/components/shared/translated-copy"
export function StorePage() {
  const { theme, menu } = useStoreTheme()

  return (
    <div className="relative min-h-screen">
      <Storefront t={theme} menu={menu} />

      <Link to="/studio" className="btn-primary fixed right-4 bottom-4 z-10">
        <Copy>Edit in Studio</Copy>
      </Link>
    </div>
  )
}

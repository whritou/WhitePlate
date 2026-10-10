"use client"
import { useStorefrontView } from "./Storefront-Storefront-context"
import { StorefrontSection7 } from "./Storefront-Storefront-section-7"
export function StorefrontSection6() {
  const { setCartOpen } = useStorefrontView()

  return (
    <div
      className="absolute inset-0 z-30 flex justify-end"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={() => setCartOpen(false)}
    >
      <StorefrontSection7 />
    </div>
  )
}

"use client"
import { useStorefrontView } from "./Storefront-Storefront-context"
import { StorefrontSection6 } from "./Storefront-Storefront-section-6"
export function StorefrontSection5() {
  const { cartOpen } = useStorefrontView()

  return <>{cartOpen && <StorefrontSection6 />}</>
}

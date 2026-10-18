"use client"
import { useStorefrontView } from "./context"
import { StorefrontSection6 } from "./section-6"
export function StorefrontSection5() {
  const { cartOpen } = useStorefrontView()

  return <>{cartOpen && <StorefrontSection6 />}</>
}

"use client"
import { type StoreTheme } from "@/lib/lovable/storeTheme"
import { DEFAULT_MENU, type MenuData } from "@/lib/lovable/menu"
import { useStorefrontModel } from "./Storefront-Storefront-model"
import { StorefrontProvider } from "./Storefront-Storefront-context"
import { StorefrontView } from "./Storefront-Storefront-view"
export function Storefront({
  t,
  menu = DEFAULT_MENU,
  preview = false,
}: {
  t: StoreTheme
  menu?: MenuData
  preview?: boolean
}) {
  const model = useStorefrontModel({ t, menu, preview })

  return (
    <StorefrontProvider model={model}>
      <StorefrontView />
    </StorefrontProvider>
  )
}

export { UI, ProductModal } from "./Storefront-shared"

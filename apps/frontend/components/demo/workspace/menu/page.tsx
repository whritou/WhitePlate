"use client"
import { useMenuPageModel } from "./model"
import { MenuPageProvider } from "./context"
import { MenuPageView } from "./view"
export function MenuPage() {
  const model = useMenuPageModel()

  return (
    <MenuPageProvider model={model}>
      <MenuPageView />
    </MenuPageProvider>
  )
}

export { TAXES, TAGS, uid, input, countMissing, Images, F } from "./shared"

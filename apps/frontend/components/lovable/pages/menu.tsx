"use client"
import { useMenuPageModel } from "./menu-MenuPage-model"
import { MenuPageProvider } from "./menu-MenuPage-context"
import { MenuPageView } from "./menu-MenuPage-view"
export function MenuPage() {
  const model = useMenuPageModel()

  return (
    <MenuPageProvider model={model}>
      <MenuPageView />
    </MenuPageProvider>
  )
}

export { TAXES, TAGS, uid, input, countMissing, Images, F } from "./menu-shared"

"use client"
import { useDemoDraft } from "@/hooks/lovable/use-demo-draft"
import { useState } from "react"
import { PREVIEW_CART } from "@/lib/lovable/customerOrder"
import { DEFAULT_MENU, loadMenu, type MenuData } from "@/lib/lovable/menu"
import {
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  type StoreTheme,
} from "@/lib/lovable/storeTheme"
export function useStudioPageModel() {
  const [t, setT] = useDemoDraft<StoreTheme>(DEFAULT_THEME, loadTheme)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [page, setPage] = useState<"store" | "checkout" | "tracking">("store")
  const [previewCart, setPreviewCart] = useState(PREVIEW_CART)
  const [saved, setSaved] = useState(true)
  const [dnsOpen, setDnsOpen] = useState(false)
  const [panel, setPanel] = useState<"design" | "brand">("design")
  const [menu, setMenu] = useDemoDraft<MenuData>(DEFAULT_MENU, loadMenu)

  const set = (p: Partial<StoreTheme>) => {
    setT((x) => ({ ...x, ...p }))
    setSaved(false)
  }

  const publish = () => {
    if (saveTheme(t)) setSaved(true)
    else alert("Your images are too large to save. Try smaller image files.")
  }

  return {
    t,
    setT,
    device,
    setDevice,
    page,
    setPage,
    previewCart,
    setPreviewCart,
    saved,
    setSaved,
    dnsOpen,
    setDnsOpen,
    panel,
    setPanel,
    menu,
    setMenu,
    set,
    publish,
  }
}

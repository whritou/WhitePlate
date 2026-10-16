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
import type { StudioController } from "@/types/theme"
export function useStudioPageModel(
  storageKey?: string,
  controller?: StudioController
) {
  const [t, setT] = useDemoDraft<StoreTheme>(DEFAULT_THEME, () =>
    controller ? DEFAULT_THEME : loadTheme(storageKey)
  )
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [page, setPage] = useState<"store" | "checkout" | "tracking">("store")
  const [previewCart, setPreviewCart] = useState(PREVIEW_CART)
  const [saved, setSaved] = useState(true)
  const [dnsOpen, setDnsOpen] = useState(false)
  const [panel, setPanel] = useState<"design" | "brand">("design")
  const [menu, setMenu] = useDemoDraft<MenuData>(DEFAULT_MENU, () =>
    storageKey || controller ? DEFAULT_MENU : loadMenu()
  )

  const set = (p: Partial<StoreTheme>) => {
    setT((x) => ({ ...x, ...p }))
    setSaved(false)
  }

  const saveDemo = () => {
    if (saveTheme(t, storageKey)) setSaved(true)
    else alert("Your images are too large to save. Try smaller image files.")
  }

  const discardDemo = () => {
    setT(loadTheme(storageKey))
    setSaved(true)
  }

  return {
    isLive: Boolean(storageKey || controller),
    connected: Boolean(controller),
    locked: controller?.locked ?? false,
    saving: controller?.saving ?? false,
    publishing: controller?.publishing ?? false,
    canPublish: controller?.canPublish ?? false,
    logoPreset: controller?.logoPreset,
    t: controller?.theme ?? t,
    setT,
    device,
    setDevice,
    page,
    setPage,
    previewCart,
    setPreviewCart,
    saved: controller?.saved ?? saved,
    setSaved,
    dnsOpen,
    setDnsOpen,
    panel,
    setPanel,
    menu,
    setMenu,
    set: controller?.set ?? set,
    saveDraft: controller?.saveDraft ?? saveDemo,
    publish: controller?.publish ?? (() => undefined),
    discard: controller?.discard ?? discardDemo,
  }
}

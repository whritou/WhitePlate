"use client"

import { useDemoDraft } from "./use-demo-draft"
import { DEFAULT_THEME, loadTheme } from "@/lib/lovable/storeTheme"
import { DEFAULT_MENU, loadMenu } from "@/lib/lovable/menu"
export function useStoreTheme() {
  const [theme] = useDemoDraft(DEFAULT_THEME, loadTheme)
  const [menu] = useDemoDraft(DEFAULT_MENU, loadMenu)

  return { theme, menu }
}

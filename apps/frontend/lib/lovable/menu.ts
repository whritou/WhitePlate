import { DEFAULT_MENU } from "./sample-menu"
export { DEFAULT_MENU } from "./sample-menu"
import type { Tr, MenuData } from "@/types/lovable/menu"
export type {
  Tr,
  Choice,
  Option,
  Product,
  Category,
  Allergen,
  Discount,
  MenuData,
} from "@/types/lovable/menu"

export const LANGS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
}
export function tx<T extends { tr?: Tr }>(
  o: T,
  field: keyof T & string,
  lang: string
): string {
  return o.tr?.[lang]?.[field] || String(o[field] ?? "")
}

const KEY = "whiteplate-lovable-demo-menu-v2"

export function loadMenu(): MenuData {
  try {
    const r = localStorage.getItem(KEY)

    return r ? { ...DEFAULT_MENU, ...JSON.parse(r) } : DEFAULT_MENU
  } catch {
    return DEFAULT_MENU
  }
}

export function saveMenu(m: MenuData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))

    return true
  } catch {
    return false
  }
}

export function applyDiscount(
  m: MenuData,
  code: string,
  subtotal: number
): { ok: boolean; amount: number; msg: string } {
  const d = m.discounts.find(
    (x) => x.code.toUpperCase() === code.trim().toUpperCase()
  )

  if (!d || !d.active) return { ok: false, amount: 0, msg: "Invalid code" }
  if (d.expires && new Date(d.expires + "T23:59:59") < new Date())
    return { ok: false, amount: 0, msg: "Code expired" }
  if (subtotal < d.min)
    return { ok: false, amount: 0, msg: `Minimum order €${d.min}` }

  const amount =
    d.type === "percent"
      ? (subtotal * d.value) / 100
      : Math.min(d.value, subtotal)

  return {
    ok: true,
    amount,
    msg: d.type === "percent" ? `-${d.value}%` : `-€${d.value}`,
  }
}

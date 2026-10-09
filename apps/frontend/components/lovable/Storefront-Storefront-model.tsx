"use client"
import { useDemoDraft, useDemoHydrated } from "@/hooks/lovable/use-demo-draft"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { useNavigate } from "@/components/lovable/navigation"
import { readCart, writeCart, type CartLine } from "@/lib/lovable/customerOrder"
import { type StoreTheme } from "@/lib/lovable/storeTheme"
import {
  DEFAULT_MENU,
  applyDiscount,
  type MenuData,
  type Product,
} from "@/lib/lovable/menu"
import { UI } from "./Storefront-shared"
export function useStorefrontModel({
  t,
  menu = DEFAULT_MENU,
  preview = false,
}: {
  t: StoreTheme
  menu?: MenuData
  preview?: boolean
}) {
  const navigate = useNavigate()
  const locale = useLocale()
  const [lang, setLang] = useState(
    menu.languages.includes(locale) ? locale : (menu.languages[0] ?? "en")
  )
  const [lines, setLines] = useDemoDraft<CartLine[]>([], () =>
    preview ? [] : readCart().lines
  )
  const cartLoaded = useDemoHydrated()

  const [cat, setCat] = useState("all")
  const [open, setOpen] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [code, setCode] = useState("")
  const [applied, setApplied] = useDemoDraft("", () =>
    preview ? "" : readCart().code
  )
  const [checkoutError, setCheckoutError] = useState("")

  useEffect(() => {
    if (cartLoaded && !preview) writeCart({ lines, code: applied, lang })
  }, [lines, applied, lang, cartLoaded, preview])

  const u = (k: string) => UI[lang]?.[k] ?? UI["en"]?.[k] ?? k
  const MENU = menu.categories
    .map((c) => ({ ...c, items: c.items.filter((i) => i.available !== false) }))
    .filter((c) => c.items.length)
  const allergen = (id: string) => menu.allergens.find((a) => a.id === id)
  const r = `${t.radius}px`
  const muted = `color-mix(in oklab, ${t.text} 60%, transparent)`
  const line = `color-mix(in oklab, ${t.text} 12%, transparent)`
  const count = lines.reduce((a, l) => a + l.qty, 0)
  const subtotal = lines.reduce((a, l) => a + l.qty * l.unit, 0)
  const disc = applied ? applyDiscount(menu, applied, subtotal) : null
  const total = subtotal - (disc?.ok ? disc.amount : 0)
  const qtyOf = (id: string) =>
    lines.filter((l) => l.product.id === id).reduce((a, l) => a + l.qty, 0)
  const add = (product: Product, picks: string[], unit: number, qty = 1) => {
    const key = product.id + "|" + picks.join(",")

    setLines((ls) =>
      ls.some((l) => l.key === key)
        ? ls.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
        : [...ls, { key, product, picks, unit, qty }]
    )
  }

  const change = (key: string, d: number) =>
    setLines((ls) =>
      ls
        .map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l))
        .filter((l) => l.qty > 0)
    )
  const quickRemove = (id: string) => {
    const last = [...lines].reverse().find((l) => l.product.id === id)

    if (last) change(last.key, -1)
  }

  const quickAdd = (p: Product) =>
    p.options.length ? setOpen(p) : add(p, [], p.p)
  const btn = { background: t.accent, color: t.text, borderRadius: r }

  return {
    t,
    menu,
    preview,
    navigate,
    lang,
    setLang,
    lines,
    setLines,
    cartLoaded,
    cat,
    setCat,
    open,
    setOpen,
    cartOpen,
    setCartOpen,
    placed,
    setPlaced,
    code,
    setCode,
    applied,
    setApplied,
    checkoutError,
    setCheckoutError,
    u,
    MENU,
    allergen,
    r,
    muted,
    line,
    count,
    subtotal,
    disc,
    total,
    qtyOf,
    add,
    change,
    quickRemove,
    quickAdd,
    btn,
  }
}

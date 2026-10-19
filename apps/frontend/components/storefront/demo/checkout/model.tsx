"use client"
import { useDemoClock, useDemoHydrated } from "@/hooks/lovable/use-demo-draft"
import { useState } from "react"
import { applyDiscount, type MenuData } from "@/lib/lovable/menu"
import type { StoreTheme } from "@/lib/lovable/storeTheme"
import type { CartDraft } from "@/lib/lovable/customerOrder"
import type { CustomerCheckoutBinding } from "@/types/customer-presentation"
import { previewPricing } from "@/lib/checkout/preview-pricing"
export function useCustomerCheckoutModel({
  t,
  menu,
  cart,
  onChange,
  onPlace,
  preview = false,
  binding,
}: {
  t: StoreTheme
  menu: MenuData
  cart: CartDraft
  onChange: (cart: CartDraft) => void
  onPlace?: (details: {
    name: string
    pickup: string
    notes: string
    subtotal: number
    discount: number
    total: number
  }) => void
  preview?: boolean
  binding?: CustomerCheckoutBinding
}) {
  const [name, setName] = useState(preview ? "Alex Martin" : "")
  const ready = useDemoHydrated()
  const [email, setEmail] = useState("")
  const [emailUpdatesConsented, setEmailUpdates] = useState(false)
  const [analyticsConsented, setAnalytics] = useState(false)
  const setEmailUpdatesConsented = (value: boolean) => {
    setEmailUpdates(value)
    if (!value && !analyticsConsented) setEmail("")
  }

  const setAnalyticsConsented = (value: boolean) => {
    setAnalytics(value)
    if (!value && !emailUpdatesConsented) setEmail("")
  }

  const [phone, setPhone] = useState("")
  const [pickup, setPickup] = useState("asap")
  const clock = useDemoClock()
  const parsed = Number.parseInt(t.prepTime, 10)
  const prep = Number.isFinite(parsed) ? Math.max(15, parsed) : 15
  const first = Math.ceil((clock + prep * 60000) / 900000) * 900000
  const slots = Array.from({ length: 4 }, (_, i) =>
    new Date(first + i * 900000).toISOString()
  )
  const setSlots = () => {}

  const [notes, setNotes] = useState("")
  const [code, setCode] = useState(cart.code)
  const [codeError, setCodeError] = useState("")

  const subtotal = cart.lines.reduce((s, l) => s + l.unit * l.qty, 0)
  const discountResult = cart.code
    ? applyDiscount(menu, cart.code, subtotal)
    : null
  const discount = discountResult?.ok ? discountResult.amount : 0
  const { total, taxAmount } = previewPricing(cart.lines, discount)
  const quantity = (key: string, delta: number) =>
    onChange({
      ...cart,
      lines: cart.lines
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    })
  const apply = () => {
    const result = applyDiscount(menu, code, subtotal)

    setCodeError(result.ok ? "" : result.msg)
    if (result.ok) onChange({ ...cart, code: code.trim().toUpperCase() })
  }

  return {
    t,
    ready,
    binding,
    menu,
    cart,
    onChange,
    onPlace,
    preview,
    name,
    setName,
    email,
    setEmail,
    emailUpdatesConsented,
    setEmailUpdatesConsented,
    analyticsConsented,
    setAnalyticsConsented,
    phone,
    setPhone,
    pickup,
    setPickup,
    slots,
    setSlots,
    notes,
    setNotes,
    code,
    setCode,
    codeError,
    setCodeError,
    subtotal,
    discountResult,
    discount,
    total,
    taxAmount,
    quantity,
    apply,
  }
}

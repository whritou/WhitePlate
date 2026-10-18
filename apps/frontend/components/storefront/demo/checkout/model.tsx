"use client"
import { useDemoClock } from "@/hooks/lovable/use-demo-draft"
import { useState } from "react"
import { applyDiscount, type MenuData } from "@/lib/lovable/menu"
import type { StoreTheme } from "@/lib/lovable/storeTheme"
import type { CartDraft } from "@/lib/lovable/customerOrder"
export function useCustomerCheckoutModel({
  t,
  menu,
  cart,
  onChange,
  onPlace,
  preview = false,
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
}) {
  const [name, setName] = useState(preview ? "Alex Martin" : "")
  const [email, setEmail] = useState("")
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
  const total = Math.max(0, subtotal - discount)
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
    menu,
    cart,
    onChange,
    onPlace,
    preview,
    name,
    setName,
    email,
    setEmail,
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
    quantity,
    apply,
  }
}

"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { checkoutGuestOrder } from "@/actions/checkout"
import {
  prepareCheckout,
  updateCart,
  validProductSelection,
  validateOrderInput,
} from "@/lib/checkout/cart"
import type { ApiError } from "@/types/api"
import type { CartItem, CheckoutAttempt, OrderReceipt } from "@/types/checkout"
import type { StorefrontMenu } from "@/types/storefront"

export function useGuestCheckout(menu: StorefrontMenu) {
  const [changingLanguage, startLanguageChange] = useTransition()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null)
  const [orderRound, setOrderRound] = useState(0)
  const attempt = useRef<CheckoutAttempt | null>(null)
  const inFlight = useRef(false)
  const uncertain = error === "unavailable"
  const locked = submitting || uncertain || changingLanguage || receipt !== null
  const products = menu.categories.flatMap((category) => category.products)
  function changeCart(item: CartItem) {
    setCart((current) => updateCart(current, item))
    setError(null)
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const input = {
      customerName,
      discountCode: discountCode || null,
      items: cart,
    }
    if (
      !uncertain &&
      (!validateOrderInput(input) ||
        cart.some((item) => {
          const product = products.find(
            (candidate) => candidate.id === item.productId
          )
          return !product || !validProductSelection(product, item.optionIds)
        }))
    ) {
      setError("invalid")
      return
    }
    const next =
      uncertain && attempt.current
        ? attempt.current
        : prepareCheckout(input, attempt.current, () => crypto.randomUUID())
    attempt.current = next
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    try {
      const result = await checkoutGuestOrder(next.input, next.key)
      if (result.ok && result.receipt.tenantId === menu.tenantId) {
        setReceipt(result.receipt)
        setCart([])
      } else {
        setError(result.ok ? "unavailable" : result.error)
      }
    } catch {
      setError("unavailable")
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  function startNewOrder() {
    setReceipt(null)
    attempt.current = null
    setError(null)
    setCustomerName("")
    setDiscountCode("")
    setOrderRound((round) => round + 1)
  }
  function changeCustomerName(value: string) {
    setCustomerName(value)
    setError(null)
  }
  function changeDiscountCode(value: string) {
    setDiscountCode(value)
    setError(null)
  }

  return {
    changingLanguage,
    startLanguageChange,
    cart,
    customerName,
    discountCode,
    error,
    submitting,
    receipt,
    orderRound,
    locked,
    products,
    changeCart,
    checkout,
    startNewOrder,
    changeCustomerName,
    changeDiscountCode,
  }
}

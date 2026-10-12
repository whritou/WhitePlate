"use client"

import { useEffect, useState, useTransition, type FormEvent } from "react"
import { checkoutGuestOrder } from "@/actions/checkout"
import { loadPublicPickupSlots } from "@/lib/api/pickup-slots-browser"
import { useGuestCheckoutStore } from "@/components/storefront/guest-checkout-provider"
import {
  prepareCheckout,
  createTrackingToken,
  validProductSelection,
  validateOrderInput,
} from "@/lib/checkout/cart"
import type { CartItem, PickupAvailability } from "@/types/checkout"
import type { StorefrontMenu } from "@/types/storefront"

export function useGuestCheckout(menu: StorefrontMenu) {
  const [changingLanguage, startLanguageChange] = useTransition()
  const state = useGuestCheckoutStore((state) => state)
  const [pickupSlotState, setPickupSlotState] = useState<{
    tenantId: string
    availability: PickupAvailability | null
  } | null>(null)
  const pickupSlotsLoading = pickupSlotState?.tenantId !== menu.tenantId
  const pickupAvailability = pickupSlotState?.tenantId === menu.tenantId
    ? pickupSlotState.availability
    : null
  const pickupSlots = pickupAvailability
    ? pickupAvailability.slots
    : []
  const [selectedPickupAt, setSelectedPickupAt] = useState("asap")

  useEffect(() => {
    const controller = new AbortController()

    loadPublicPickupSlots(controller.signal)
      .then((result) => setPickupSlotState({ tenantId: menu.tenantId, availability: result.ok ? result.data : null }))
      .catch(() => setPickupSlotState({ tenantId: menu.tenantId, availability: null }))

    return () => controller.abort()
  }, [menu.tenantId])

  const {
    cart,
    customerName,
    discountCode,
    error,
    submitting,
    receipt,
    orderRound,
  } = state
  const uncertain = error === "unavailable"
  const locked = submitting || uncertain || changingLanguage || receipt !== null
  const products = menu.categories.flatMap((category) => category.products)

  function changeCart(item: CartItem) {
    state.changeCart(item)
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.inFlight) return

    const input = {
      customerName,
      discountCode: discountCode || null,
      menuLocale: menu.locale,
      pickupAt: selectedPickupAt === "asap" ? null : selectedPickupAt,
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
      state.setError("invalid")

      return
    }

    const next =
      uncertain && state.attempt
        ? state.attempt
        : prepareCheckout(
            input,
            state.attempt,
            () => crypto.randomUUID(),
            createTrackingToken
          )

    state.setAttempt(next)
    state.setInFlight(true)
    state.setSubmitting(true)
    state.setError(null)
    try {
      const result = await checkoutGuestOrder(next.input, next.key)

      if (result.ok && result.receipt.tenantId === menu.tenantId) {
        state.setReceipt(result.receipt)
        state.clearCart()
      } else {
        state.setError(result.ok ? "unavailable" : result.error)
      }
    } catch {
      state.setError("unavailable")
    } finally {
      state.setInFlight(false)
      state.setSubmitting(false)
    }
  }

  function startNewOrder() {
    state.startNewOrder()
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
    trackingToken: state.attempt?.input.trackingToken ?? null,
    orderRound,
    locked,
    products,
    pickupSlots: pickupSlots.filter((slot) => slot.remainingCapacity > 0),
    pickupSlotsLoading,
    pickupAvailabilityState: pickupAvailability?.state ?? "no_slots_available",
    selectedPickupAt,
    changePickupAt: setSelectedPickupAt,
    changeCart,
    checkout,
    startNewOrder,
    changeCustomerName: state.changeCustomerName,
    changeDiscountCode: state.changeDiscountCode,
  }
}

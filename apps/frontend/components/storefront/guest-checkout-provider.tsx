"use client"

import { createGuestCheckoutStore } from "@/lib/state/guest-checkout-store"
import type { GuestCheckoutState } from "@/types/state"
import { createContext, useContext, useState } from "react"
import { useStore } from "zustand"
import type { StoreApi } from "zustand/vanilla"

const GuestCheckoutContext = createContext<StoreApi<GuestCheckoutState> | null>(
  null
)

export function GuestCheckoutProvider({
  tenantId,
  children,
}: {
  tenantId: string
  children: React.ReactNode
}) {
  const [store] = useState(() => createGuestCheckoutStore(tenantId))

  return (
    <GuestCheckoutContext.Provider value={store}>
      {children}
    </GuestCheckoutContext.Provider>
  )
}

export function useGuestCheckoutStore<TSelected>(
  selector: (state: GuestCheckoutState) => TSelected
) {
  const store = useContext(GuestCheckoutContext)

  if (!store)
    throw new Error(
      "useGuestCheckoutStore must be used within GuestCheckoutProvider"
    )

  return useStore(store, selector)
}

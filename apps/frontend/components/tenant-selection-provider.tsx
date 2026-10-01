"use client"

import { createTenantSelectionStore } from "@/lib/state/tenant-selection-store"
import type { TenantSelectionState } from "@/types/state"
import { createContext, useContext, useState } from "react"
import { useStore } from "zustand"
import type { StoreApi } from "zustand/vanilla"

const TenantSelectionContext =
  createContext<StoreApi<TenantSelectionState> | null>(null)

export function TenantSelectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [store] = useState(() => createTenantSelectionStore(null))

  return (
    <TenantSelectionContext.Provider value={store}>
      {children}
    </TenantSelectionContext.Provider>
  )
}

export function useTenantSelection<TSelected>(
  selector: (state: TenantSelectionState) => TSelected
) {
  const store = useContext(TenantSelectionContext)

  if (!store)
    throw new Error(
      "useTenantSelection must be used within TenantSelectionProvider"
    )

  return useStore(store, selector)
}

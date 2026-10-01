import type { StoreApi } from "zustand/vanilla"

export type StoreInitializer<TInput, TState> = (
  input: TInput,
  set: StoreApi<TState>["setState"]
) => TState

export type TenantSelectionState = {
  tenantId: string | null
  selectTenant: (tenantId: string | null) => void
}

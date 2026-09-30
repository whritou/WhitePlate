import { createStoreFactory } from "./store-factory"

export type TenantSelectionState = {
  tenantId: string | null
  selectTenant: (tenantId: string | null) => void
}

export const createTenantSelectionStore = createStoreFactory<
  string | null,
  TenantSelectionState
>((initialTenantId, set) => ({
  tenantId: initialTenantId,
  selectTenant: (tenantId) => set({ tenantId }),
}))

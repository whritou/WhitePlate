import { createStoreFactory } from "./store-factory"
import type { TenantSelectionState } from "@/types/state"

export const createTenantSelectionStore = createStoreFactory<
  string | null,
  TenantSelectionState
>((initialTenantId, set) => ({
  tenantId: initialTenantId,
  selectTenant: (tenantId) => set({ tenantId }),
}))

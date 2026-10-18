import type { OrderingOperationsScope } from "@/types/ordering-operations"

export const orderingOperationsQueryKeys = {
  tenant: ({
    userId,
    tenantId,
    locale,
    role,
    permissions,
  }: OrderingOperationsScope) =>
    [
      "whiteplate",
      "ordering-operations",
      userId,
      tenantId.toLowerCase(),
      locale,
      role,
      [...permissions].sort().join(","),
    ] as const,
}

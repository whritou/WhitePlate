import type { OrderingOperationsScope } from "@/types/ordering-operations"

export const orderingOperationsQueryKeys = {
  tenant: ({ userId, tenantId, locale, role }: OrderingOperationsScope) =>
    [
      "whiteplate",
      "ordering-operations",
      userId,
      tenantId.toLowerCase(),
      locale,
      role,
    ] as const,
}

import type { OrderQueryScope, OrderStatus } from "@/types/orders"

export const orderQueryKeys = {
  tenant: ({ userId, tenantId }: OrderQueryScope) =>
    ["whiteplate", "orders", userId, tenantId.toLowerCase()] as const,
  page: (
    scope: OrderQueryScope,
    status: OrderStatus | null,
    cursor: string | null
  ) => [...orderQueryKeys.tenant(scope), scope.locale, status, cursor] as const,
}

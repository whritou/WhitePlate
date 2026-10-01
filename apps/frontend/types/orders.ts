export type OrderStatus =
  "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled"

export type UpdateableOrderStatus = Exclude<OrderStatus, "Pending">

export type OrderSummaryOption = { optionId: string; name: string }

export type OrderSummaryLine = {
  productId: string
  productName: string
  quantity: number
  options: OrderSummaryOption[]
}

export type OrderSummary = {
  id: string
  customerName: string
  currency: string
  total: number
  status: OrderStatus
  version: number
  createdAt: string
  lines: OrderSummaryLine[]
}

export type OrderPage = { items: OrderSummary[]; nextCursor: string | null }

export type RestaurantMembership = {
  id: string
  name: string
  role: "OrganizationOwner" | "Manager" | "Kitchen"
}

export type OrderActionError =
  "unauthorized" | "forbidden" | "invalid" | "conflict" | "unavailable"

export type UpdateOrderStatusResult =
  { ok: true } | { ok: false; error: OrderActionError }

export type OrderLoadError = "forbidden" | "invalid" | "unavailable"

export type OrderDashboardProps = {
  userId: string
  tenantId: string
  tenantName: string
  role: string
  locale: string
  selectedStatus: OrderStatus | null
  cursor: string | null
  page: OrderPage | null
  loadError: OrderLoadError | null
  hubUrl: string | null
}

export type OrderRealtimeStatus =
  "connecting" | "connected" | "reconnecting" | "offline"

export type OrderQueryScope = {
  userId: string
  tenantId: string
  locale: string
}
export type UpdateOrderStatusInput = {
  tenantId: string
  orderId: string
  version: number
  status: UpdateableOrderStatus
}

export type OrderTicketProps = {
  order: OrderSummary
  role: string
  locale: string
  pending: UpdateOrderStatusInput | null
  onUpdate: (input: Omit<UpdateOrderStatusInput, "tenantId">) => Promise<void>
}

export type OrderRealtimeProps = {
  tenantId: string
  hubUrl: string | null
  orders: OrderSummary[]
  onRefresh: () => Promise<void>
}

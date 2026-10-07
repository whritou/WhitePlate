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
  menuLocale: string | null
  total: number
  status: OrderStatus
  version: number
  createdAt: string
  lines: OrderSummaryLine[]
}

export type OrderPage = { items: OrderSummary[]; nextCursor: string | null }
export type OrderHistoryPage = {
  items: OrderSummary[]
  page: number
  pageSize: number
  totalCount: number
}
export type OrderHistoryFilters = {
  tenantId: string
  status: OrderStatus | null
  search: string | null
  from: string | null
  through: string | null
  sort: "createdAt" | "total"
  direction: "asc" | "desc"
  page: number
  pageSize: number
}
export type OrderHistoryTableProps = {
  tenantName: string
  locale: string
  filters: OrderHistoryFilters
  page: OrderHistoryPage
}

export type RestaurantRole = "OrganizationOwner" | "Manager" | "Kitchen"

export type RestaurantMembership = {
  id: string
  name: string
  role: RestaurantRole
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
  role: RestaurantRole
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
  role: RestaurantRole
  locale: string
  pending: UpdateOrderStatusInput | null
  onUpdate: (input: Omit<UpdateOrderStatusInput, "tenantId">) => Promise<void>
  dragAffordance?: import("react").ReactNode
  dragHandlers?: Pick<
    import("react").HTMLAttributes<HTMLElement>,
    | "onPointerDown"
    | "onPointerMove"
    | "onPointerUp"
    | "onPointerCancel"
    | "onLostPointerCapture"
    | "onTouchStart"
    | "onTouchMove"
    | "onTouchEnd"
    | "onTouchCancel"
  >
  headingLevel?: "h2" | "h3"
}

export type OrderKanbanProps = {
  orders: OrderSummary[]
  role: RestaurantRole
  locale: string
  pending: UpdateOrderStatusInput | null
  onUpdate: OrderTicketProps["onUpdate"]
}

export type OrderDragState = {
  order: OrderSummary
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  active: boolean
  destination: string | null
}

export type OrderPendingTouch = {
  identifier: number
  order: OrderSummary
  startX: number
  startY: number
  timer: number
}

export type OrderRealtimeProps = {
  tenantId: string
  hubUrl: string | null
  orders: OrderSummary[]
  onRefresh: () => Promise<void>
}

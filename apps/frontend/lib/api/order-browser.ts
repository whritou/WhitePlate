import { isRecord } from "@/lib/validation/common"
import { browserRequest } from "./browser-request"
import { parseOrderPage } from "@/lib/order-dashboard"
import type { OrderPage, OrderActionError, OrderStatus } from "@/types/orders"

export class OrderRequestError extends Error {
  constructor(readonly code: OrderActionError) {
    super(code)
  }
}

export async function fetchOrderPage(
  tenantId: string,
  status: OrderStatus | null,
  cursor: string | null,
  signal: AbortSignal
): Promise<OrderPage> {
  const query = new URLSearchParams({ tenantId })

  if (status) query.set("status", status)
  if (cursor) query.set("cursor", cursor)

  const response = await browserRequest(`/api/kitchen/orders?${query}`, {
    signal,
  })

  if (response.status === 401) throw new OrderRequestError("unauthorized")
  if (response.status === 403 || response.status === 404)
    throw new OrderRequestError("forbidden")
  if (response.status === 400) throw new OrderRequestError("invalid")
  if (!response.ok) throw new OrderRequestError("unavailable")

  const body = response.data
  const page =
    isRecord(body) && body.ok === true ? parseOrderPage(body.data) : null

  if (!page) throw new OrderRequestError("unavailable")

  return page
}

export async function getSignalRToken(): Promise<string> {
  const response = await browserRequest("/api/kitchen/signalr-token", {
    method: "POST",
  })

  if (!response.ok) throw new Error("SignalR authentication is unavailable.")

  const value = response.data

  if (
    !isRecord(value) ||
    typeof value.accessToken !== "string" ||
    !value.accessToken
  ) {
    throw new Error("SignalR authentication is unavailable.")
  }

  return value.accessToken
}

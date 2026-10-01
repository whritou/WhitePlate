import { isRecord } from "@/lib/validation/common"
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
  const response = await fetch(`/api/kitchen/orders?${query}`, {
    signal,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    headers: { Accept: "application/json" },
  })
  if (response.status === 401) throw new OrderRequestError("unauthorized")
  if (response.status === 403 || response.status === 404)
    throw new OrderRequestError("forbidden")
  if (response.status === 400) throw new OrderRequestError("invalid")
  if (!response.ok) throw new OrderRequestError("unavailable")
  const body: unknown = await response.json()
  const page =
    isRecord(body) && body.ok === true ? parseOrderPage(body.data) : null
  if (!page) throw new OrderRequestError("unavailable")
  return page
}

export async function getSignalRToken(): Promise<string> {
  const response = await fetch("/api/kitchen/signalr-token", {
    method: "POST",
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
    redirect: "error",
  })
  if (!response.ok) throw new Error("SignalR authentication is unavailable.")

  const value: unknown = await response.json()
  if (
    !isRecord(value) ||
    typeof value.accessToken !== "string" ||
    !value.accessToken
  ) {
    throw new Error("SignalR authentication is unavailable.")
  }
  return value.accessToken
}

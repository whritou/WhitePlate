import { isRecord } from "@/lib/validation/common"
import { parseOrderingOperations } from "@/lib/validation/ordering-operations"
import { browserRequest } from "./browser-request"
import type { OrderingOperations } from "@/types/ordering-operations"

export class OrderingOperationsRequestError extends Error {
  constructor(
    readonly code:
      "unauthorized" | "forbidden" | "invalid" | "conflict" | "unavailable"
  ) {
    super(code)
  }
}

export async function fetchOrderingOperations(
  tenantId: string,
  signal: AbortSignal
): Promise<OrderingOperations> {
  const query = new URLSearchParams({ tenantId })
  const response = await browserRequest(
    `/api/kitchen/dashboard/ordering-operations?${query}`,
    { signal }
  )

  if (response.status === 401)
    throw new OrderingOperationsRequestError("unauthorized")
  if (response.status === 403 || response.status === 404)
    throw new OrderingOperationsRequestError("forbidden")
  if (response.status === 400)
    throw new OrderingOperationsRequestError("invalid")
  if (!response.ok) throw new OrderingOperationsRequestError("unavailable")

  const body = response.data
  const data =
    isRecord(body) && body.ok === true
      ? parseOrderingOperations(body.data)
      : null

  if (!data) throw new OrderingOperationsRequestError("unavailable")

  return data
}

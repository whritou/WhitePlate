"use server"

import { parseOrderStatusUpdate } from "@/lib/validation/orders"
import { updateOrderStatus } from "@/services/orders"
import type { UpdateOrderStatusResult } from "@/types/orders"

export async function updateOrderStatusAction(
  input: unknown
): Promise<UpdateOrderStatusResult> {
  const update = parseOrderStatusUpdate(input)

  if (!update) return { ok: false, error: "invalid" }

  return updateOrderStatus(update)
}

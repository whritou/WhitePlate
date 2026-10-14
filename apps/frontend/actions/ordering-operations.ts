"use server"

import { parseOrderingOperationsUpdate } from "@/lib/validation/ordering-operations"
import { updateOrderingOperations } from "@/services/ordering-operations"

export async function updateOrderingOperationsAction(input: unknown) {
  const value = parseOrderingOperationsUpdate(input)

  return value
    ? updateOrderingOperations(value)
    : { ok: false as const, status: 400 as const, error: "invalid" as const }
}

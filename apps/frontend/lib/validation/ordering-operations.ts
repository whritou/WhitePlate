import { isRecord, isUuid } from "./common"
import type {
  OrderingOperations,
  OrderingOperationsUpdate,
} from "@/types/ordering-operations"

export function parseOrderingOperations(
  value: unknown
): OrderingOperations | null {
  if (
    !isRecord(value) ||
    typeof value.acceptingOrders !== "boolean" ||
    typeof value.rushHoldEnabled !== "boolean" ||
    !Number.isSafeInteger(value.rushBufferMinutes) ||
    (value.rushBufferMinutes as number) < 0 ||
    !Number.isSafeInteger(value.version) ||
    (value.version as number) < 1
  )
    return null

  return {
    acceptingOrders: value.acceptingOrders,
    rushHoldEnabled: value.rushHoldEnabled,
    rushBufferMinutes: value.rushBufferMinutes as number,
    version: value.version as number,
  }
}

export function parseOrderingOperationsUpdate(
  value: unknown
): OrderingOperationsUpdate | null {
  if (!isRecord(value)) return null

  const tenantId = value.tenantId

  if (
    !isUuid(tenantId) ||
    !Number.isSafeInteger(value.version) ||
    (value.version as number) < 1 ||
    typeof value.acceptingOrders !== "boolean" ||
    typeof value.rushHoldEnabled !== "boolean"
  )
    return null

  return {
    tenantId,
    version: value.version as number,
    acceptingOrders: value.acceptingOrders,
    rushHoldEnabled: value.rushHoldEnabled,
  }
}

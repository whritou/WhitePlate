import { isRecord, isUuid } from "./common"
import type { PublicOrderSummary } from "@/types/checkout"

const amount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
const label = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 500

function parseOption(value: unknown) {
  if (
    !isRecord(value) ||
    !isUuid(value.optionId) ||
    !label(value.name) ||
    !amount(value.priceAdjustment)
  )
    return null

  return {
    optionId: value.optionId,
    name: value.name,
    priceAdjustment: value.priceAdjustment,
  }
}

function parseLine(value: unknown) {
  if (
    !isRecord(value) ||
    !isUuid(value.productId) ||
    !label(value.productName) ||
    !Number.isInteger(value.quantity) ||
    Number(value.quantity) < 1 ||
    Number(value.quantity) > 99 ||
    !amount(value.subtotal) ||
    !amount(value.total) ||
    !Array.isArray(value.options) ||
    value.options.length > 20
  )
    return null

  const options = value.options.map(parseOption)

  if (options.some((option) => option === null)) return null

  return {
    productId: value.productId,
    productName: value.productName,
    quantity: Number(value.quantity),
    subtotal: value.subtotal,
    total: value.total,
    options: options.filter((option) => option !== null),
  }
}

export function parsePublicOrderSummary(
  value: unknown
): PublicOrderSummary | null {
  if (
    !isRecord(value) ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    !amount(value.subtotal) ||
    !amount(value.discountAmount) ||
    !amount(value.taxAmount) ||
    !amount(value.total) ||
    !Array.isArray(value.lines) ||
    value.lines.length < 1 ||
    value.lines.length > 50
  )
    return null

  const lines = value.lines.map(parseLine)

  if (lines.some((line) => line === null)) return null

  return {
    currency: value.currency,
    subtotal: value.subtotal,
    discountAmount: value.discountAmount,
    taxAmount: value.taxAmount,
    total: value.total,
    lines: lines.filter((line) => line !== null),
  }
}

import { isUuid } from "./common"
import type { DiscountInput } from "@/types/catalog-management"

function decimal(
  value: FormDataEntryValue | null,
  maximum: number
): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value))
    return null

  const amount = Number(value)

  return Number.isFinite(amount) && amount <= maximum ? amount : null
}

export function parseDiscountInput(input: unknown): DiscountInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const rawCode = input.get("code")
  const rawName = input.get("name")
  const rawKind = input.get("kind")
  const kind =
    rawKind === "FixedAmount" || rawKind === "Percentage" ? rawKind : null
  const maximum = kind === "Percentage" ? 100 : 9999999999.99
  const value = decimal(input.get("value"), maximum)
  const minimumOrderAmount = decimal(
    input.get("minimumOrderAmount") ?? "0",
    9999999999.99
  )
  const rawExpiresOn = input.get("expiresOn")
  const expiresOn =
    rawExpiresOn === "" || rawExpiresOn === null
      ? null
      : typeof rawExpiresOn === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(rawExpiresOn) &&
          !Number.isNaN(Date.parse(`${rawExpiresOn}T00:00:00.000Z`)) &&
          new Date(`${rawExpiresOn}T00:00:00.000Z`).toISOString().slice(0, 10) ===
            rawExpiresOn
        ? rawExpiresOn
        : undefined
  const name = typeof rawName === "string" ? rawName.trim() : ""
  const code =
    id !== null
      ? null
      : typeof rawCode === "string" &&
          /^[A-Za-z0-9-]{1,32}$/.test(rawCode.trim())
        ? rawCode.trim().toUpperCase()
        : null

  if (
    !isUuid(tenantId) ||
    (id !== null && !isUuid(id)) ||
    (!id && !code) ||
    !name ||
    name.length > 120 ||
    !kind ||
    value === null ||
    value <= 0 ||
    minimumOrderAmount === null ||
    expiresOn === undefined
  )
    return null

  return { tenantId, id, code, name, kind, value, minimumOrderAmount, expiresOn }
}

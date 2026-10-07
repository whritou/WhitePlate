import type { OptionalOrderHistoryDate } from "@/types/orders"

export function parseOptionalOrderHistoryDate(
  value: string | null | undefined
): OptionalOrderHistoryDate {
  if (value === undefined || value === "") return { ok: true, value: null }
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false }

  const parsed = new Date(`${value}T00:00:00Z`)

  return !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
    ? { ok: true, value }
    : { ok: false }
}

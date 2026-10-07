import { expect, it } from "vitest"
import { parseOptionalOrderHistoryDate } from "./order-history-filters"

it("accepts an omitted date filter", () => {
  expect(parseOptionalOrderHistoryDate(undefined)).toEqual({
    ok: true,
    value: null,
  })
  expect(parseOptionalOrderHistoryDate("")).toEqual({ ok: true, value: null })
})

it("accepts a valid date and rejects invalid or repeated values", () => {
  expect(parseOptionalOrderHistoryDate("2026-10-07")).toEqual({
    ok: true,
    value: "2026-10-07",
  })
  expect(parseOptionalOrderHistoryDate("2026-02-30")).toEqual({ ok: false })
  expect(parseOptionalOrderHistoryDate(null)).toEqual({ ok: false })
})

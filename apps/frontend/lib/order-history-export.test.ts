import { expect, it } from "vitest"
import { historyCsv, historyAmounts } from "./order-history-export"
import type { OrderSummary } from "@/types/orders"

const order: OrderSummary = {
  id: "abc",
  customerName: '=HYPERLINK("evil")',
  currency: "EUR",
  total: 12,
  status: "Completed",
  createdAt: "2026-10-10T10:00:00Z",
  lines: [],
  version: 1,
  menuLocale: "en",
}

it("exports escaped snapshots and neutralizes spreadsheet formulas", () => {
  expect(historyCsv([order])).toContain('"\'=HYPERLINK(""evil"")"')
  expect(historyCsv([])).toBe(
    '"Order","Date","Customer","Status","Currency","Total","Items"'
  )
})
it("keeps page amounts and averages separated by currency", () => {
  expect(
    historyAmounts([
      order,
      { ...order, total: 8 },
      { ...order, currency: "USD", total: 5 },
    ])
  ).toEqual([
    { currency: "EUR", total: 20, average: 10 },
    { currency: "USD", total: 5, average: 5 },
  ])
  expect(historyAmounts([])).toEqual([])
})

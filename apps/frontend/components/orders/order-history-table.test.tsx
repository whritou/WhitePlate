import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { OrderHistoryFilters, OrderHistoryPage } from "@/types/orders"
import { OrderHistoryTable } from "./order-history-table"

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) =>
      key === "resultsTitle" ? `Orders (${values?.count})` : key,
}))

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react")

  return {
    Link: ({ href, children, ...props }: Record<string, unknown>) =>
      React.createElement("a", { href, ...props }, children as React.ReactNode),
  }
})

const filters: OrderHistoryFilters = {
  tenantId: "33333333-3333-4333-8333-333333333333",
  status: "Completed",
  search: "Ada Lovelace",
  from: "2026-10-01",
  through: "2026-10-07",
  sort: "createdAt",
  direction: "desc",
  page: 2,
  pageSize: 1,
}

const page: OrderHistoryPage = {
  page: 2,
  pageSize: 1,
  totalCount: 2,
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      customerName: "Ada Lovelace",
      currency: "EUR",
      menuLocale: "en",
      total: 19.25,
      status: "Completed",
      version: 4,
      createdAt: "2026-10-05T10:30:00Z",
      lines: [],
    },
  ],
}

it("renders filters, terminal status, sortable columns and preserved page navigation", () => {
  const html = renderToStaticMarkup(
    createElement(OrderHistoryTable, {
      tenantName: "Bistro",
      locale: "en",
      filters,
      page,
    })
  )

  expect(html).toContain('name="search"')
  expect(html).toContain('name="status"')
  expect(html).toContain('name="from"')
  expect(html).toContain('name="through"')
  expect(html).toContain("Completed")
  expect(html).toContain("Ada Lovelace")
  expect(html).toContain("paginationLabel")
  expect(html).toContain('aria-label="firstPage"')
  expect(html).toContain('aria-label="previous"')
  expect(html).toContain('aria-label="next"')
  expect(html).toContain('aria-label="lastPage"')
  expect(html).not.toContain(">Previous</button>")
  expect(html).not.toContain(">Next</button>")
  expect(html).toContain("status=Completed")
  expect(html).toContain("search=Ada+Lovelace")
  expect(html).toContain("page=1")
  expect(html).toContain("w-full")
  expect(html).not.toContain("max-w-7xl")
})

it("shows a no-results message when filters match no orders", () => {
  const html = renderToStaticMarkup(
    createElement(OrderHistoryTable, {
      tenantName: "Bistro",
      locale: "en",
      filters,
      page: { ...page, items: [], totalCount: 0, page: 1 },
    })
  )

  expect(html).toContain("noResults")
  expect(html).toContain("exportCsv")
  expect(html).toContain("loadedTotal")
  expect(html).toContain("averageBasket")
  expect(html).not.toContain('data-slot="table-row"')
})

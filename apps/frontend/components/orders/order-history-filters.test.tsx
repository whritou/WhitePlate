import { createElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { OrderHistoryFilters } from "@/types/orders"
import { OrderHistoryFilters as OrderHistoryFiltersPanel } from "./order-history-filters"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react")

  return {
    Link: ({ href, children, ...props }: Record<string, unknown>) =>
      React.createElement("a", { href, ...props }, children as ReactNode),
  }
})

vi.mock("@/components/ui/sheet", async () => {
  const React = await import("react")

  return {
    Sheet: ({ children }: { children: ReactNode }) =>
      React.createElement("div", { "data-sheet-root": true }, children),
    SheetClose: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("button", props, children as ReactNode),
    SheetTrigger: ({
      children,
      render,
    }: {
      children: ReactNode
      render: ReactElement
    }) => React.cloneElement(render, undefined, children),
    SheetContent: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement(
        "div",
        { "data-slot": "sheet-content", ...props },
        children as ReactNode
      ),
    SheetHeader: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("header", props, children as ReactNode),
    SheetTitle: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("h2", props, children as ReactNode),
    SheetDescription: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("p", props, children as ReactNode),
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
  pageSize: 25,
}

it("keeps desktop actions beside the filters and places mobile filters in a Sheet", () => {
  const html = renderToStaticMarkup(
    createElement(OrderHistoryFiltersPanel, { filters })
  )

  expect(html).toContain('data-filter-form="desktop"')
  expect(html).toContain('data-filter-form="mobile"')
  expect(html).toContain('class="hidden lg:block"')
  expect(html).toContain('class="lg:hidden"')
  expect(html).toContain('data-slot="sheet-content"')
  expect(html).toContain('aria-label="filtersButton"')
  expect(html).toContain('id="history-search-desktop"')
  expect(html).toContain('id="history-search-mobile"')
  expect(html).toContain(
    "lg:grid-cols-[minmax(10rem,1fr)_repeat(3,minmax(6.5rem,0.75fr))_auto]"
  )
  expect(html).toContain("lg:justify-self-end")
})

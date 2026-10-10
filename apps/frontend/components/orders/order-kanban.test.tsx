import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { OrderKanban } from "./order-kanban"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock("@/hooks/use-order-drag", () => ({
  useOrderDrag: () => ({
    drag: null,
    start: vi.fn(),
    move: vi.fn(),
    end: vi.fn(),
    cancel: vi.fn(),
    pointerCancel: vi.fn(),
    touchStart: vi.fn(),
    touchMove: vi.fn(),
    touchEnd: vi.fn(),
  }),
}))

vi.mock("./order-ticket", () => ({
  OrderTicket: () => null,
}))

it("renders all five lanes with desktop-sized responsive columns", () => {
  const html = renderToStaticMarkup(
    createElement(OrderKanban, {
      orders: [],
      role: "Manager",
      locale: "en",
      pending: null,
      onUpdate: async () => undefined,
    })
  )

  expect(html.match(/data-order-lane=/g)).toHaveLength(5)
  expect(html).toContain("md:grid-cols-2 xl:grid-cols-4")
})

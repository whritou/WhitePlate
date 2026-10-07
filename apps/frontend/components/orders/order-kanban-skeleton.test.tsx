import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { OrderKanbanSkeleton } from "./order-kanban-skeleton"

it("fits five Kanban lanes across a wide desktop workspace", () => {
  const html = renderToStaticMarkup(createElement(OrderKanbanSkeleton))

  expect(html).toContain("minmax(min(100%,18rem),1fr)")
})

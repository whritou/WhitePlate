import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { WorkspaceLoadingSkeleton } from "./workspace-loading-skeleton"

it("matches the overview content width and renders wrapping action placeholders", () => {
  const html = renderToStaticMarkup(
    createElement(WorkspaceLoadingSkeleton, { label: "Loading workspace" })
  )

  expect(html).toContain("max-w-7xl")
  expect(html).toContain('data-skeleton-page="overview"')
  expect(
    html.match(/flex[^\"]*flex-wrap[^\"]*gap-3/g)?.length
  ).toBeGreaterThanOrEqual(2)
})

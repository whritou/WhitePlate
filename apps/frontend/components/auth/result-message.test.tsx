import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { ResultMessage } from "./result-message"

it("can replace a successful inline message when the workspace uses a toast", () => {
  const markup = renderToStaticMarkup(
    createElement(ResultMessage, {
      state: { status: "success" },
      message: "Changes saved.",
      hideSuccess: true,
    })
  )

  expect(markup).toBe("")
})

it("keeps mutation failures visible as persistent alerts", () => {
  const markup = renderToStaticMarkup(
    createElement(ResultMessage, {
      state: { status: "error", error: "unavailable" },
      message: "Try again later.",
      hideSuccess: true,
    })
  )

  expect(markup).toContain('role="alert"')
  expect(markup).toContain("Try again later.")
})

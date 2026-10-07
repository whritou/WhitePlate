import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { GlobalNotFoundContent } from "./global-not-found-content"

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
}))

it("offers a styled not-found message and explicit locale destinations", () => {
  const html = renderToStaticMarkup(createElement(GlobalNotFoundContent))

  expect(html).toContain('data-not-found-page="global"')
  expect(html).toContain("Page not found")
  expect(html).toContain("Page introuvable")
  expect(html).toContain('href="/fr"')
  expect(html).toContain('href="/en"')
})

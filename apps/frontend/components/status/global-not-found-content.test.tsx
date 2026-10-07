import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { GlobalNotFoundContent } from "./global-not-found-content"

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

it("offers a styled not-found message with back and home actions", () => {
  const html = renderToStaticMarkup(createElement(GlobalNotFoundContent))

  expect(html).toContain('data-not-found-page="global"')
  expect(html).toContain("Page not found")
  expect(html).toContain("Page introuvable")
  expect(html).toContain("Retour / Back")
  expect(html).toContain("Accueil / Home")
  expect(html).toContain('href="/"')
  expect(html).toContain("<button")
  expect(html).not.toContain('href="/fr"')
})

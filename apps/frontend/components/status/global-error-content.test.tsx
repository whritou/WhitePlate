import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { GlobalErrorContent } from "./global-error-content"

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
}))

it("offers a bilingual error message with retry and home actions", () => {
  const html = renderToStaticMarkup(
    createElement(GlobalErrorContent, { onRetry: vi.fn() })
  )

  expect(html).toContain('data-error-page="global"')
  expect(html).toContain('role="alert"')
  expect(html).toContain("Something went wrong")
  expect(html).toContain("Une erreur s’est produite")
  expect(html).toContain("Réessayer / Try again")
  expect(html).toContain("Accueil / Home")
  expect(html).toContain('href="/"')
})

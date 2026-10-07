import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import NotFoundPage from "./not-found"

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
}))

it("renders the WhitePlate localized not-found presentation", async () => {
  const page = await NotFoundPage()
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain('data-not-found-page="localized"')
  expect(html).toContain(">404</p>")
})

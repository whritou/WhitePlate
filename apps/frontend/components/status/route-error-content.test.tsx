import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { NextIntlClientProvider } from "next-intl"
import { expect, it, vi } from "vitest"
import en from "@/messages/en.json"
import fr from "@/messages/fr.json"
import { RouteErrorContent } from "./route-error-content"

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
}))

function render(locale: "en" | "fr", digest?: string) {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? en : fr}
    >
      <RouteErrorContent digest={digest} onRetry={vi.fn()} />
    </NextIntlClientProvider>
  )
}

it("renders a localized error with retry, home link and reference", () => {
  const html = render("en", "abc123")

  expect(html).toContain('data-error-page="localized"')
  expect(html).toContain('role="alert"')
  expect(html).toContain(en.StatusPages.errorTitle)
  expect(html).toContain(en.StatusPages.retry)
  expect(html).toContain(en.StatusPages.home)
  expect(html).toContain("Reference: abc123")
})

it("renders French copy and omits the reference without a digest", () => {
  const html = render("fr")

  expect(html).toContain(fr.StatusPages.errorTitle)
  expect(html).toContain(fr.StatusPages.retry)
  expect(html).not.toContain("Référence")
})

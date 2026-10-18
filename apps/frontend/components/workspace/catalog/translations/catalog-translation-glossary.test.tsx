import { renderToStaticMarkup } from "react-dom/server"
import { NextIntlClientProvider } from "next-intl"
import { expect, it, vi } from "vitest"
import messages from "@/messages/en.json"
import { CatalogTranslationGlossary } from "./catalog-translation-glossary"

vi.mock("@/actions/organization", () => ({
  saveCatalogTranslationGlossaryAction: vi.fn(),
  deleteCatalogTranslationGlossaryAction: vi.fn(),
}))
vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

it("shows human-managed glossary terms and explains that checks never rewrite text", () => {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="Europe/Paris"
      messages={messages}
    >
      <CatalogTranslationGlossary
        tenantId="tenant"
        locales={["en", "fr"]}
        sourceLocale="en"
        terms={[
          {
            id: "term",
            sourceLocale: "en",
            targetLocale: "fr",
            sourceTerm: "sourdough",
            targetTerm: "levain",
            createdAt: "2026-10-17T10:00:00Z",
            updatedAt: "2026-10-17T10:00:00Z",
          },
        ]}
      />
    </NextIntlClientProvider>
  )

  expect(html).toContain("Translation glossary")
  expect(html).toContain("sourdough")
  expect(html).toContain("levain")
  expect(html).toContain("they never rewrite text")
  expect(html).toContain("Delete term")
})

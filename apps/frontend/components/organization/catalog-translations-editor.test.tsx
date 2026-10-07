import { renderToStaticMarkup } from "react-dom/server"
import { NextIntlClientProvider } from "next-intl"
import { expect, it, vi } from "vitest"
import messages from "@/messages/en.json"
import { CatalogTranslationsEditor } from "./catalog-translations-editor"

vi.mock("@/actions/organization", () => ({
  saveCatalogTranslationAction: vi.fn(),
}))
vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

it("shows saved and missing translations separately without presenting fallback text as saved", () => {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="Europe/Paris"
      messages={messages}
    >
      <CatalogTranslationsEditor
        tenantId="test"
        locales={["en", "fr"]}
        defaultLocale="en"
        catalog={{
          categories: [
            {
              id: "category",
              name: "Starters",
              isArchived: false,
              translations: {},
            },
          ],
          products: [
            {
              id: "product",
              categoryId: "category",
              name: "Soupe",
              description: null,
              isArchived: false,
              translations: { en: { name: "Soup", description: null } },
            },
          ],
          optionGroups: [],
          options: [],
        }}
      />
    </NextIntlClientProvider>
  )

  expect(html).toContain("To translate")
  expect(html).toContain("Translated")
  expect(html).toContain("Soup")
  expect(html).not.toContain("<textarea")
  expect(html).not.toContain('value="Starters"')
})

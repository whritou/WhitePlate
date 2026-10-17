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

it("keeps the saved translation visible while a changed candidate waits for another manager", () => {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="Europe/Paris"
      messages={messages}
    >
      <CatalogTranslationsEditor
        tenantId="test"
        locales={["fr", "en"]}
        defaultLocale="fr"
        catalog={{
          categories: [],
          products: [
            {
              id: "product",
              categoryId: "category",
              name: "Soup",
              description: "Fresh soup",
              isArchived: false,
              translations: {
                fr: { name: "Soupe enregistrée", description: "Ancienne" },
              },
            },
          ],
          optionGroups: [],
          options: [],
        }}
        reviews={[
          {
            id: "review",
            entityType: "products",
            entityId: "product",
            locale: "fr",
            name: "Nouvelle soupe",
            description: "Nouvelle description",
            sourceName: "Soup",
            sourceDescription: "Fresh soup",
            version: 2,
            status: "Pending",
            canReview: false,
            glossaryWarnings: ["soup"],
            createdAt: "2026-10-17T10:00:00Z",
          },
        ]}
      />
    </NextIntlClientProvider>
  )

  expect(html).toContain("Soupe enregistrée")
  expect(html).toContain("Ancienne")
  expect(html).toContain("Nouvelle soupe")
  expect(html).toContain("Nouvelle description")
  expect(html).toContain("Pending human review")
  expect(html).toContain("Your role cannot review translations")
  expect(html).not.toContain(">Approve</button>")
})

it("shows decision controls when an authorized manager or owner may review a pending candidate", () => {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="Europe/Paris"
      messages={messages}
    >
      <CatalogTranslationsEditor
        tenantId="test"
        locales={["fr", "en"]}
        defaultLocale="fr"
        catalog={{
          categories: [
            {
              id: "category",
              name: "Starters",
              isArchived: false,
              translations: {},
            },
          ],
          products: [],
          optionGroups: [],
          options: [],
        }}
        reviews={[
          {
            id: "review",
            entityType: "categories",
            entityId: "category",
            locale: "fr",
            name: "Entrées",
            description: null,
            sourceName: "Starters",
            sourceDescription: null,
            version: 1,
            status: "Pending",
            canReview: true,
            glossaryWarnings: [],
            createdAt: "2026-10-17T10:00:00Z",
          },
        ]}
      />
    </NextIntlClientProvider>
  )

  expect(html).toContain(">Approve</button>")
  expect(html).toContain(">Reject</button>")
})

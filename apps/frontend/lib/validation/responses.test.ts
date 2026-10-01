import { expect, it } from "vitest"
import {
  parseStorefrontMenu,
  parseOrganizations,
  parseMenuLanguageSettings,
  parseCatalog,
} from "./responses"

const id = "11111111-1111-4111-8111-111111111111"

it("validates public menu JSON before interactive rendering", () => {
  const menu = {
    tenantId: id,
    restaurantName: "Bistro",
    currency: "EUR",
    locale: "fr",
    defaultLocale: "en",
    availableLocales: ["en", "fr"],
    categories: [],
  }

  expect(parseStorefrontMenu(menu)).toEqual(menu)
  expect(parseStorefrontMenu({ ...menu, categories: [{}] })).toBeNull()
  expect(parseStorefrontMenu({ ...menu, locale: "de" })).toBeNull()
  expect(parseStorefrontMenu({ ...menu, currency: "broken" })).toBeNull()
})

it("rejects malformed organization IDs rather than using them in API paths", () => {
  expect(parseOrganizations([{ id, name: "Group" }])).toEqual([
    { id, name: "Group" },
  ])
  expect(parseOrganizations([{ id: "../orders", name: "Group" }])).toBeNull()
  expect(parseOrganizations([null])).toBeNull()
})

it("requires menu language responses to have an enabled default", () => {
  expect(
    parseMenuLanguageSettings({
      tenantId: id,
      locales: ["en"],
      defaultLocale: "fr",
    })
  ).toBeNull()
  expect(
    parseMenuLanguageSettings({
      tenantId: id,
      locales: ["en"],
      defaultLocale: "en",
    })
  ).not.toBeNull()
})

it("rejects incomplete catalog collections and malformed translation dictionaries", () => {
  const catalog = {
    categories: [],
    products: [],
    optionGroups: [],
    options: [],
  }

  expect(parseCatalog(catalog)).toEqual(catalog)
  expect(parseCatalog({ ...catalog, products: null })).toBeNull()
  expect(
    parseCatalog({
      ...catalog,
      categories: [
        { id, name: "Soup", isArchived: false, translations: { en: null } },
      ],
    })
  ).toBeNull()
})

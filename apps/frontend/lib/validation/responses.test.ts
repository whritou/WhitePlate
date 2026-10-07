import { expect, it } from "vitest"
import * as responses from "./responses"
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
  expect(parseOrganizations([{ id, name: "Group", isActive: true }])).toEqual([
    { id, name: "Group", isActive: true },
  ])
  expect(
    parseOrganizations([{ id, name: "Group", isActive: "yes" }])
  ).toBeNull()
  expect(parseOrganizations([{ id: "../orders", name: "Group" }])).toBeNull()
  expect(parseOrganizations([null])).toBeNull()
})

it("validates and minimizes organization team and invitation responses", () => {
  const parse = responses as unknown as Record<
    string,
    ((value: unknown) => unknown) | undefined
  >
  const members = [
    {
      role: "OrganizationOwner",
      email: "owner@example.test",
      tenantId: null,
      tenantName: null,
      subject: "must-not-pass-through",
    },
    {
      role: "KitchenStaff",
      email: "chef@example.test",
      tenantId: id,
      tenantName: "Bistro",
    },
  ]
  const invitations = [
    {
      id,
      role: "KitchenStaff",
      email: "chef@example.test",
      tenantId: id,
      tenantName: "Bistro",
      expiresAt: "2026-10-13T12:00:00Z",
      status: "Pending",
      tokenHash: "must-not-pass-through",
    },
  ]

  expect(parse.parseOrganizationMembers?.(members)).toEqual([
    {
      role: "OrganizationOwner",
      email: "owner@example.test",
      tenantId: null,
      tenantName: null,
    },
    {
      role: "KitchenStaff",
      email: "chef@example.test",
      tenantId: id,
      tenantName: "Bistro",
    },
  ])
  expect(
    parse.parseOrganizationMembers?.([{ ...members[0], role: "Admin" }])
  ).toBeNull()
  expect(parse.parseOrganizationInvitations?.(invitations)).toEqual([
    {
      id,
      role: "KitchenStaff",
      email: "chef@example.test",
      tenantId: id,
      tenantName: "Bistro",
      expiresAt: "2026-10-13T12:00:00Z",
      status: "Pending",
    },
  ])
  expect(
    parse.parseOrganizationInvitations?.([
      { ...invitations[0], status: "StillPending" },
    ])
  ).toBeNull()
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

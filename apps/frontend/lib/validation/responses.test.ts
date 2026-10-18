import { expect, it } from "vitest"
import * as responses from "./responses"
import {
  parseStorefrontMenu,
  parseOrganizations,
  parseMenuLanguageSettings,
  parseCatalog,
  parseRestaurantDescriptionTranslations,
  parseOrganizationRoleGrants,
  parseOrganizationRoleGrant,
  parseOrganizationMembers,
  parseOrganizationInvitations,
  parseOrganizationRoleAssignmentOptions,
} from "./responses"

const id = "11111111-1111-4111-8111-111111111111"

it("parses all persisted organization roles and keeps owner grants protected", () => {
  const editable = ["Manager", "Kitchen", "Staff", "Accountant"].map(
    (role) => ({
      role,
      name: role,
      builtInKey: role,
      permissions: ["orders.manage"],
      version: 1,
      isProtected: false,
      isBuiltIn: true,
      isArchived: false,
    })
  )
  const owner = {
    role: "OrganizationOwner",
    name: "Owner",
    builtInKey: "OrganizationOwner",
    permissions: [
      "orders.manage",
      "kitchen.display",
      "catalog.manage",
      "discounts.manage",
      "analytics.view",
      "storefront.manage",
      "staff.manage",
      "billing.manage",
    ],
    version: 0,
    isProtected: true,
    isBuiltIn: true,
    isArchived: false,
  }

  expect(parseOrganizationRoleGrants([owner, ...editable])).toHaveLength(5)
  expect(
    parseOrganizationRoleGrants([owner, ...editable.slice(0, 3)])
  ).toBeNull()
  expect(
    parseOrganizationRoleGrants([{ ...owner, isProtected: false }, ...editable])
  ).toBeNull()
  expect(
    parseOrganizationRoleGrants([
      owner,
      ...editable,
      { ...editable[0], role: "Manager" },
    ])
  ).toBeNull()
})

it("parses a custom role without assuming the role id is a built-in enum", () => {
  const roleId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  const grants = [
    {
      role: "OrganizationOwner",
      name: "Owner",
      builtInKey: "OrganizationOwner",
      permissions: [
        "orders.manage",
        "kitchen.display",
        "catalog.manage",
        "discounts.manage",
        "analytics.view",
        "storefront.manage",
        "staff.manage",
        "billing.manage",
      ],
      version: 0,
      isProtected: true,
      isBuiltIn: true,
      isArchived: false,
    },
    {
      role: "Manager",
      name: "Manager",
      builtInKey: "Manager",
      permissions: ["orders.manage"],
      version: 1,
      isProtected: false,
      isBuiltIn: true,
      isArchived: false,
    },
    {
      role: "Kitchen",
      name: "Kitchen staff",
      builtInKey: "Kitchen",
      permissions: ["kitchen.display"],
      version: 1,
      isProtected: false,
      isBuiltIn: true,
      isArchived: false,
    },
    {
      role: "Accountant",
      name: "Accountant",
      builtInKey: "Accountant",
      permissions: ["analytics.view", "billing.manage"],
      version: 1,
      isProtected: false,
      isBuiltIn: true,
      isArchived: false,
    },
    {
      role: roleId,
      name: "Pastry chef",
      builtInKey: null,
      permissions: ["kitchen.display"],
      version: 1,
      isProtected: false,
      isBuiltIn: false,
      isArchived: false,
    },
  ]

  const parsed = parseOrganizationRoleGrants(grants)

  expect(parsed?.find((grant) => grant.role === roleId)).toEqual({
    role: roleId,
    name: "Pastry chef",
    builtInKey: null,
    permissions: ["kitchen.display"],
    version: 1,
    isProtected: false,
    isBuiltIn: false,
    isArchived: false,
  })
})

it("parses a single role returned from a versioned save request", () => {
  const grant = {
    role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    name: "Pastry chef",
    builtInKey: null,
    permissions: ["kitchen.display"],
    version: 2,
    isProtected: false,
    isBuiltIn: false,
    isArchived: false,
  }

  expect(parseOrganizationRoleGrant(grant)).toEqual(grant)
})

it("preserves custom role names and assignment identifiers in team data", () => {
  const member = {
    role: "RestaurantStaff",
    email: "pastry@example.test",
    tenantId: "22222222-2222-4222-8222-222222222222",
    tenantName: "Bistro",
    memberId: "33333333-3333-4333-8333-333333333333",
    roleId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    roleName: "Pastry chef",
    builtInKey: null,
  }
  const invitation = {
    id: "44444444-4444-4444-8444-444444444444",
    role: "RestaurantStaff",
    roleId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    roleName: "Pastry chef",
    builtInKey: null,
    email: "new-pastry@example.test",
    tenantId: "22222222-2222-4222-8222-222222222222",
    tenantName: "Bistro",
    expiresAt: "2026-10-20T12:00:00.000Z",
    status: "Pending",
  }

  expect(parseOrganizationMembers([member])).toEqual([member])
  expect(parseOrganizationInvitations([invitation])).toEqual([invitation])
})

it("parses active custom roles for staff assignment selectors", () => {
  const options = [
    { role: "Manager", name: "Manager", builtInKey: "Manager" },
    {
      role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Pastry chef",
      builtInKey: null,
    },
  ]

  expect(parseOrganizationRoleAssignmentOptions(options)).toEqual(options)
})

it("validates public menu JSON before interactive rendering", () => {
  const menu = {
    tenantId: id,
    restaurantName: "Bistro",
    restaurantDescription: "A neighborhood bistro.",
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

it("validates restaurant description translation settings before rendering", () => {
  const settings = {
    tenantId: id,
    locales: ["en", "fr"],
    defaultLocale: "en",
    translations: { en: "Welcome to Bistro", fr: "Bienvenue au Bistro" },
  }

  expect(parseRestaurantDescriptionTranslations(settings)).toEqual(settings)
  expect(
    parseRestaurantDescriptionTranslations({ ...settings, translations: [] })
  ).toBeNull()
  expect(
    parseRestaurantDescriptionTranslations({
      ...settings,
      translations: { fr: 123 },
    })
  ).toBeNull()
  expect(
    parseRestaurantDescriptionTranslations({
      ...settings,
      defaultLocale: "de",
    })
  ).toBeNull()
})

it("rejects malformed organization IDs rather than using them in API paths", () => {
  expect(parseOrganizations([{ id, name: "Group", isActive: true }])).toEqual([
    {
      id,
      name: "Group",
      isActive: true,
      legalCountryCode: null,
      legalName: null,
      legalRegistrationNumber: null,
      taxIdentifier: null,
      legalProfileVersion: 1,
    },
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

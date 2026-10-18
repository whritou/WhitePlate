import { expect, it } from "vitest"
import { liveWorkspaceLinks } from "./live-workspace-navigation"

const id = "22222222-2222-4222-8222-222222222222"
const organizationId = "11111111-1111-4111-8111-111111111111"
const restaurants = [
  {
    id,
    name: "Restaurant",
    role: "Manager" as const,
    organizationId,
    permissions: [
      "orders.manage",
      "kitchen.display",
      "catalog.manage",
      "discounts.manage",
      "analytics.view",
      "storefront.manage",
      "staff.manage",
    ],
  },
]

it("keeps real tenant URLs and never grants navigation from an unknown selector", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    restaurants
  )

  expect(
    links.some((link) => link.href === `/organization/catalog?tenantId=${id}`)
  ).toBe(true)
  expect(links.some((link) => link.href.includes("/demo"))).toBe(false)
  expect(
    liveWorkspaceLinks(
      new URLSearchParams({ tenantId: "foreign" }),
      [],
      restaurants
    )
  ).toEqual([])
  expect(
    liveWorkspaceLinks(
      new URLSearchParams(`tenantId=${id}&tenantId=${id}`),
      [],
      restaurants
    )
  ).toEqual([])
})

it("shows only links covered by persisted grants", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    [{ ...restaurants[0], role: "Kitchen", permissions: ["kitchen.display"] }]
  )

  expect(links.map((link) => link.key)).toEqual(["dashboard", "orders"])
})

it("hides analytics, settings, and catalog for a custom kitchen role without those grants", () => {
  const customRoleId = "a1b2c3d4e5f64789a0b1c2d3e4f56789"
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    [
      {
        ...restaurants[0],
        role: "RestaurantStaff",
        roleId: customRoleId,
        roleName: "Kitchen assistant",
        permissions: ["kitchen.display"],
      },
    ]
  )

  expect(links.map((link) => link.key)).toEqual(["dashboard", "orders"])
  expect(
    links.some((link) =>
      ["analytics", "settings", "catalog"].includes(link.key)
    )
  ).toBe(false)
})

it("shows only analytics for an accountant without order access", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    [
      {
        ...restaurants[0],
        role: "Accountant",
        permissions: ["analytics.view", "billing.manage"],
      },
    ]
  )

  expect(links.map((link) => link.key)).toEqual(["analytics", "settings"])
})

it("includes staff navigation from a real restaurant membership without requiring ownership", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    [{ ...restaurants[0], role: "Staff", permissions: ["staff.manage"] }]
  )

  expect(links.map((link) => link.key)).toEqual(["team"])
  expect(links[0].href).toBe(
    `/organization/team?organizationId=${organizationId}&tenantId=${id}`
  )
})

it("shows only granted destinations, including order settings for order managers", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    [{ ...restaurants[0], permissions: ["orders.manage"] }]
  )

  expect(links.map((link) => link.key)).toEqual([
    "dashboard",
    "orders",
    "orderHistory",
    "settings",
  ])
  expect(links.find((link) => link.key === "settings")?.href).toContain(
    "section=notifications"
  )
})

it("organization links preserve the authorized organization context", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ organizationId }),
    [{ id: organizationId, name: "Org", isActive: true }],
    []
  )

  expect(links.map((link) => link.key)).toEqual([
    "team",
    "settings",
    "createRestaurant",
  ])
  expect(
    links.every((link) =>
      link.href.includes(`organizationId=${organizationId}`)
    )
  ).toBe(true)
})

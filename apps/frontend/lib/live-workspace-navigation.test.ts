import { expect, it } from "vitest"
import { liveWorkspaceLinks } from "./live-workspace-navigation"

const id = "22222222-2222-4222-8222-222222222222"
const restaurants = [{ id, name: "Restaurant", role: "Manager" as const }]

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

it("limits kitchen navigation to operational orders", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [],
    [{ ...restaurants[0], role: "Kitchen" }]
  )

  expect(links.map((link) => link.key)).toEqual(["orders"])
})

it("includes organization staff in restaurant navigation only for an authorized organization", () => {
  const organizationId = "11111111-1111-4111-8111-111111111111"
  const links = liveWorkspaceLinks(
    new URLSearchParams({ tenantId: id }),
    [{ id: organizationId, name: "Org", isActive: true }],
    [{ ...restaurants[0], organizationId }]
  )

  expect(links.map((link) => link.key)).toEqual([
    "dashboard",
    "orders",
    "orderHistory",
    "analytics",
    "catalog",
    "theming",
    "team",
    "settings",
  ])
  expect(links.find((link) => link.key === "team")?.href).toBe(
    `/organization/team?organizationId=${organizationId}&tenantId=${id}`
  )
  expect(
    liveWorkspaceLinks(
      new URLSearchParams({ tenantId: id }),
      [],
      [{ ...restaurants[0], organizationId }]
    ).some((link) => link.key === "team")
  ).toBe(false)
})

it("offers restaurant settings without losing the verified tenant", () => {
  expect(
    liveWorkspaceLinks(new URLSearchParams({ tenantId: id }), [], restaurants)
  ).toContainEqual({
    href: `/organization/restaurant-settings?tenantId=${id}`,
    key: "settings",
  })
})

it("organization links preserve the authorized organization context", () => {
  const links = liveWorkspaceLinks(
    new URLSearchParams({ organizationId: id }),
    [{ id, name: "Org", isActive: true }],
    []
  )

  expect(links.map((link) => link.key)).toEqual([
    "team",
    "settings",
    "createRestaurant",
  ])
  expect(
    links.every((link) => link.href.includes(`organizationId=${id}`))
  ).toBe(true)
})

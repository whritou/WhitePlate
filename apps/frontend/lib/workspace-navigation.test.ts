import { describe, expect, it } from "vitest"
import {
  buildWorkspaceNavigation,
  isWorkspaceLinkActive,
  resolveWorkspaceContext,
} from "@/lib/workspace-navigation"
import type { Organization } from "@/types/organization"
import type { RestaurantMembership } from "@/types/orders"

const organizationId = "11111111-1111-4111-8111-111111111111"
const ownerRestaurantId = "22222222-2222-4222-8222-222222222222"
const managerRestaurantId = "33333333-3333-4333-8333-333333333333"
const kitchenRestaurantId = "44444444-4444-4444-8444-444444444444"

const organizations: Organization[] = [
  { id: organizationId, name: "White Plate Group" },
]

const restaurants: RestaurantMembership[] = [
  {
    id: ownerRestaurantId,
    name: "Owner Restaurant",
    role: "OrganizationOwner",
  },
  { id: managerRestaurantId, name: "Manager Restaurant", role: "Manager" },
  { id: kitchenRestaurantId, name: "Kitchen Restaurant", role: "Kitchen" },
]

function getLinks(
  ownerOrganizations: Organization[],
  memberships: RestaurantMembership[]
) {
  return buildWorkspaceNavigation(
    ownerOrganizations,
    memberships,
    (key) => key
  ).flatMap((section) => section.links)
}

describe("buildWorkspaceNavigation", () => {
  it("shows organization management and restaurant management links to owners", () => {
    const links = getLinks(organizations, [restaurants[0]])
    const hrefs = links.map((link) => link.href)

    expect(hrefs).toContain("/organization")
    expect(hrefs).toContain(
      `/organization/team?organizationId=${organizationId}`
    )
    expect(hrefs).toContain(
      `/organization/settings?organizationId=${organizationId}`
    )
    expect(hrefs).toContain(
      `/organization/restaurants/new?organizationId=${organizationId}`
    )
    expect(hrefs).toContain(
      `/organization/orders?tenantId=${ownerRestaurantId}`
    )
    expect(hrefs).toContain(
      `/organization/order-history?tenantId=${ownerRestaurantId}`
    )
    expect(hrefs).toContain(
      `/organization/catalog?tenantId=${ownerRestaurantId}`
    )
    expect(hrefs).toContain(
      `/organization/restaurant-languages?tenantId=${ownerRestaurantId}`
    )
  })

  it("limits managers to their restaurant operations", () => {
    const hrefs = getLinks([], [restaurants[1]]).map((link) => link.href)

    expect(hrefs).toContain(
      `/organization/orders?tenantId=${managerRestaurantId}`
    )
    expect(hrefs).toContain(
      `/organization/order-history?tenantId=${managerRestaurantId}`
    )
    expect(hrefs).toContain(
      `/organization/catalog?tenantId=${managerRestaurantId}`
    )
    expect(hrefs).toContain(
      `/organization/restaurant-languages?tenantId=${managerRestaurantId}`
    )
    expect(hrefs.some((href) => href.includes("organizationId="))).toBe(false)
  })

  it("limits kitchen staff to their restaurant orders", () => {
    const hrefs = getLinks([], [restaurants[2]]).map((link) => link.href)

    expect(hrefs).toEqual([
      "/organization",
      `/organization/orders?tenantId=${kitchenRestaurantId}`,
    ])
    expect(hrefs).not.toContain(
      `/organization/order-history?tenantId=${kitchenRestaurantId}`
    )
  })
})

describe("resolveWorkspaceContext", () => {
  it("resolves a single organization selected from the verified owner list", () => {
    const context = resolveWorkspaceContext(
      new URLSearchParams(`organizationId=${organizationId}`),
      organizations,
      restaurants
    )

    expect(context).toEqual({
      type: "organization",
      id: organizationId,
      name: "White Plate Group",
    })
  })

  it("resolves only a single selected ID from the verified account data", () => {
    const context = resolveWorkspaceContext(
      new URLSearchParams(`tenantId=${ownerRestaurantId}`),
      organizations,
      restaurants
    )

    expect(context).toEqual({
      type: "restaurant",
      id: ownerRestaurantId,
      name: "Owner Restaurant",
    })
  })

  it("does not label an unknown or ambiguous URL selection as an authorized context", () => {
    const unknown = resolveWorkspaceContext(
      new URLSearchParams("tenantId=55555555-5555-4555-8555-555555555555"),
      organizations,
      restaurants
    )
    const ambiguous = resolveWorkspaceContext(
      new URLSearchParams(
        `organizationId=${organizationId}&organizationId=${organizationId}`
      ),
      organizations,
      restaurants
    )

    expect(unknown).toBeNull()
    expect(ambiguous).toBeNull()
  })
})

describe("isWorkspaceLinkActive", () => {
  it("matches the overview exactly and nested workspace routes by path", () => {
    const noSelection = new URLSearchParams()

    expect(
      isWorkspaceLinkActive("/organization", "/organization", noSelection)
    ).toBe(true)
    expect(
      isWorkspaceLinkActive("/organization", "/organization/team", noSelection)
    ).toBe(false)
    expect(
      isWorkspaceLinkActive(
        `/organization/catalog?tenantId=${ownerRestaurantId}`,
        "/organization/catalog",
        new URLSearchParams(`tenantId=${ownerRestaurantId}`)
      )
    ).toBe(true)
    expect(
      isWorkspaceLinkActive(
        "/organization/catalog",
        "/organization/catalogue",
        noSelection
      )
    ).toBe(false)
  })

  it("matches only the selected organization or restaurant context", () => {
    const secondOrganizationId = "55555555-5555-4555-8555-555555555555"
    const selectedRestaurant = new URLSearchParams(
      `tenantId=${kitchenRestaurantId}`
    )
    const selectedOrganization = new URLSearchParams(
      `organizationId=${secondOrganizationId}`
    )

    expect(
      isWorkspaceLinkActive(
        `/organization/orders?tenantId=${ownerRestaurantId}`,
        "/organization/orders",
        selectedRestaurant
      )
    ).toBe(false)
    expect(
      isWorkspaceLinkActive(
        `/organization/orders?tenantId=${kitchenRestaurantId}`,
        "/organization/orders",
        selectedRestaurant
      )
    ).toBe(true)
    expect(
      isWorkspaceLinkActive(
        `/organization/team?organizationId=${organizationId}`,
        "/organization/team",
        selectedOrganization
      )
    ).toBe(false)
    expect(
      isWorkspaceLinkActive(
        `/organization/team?organizationId=${secondOrganizationId}`,
        "/organization/team",
        selectedOrganization
      )
    ).toBe(true)
  })
})

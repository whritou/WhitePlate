import { expect, it } from "vitest"
import {
  parseOrganizationRename,
  parseOrganizationRoleArchive,
  parseOrganizationRoleCreate,
  parseOrganizationRoleGrant,
  parseRestaurantMemberRoleChange,
  parseStaffInvitation,
} from "./organization"

const organizationId = "11111111-1111-4111-8111-111111111111"

it("validates owner updates to editable restaurant role grants", () => {
  const input = {
    organizationId,
    role: "Kitchen",
    permissions: ["kitchen.display", "analytics.view"],
    version: 3,
  }

  expect(parseOrganizationRoleGrant(input)).toEqual(input)
  expect(
    parseOrganizationRoleGrant({ ...input, role: "OrganizationOwner" })
  ).toBeNull()
  expect(
    parseOrganizationRoleGrant({ ...input, permissions: ["root.access"] })
  ).toBeNull()
  expect(
    parseOrganizationRoleGrant({
      ...input,
      permissions: ["analytics.view", "analytics.view"],
    })
  ).toBeNull()
  expect(parseOrganizationRoleGrant({ ...input, version: 0 })).toBeNull()
})

it("accepts custom role IDs and names when updating persisted grants", () => {
  const input = {
    organizationId,
    role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    name: "Pastry chef",
    permissions: ["kitchen.display"],
    version: 4,
  }

  expect(parseOrganizationRoleGrant(input)).toEqual(input)
})

it("normalizes and validates new custom role names", () => {
  const input = {
    organizationId,
    name: "  Pastry chef  ",
    permissions: ["kitchen.display"],
  }

  expect(parseOrganizationRoleCreate(input)).toEqual({
    organizationId,
    name: "Pastry chef",
    permissions: ["kitchen.display"],
  })
  expect(parseOrganizationRoleCreate({ ...input, name: " " })).toBeNull()
})

it("validates custom role archival and member reassignment inputs", () => {
  const roleId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  const memberId = "22222222-2222-4222-8222-222222222222"

  expect(
    parseOrganizationRoleArchive({ organizationId, roleId, version: 3 })
  ).toEqual({ organizationId, roleId, version: 3 })
  expect(
    parseOrganizationRoleArchive({
      organizationId,
      roleId: "OrganizationOwner",
      version: 1,
    })
  ).toBeNull()
  expect(
    parseRestaurantMemberRoleChange({ organizationId, memberId, roleId })
  ).toEqual({ organizationId, memberId, roleId })
  expect(
    parseRestaurantMemberRoleChange({
      organizationId,
      memberId,
      roleId: "OrganizationOwner",
    })
  ).toBeNull()
})

it("accepts a custom role ID for restaurant staff invitations", () => {
  const form = new FormData()

  form.set("organizationId", organizationId)
  form.set("tenantId", "22222222-2222-4222-8222-222222222222")
  form.set("email", "pastry@example.test")
  form.set("role", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
  form.set("locale", "en")

  expect(parseStaffInvitation(form)).toEqual({
    organizationId,
    tenantId: "22222222-2222-4222-8222-222222222222",
    email: "pastry@example.test",
    role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    locale: "en",
  })
})

it("normalizes the requested organization name", () => {
  const form = new FormData()

  form.set("organizationId", organizationId)
  form.set("name", "  White Plate Group  ")

  expect(parseOrganizationRename(form)).toEqual({
    organizationId,
    name: "White Plate Group",
  })
})

it.each([
  { organizationId: "not-a-uuid", name: "White Plate Group" },
  { organizationId, name: "   " },
  { organizationId, name: "a".repeat(201) },
])(
  "rejects invalid organization rename values: %o",
  ({ organizationId, name }) => {
    const form = new FormData()

    form.set("organizationId", organizationId)
    form.set("name", name)

    expect(parseOrganizationRename(form)).toBeNull()
  }
)

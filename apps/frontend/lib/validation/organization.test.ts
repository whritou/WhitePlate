import { expect, it } from "vitest"
import {
  parseOrganizationRename,
  parseOrganizationRoleGrant,
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
  expect(parseOrganizationRoleGrant({ ...input, role: "OrganizationOwner" })).toBeNull()
  expect(parseOrganizationRoleGrant({ ...input, permissions: ["root.access"] })).toBeNull()
  expect(
    parseOrganizationRoleGrant({
      ...input,
      permissions: ["analytics.view", "analytics.view"],
    })
  ).toBeNull()
  expect(parseOrganizationRoleGrant({ ...input, version: 0 })).toBeNull()
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

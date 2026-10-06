import { expect, it } from "vitest"
import { parseOrganizationRename } from "./organization"

const organizationId = "11111111-1111-4111-8111-111111111111"

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

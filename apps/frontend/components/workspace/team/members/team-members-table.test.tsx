import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { OrganizationRoleAssignmentOption } from "@/types/organization"
import { TeamMembersTable } from "./team-members-table"

vi.mock("@/actions/organization", () => ({
  changeRestaurantMemberRoleAction: vi.fn(),
}))

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

it("offers persisted custom roles for owner reassignment of restaurant members", () => {
  const organizationId = "11111111-1111-4111-8111-111111111111"
  const roleOptions: OrganizationRoleAssignmentOption[] = [
    {
      role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Pastry chef",
      builtInKey: null,
    },
  ]
  const html = renderToStaticMarkup(
    createElement(TeamMembersTable, {
      organizationId,
      members: [
        {
          role: "RestaurantStaff",
          email: "pastry@example.test",
          tenantId: "22222222-2222-4222-8222-222222222222",
          tenantName: "Bistro",
          memberId: "33333333-3333-4333-8333-333333333333",
          roleId: "Manager",
          roleName: "Manager",
          builtInKey: "Manager",
        },
      ],
      roleOptions,
      allowRoleChanges: true,
    } as Parameters<typeof TeamMembersTable>[0] & {
      organizationId: string
      roleOptions: OrganizationRoleAssignmentOption[]
      allowRoleChanges: boolean
    })
  )

  expect(html).toContain('value="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"')
  expect(html).toContain("Pastry chef")
})

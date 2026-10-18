import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { RolePermissionsEditor } from "./role-permissions-editor"

vi.mock("@/actions/organization", () => ({
  saveOrganizationRoleGrantAction: vi.fn(),
  createOrganizationRoleAction: vi.fn(),
  archiveOrganizationRoleAction: vi.fn(),
}))

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    key === "archiveRole" || key === "renameRole"
      ? `${key} ${values?.role}`
      : key,
}))

it("offers the owner a form to create a custom role", () => {
  const html = renderToStaticMarkup(
    createElement(RolePermissionsEditor, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      initialGrants: [],
    })
  )

  expect(html).toContain('name="customRoleName"')
  expect(html).toContain("createRole")
})

it("shows custom role names and offers an archive action only for custom roles", () => {
  const html = renderToStaticMarkup(
    createElement(RolePermissionsEditor, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      initialGrants: [
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
          role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          name: "Pastry chef",
          builtInKey: null,
          permissions: ["kitchen.display"],
          version: 2,
          isProtected: false,
          isBuiltIn: false,
          isArchived: false,
        },
      ],
    })
  )

  expect(html).toContain("Pastry chef")
  expect(html).toContain('aria-label="renameRole Pastry chef"')
  expect(html).toContain('aria-label="archiveRole Pastry chef"')
  expect(html).not.toContain('aria-label="archiveRole Manager"')
})

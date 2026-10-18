import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { OrganizationSettingsForm } from "./organization-settings-form"

vi.mock("@/actions/organization", () => ({
  renameOrganizationAction: vi.fn(),
}))

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      name: "Organization name",
      save: "Save organization name",
      saving: "Saving…",
      updated: "Organization name updated.",
      "errors.invalid": "Check the organization name and your access.",
      "errors.unavailable": "Try again later.",
      "errors.unauthorized": "Sign in again.",
    })[key] ?? key,
}))

const organizationId = "11111111-1111-4111-8111-111111111111"

it("renders the saved name in a labelled form scoped to its organization", () => {
  const html = renderToStaticMarkup(
    createElement(OrganizationSettingsForm, {
      organizationId,
      organizationName: "White Plate Group",
      organizationActive: true,
    })
  )

  expect(html).toContain('name="organizationId"')
  expect(html).toContain(`value="${organizationId}"`)
  expect(html).toContain('for="organization-name"')
  expect(html).toContain('value="White Plate Group"')
  expect(html).toContain("Save organization name")
})

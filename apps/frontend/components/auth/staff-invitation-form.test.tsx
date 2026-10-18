import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { StaffInvitationForm } from "./staff-invitation-form"

vi.mock("@/actions/organization", () => ({
  sendStaffInvitationAction: vi.fn(),
}))

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}))

it("offers the active persisted roles when creating a restaurant invitation", () => {
  const roleOptions = [
    {
      role: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Pastry chef",
      builtInKey: null,
    },
  ]
  const html = renderToStaticMarkup(
    createElement(StaffInvitationForm, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      restaurants: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Bistro",
        },
      ],
      roleOptions,
      allowOwnerInvitation: false,
    } as Parameters<typeof StaffInvitationForm>[0] & {
      roleOptions: typeof roleOptions
    })
  )

  expect(html).toContain('value="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"')
  expect(html).toContain("Pastry chef")
})

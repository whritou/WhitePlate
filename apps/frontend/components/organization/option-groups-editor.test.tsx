import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type {
  CatalogOption,
  CatalogOptionGroup,
  OptionGroupsEditorProps,
} from "@/types/catalog-management"
import { OptionGroupsEditor } from "./option-groups-editor"

vi.mock("@/actions/catalog", () => ({
  archiveCatalogItemAction: vi.fn(),
  saveOptionAction: vi.fn(),
  saveOptionGroupAction: vi.fn(),
}))

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        optionGroupsTitle: "Options",
        optionGroupsDescription: "Configure choices for this product.",
        newOptionGroupFor: "New option group for {name}",
        editOptionGroup: "Edit option group {name}",
        newOptionFor: "New option for {name}",
        editOption: "Edit option {name}",
        name: "Name",
        minimumSelections: "Minimum selections",
        maximumSelections: "Maximum selections",
        selectionBoundsHint:
          "Use whole numbers: 0 ≤ minimum ≤ maximum ≤ 20, and maximum must be at least 1.",
        sortOrder: "Display order",
        priceAdjustment: "Price adjustment ({currency})",
        createOptionGroup: "Create option group",
        createOption: "Create option",
        save: "Save changes",
        saving: "Saving…",
        saved: "Changes saved.",
        archive: "Archive",
        archiveName: "Archive {name}",
        archived: "Archived",
        confirmArchive: "Confirm archive",
        cancel: "Cancel",
      }
      const message = messages[key] ?? key

      return Object.entries(values ?? {}).reduce(
        (text, [name, value]) => text.replace(`{${name}}`, String(value)),
        message
      )
    },
}))

const tenantId = "11111111-1111-4111-8111-111111111111"
const productId = "22222222-2222-4222-8222-222222222222"
const group: CatalogOptionGroup = {
  id: "33333333-3333-4333-8333-333333333333",
  productId,
  name: "Size",
  minimumSelections: 0,
  maximumSelections: 2,
  sortOrder: 0,
  isArchived: false,
  translations: {},
}
const option: CatalogOption = {
  id: "44444444-4444-4444-8444-444444444444",
  groupId: group.id,
  name: "Large",
  priceAdjustment: 1.25,
  sortOrder: 0,
  isArchived: false,
  translations: {},
}
const props: OptionGroupsEditorProps = {
  tenantId,
  currency: "GBP",
  productId,
  productName: "Soup",
  optionGroups: [group],
  options: [option],
  parentArchived: false,
}

function markup(value: OptionGroupsEditorProps = props) {
  return renderToStaticMarkup(createElement(OptionGroupsEditor, value))
}

it("renders owner forms with accessible fields and the restaurant currency", () => {
  const html = markup()

  expect(html).toContain('aria-label="Edit option group Size"')
  expect(html).toContain('aria-label="Edit option Large"')
  expect(html).toContain("Minimum selections")
  expect(html).toContain("Maximum selections")
  expect(html).toContain("Price adjustment (GBP)")
  expect(html).toContain("£1.25")
})

it("keeps archived groups and options visible without edit or archive controls", () => {
  const html = markup({
    ...props,
    optionGroups: [{ ...group, isArchived: true }],
    options: [{ ...option, isArchived: true }],
  })

  expect(html).toContain("Archived")
  expect(html).not.toContain('aria-label="Edit option group Size"')
  expect(html).not.toContain('aria-label="Edit option Large"')
  expect(html).not.toContain('aria-label="Archive Size"')
  expect(html).not.toContain('aria-label="Archive Large"')
})

it("prevents creating or editing descendants under an archived product", () => {
  const html = markup({ ...props, parentArchived: true })

  expect(html).toContain("Archived")
  expect(html).not.toContain('aria-label="New option group for Soup"')
  expect(html).not.toContain('aria-label="Edit option group Size"')
  expect(html).not.toContain('aria-label="New option for Size"')
  expect(html).not.toContain('aria-label="Edit option Large"')
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type {
  CatalogDiscount,
  DiscountsEditorProps,
} from "@/types/catalog-management"
import { DiscountsEditor } from "./discounts-editor"

vi.mock("@/actions/catalog", () => ({
  deactivateDiscountAction: vi.fn(),
  saveDiscountAction: vi.fn(),
}))

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const messages: Record<string, string> = {
      discountsTitle: "Discount codes",
      discountsDescription: "Manage the offers available at checkout.",
      newDiscountCode: "New discount code",
      editDiscount: "Edit discount {code}",
      createDiscount: "Create discount code",
      discountCode: "Discount code",
      discountCodeHint: "Use letters, numbers, or hyphens; saved in uppercase.",
      name: "Name",
      discountType: "Discount type",
      fixedAmount: "Fixed amount",
      percentage: "Percentage",
      fixedValue: "Value ({currency})",
      percentageValue: "Value (%)",
      save: "Save changes",
      saving: "Saving…",
      saved: "Changes saved.",
      active: "Active",
      inactive: "Inactive",
      deactivateDiscount: "Deactivate discount {code}",
      deactivate: "Deactivate",
      confirmDiscountDeactivation: "Stop accepting {code} at checkout?",
      confirmDeactivation: "Confirm deactivation",
      cancel: "Cancel",
      noDiscounts: "No discount codes yet.",
      discountDeactivated: "Discount deactivated.",
      duplicateDiscountCode: "That code is already in use.",
      "errors.unavailable": "Try again later.",
    }
    const message = messages[key] ?? key

    return Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      message
    )
  },
}))

const fixedDiscount: CatalogDiscount = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "LUNCH10",
  name: "Lunch offer",
  kind: "FixedAmount",
  value: 5.5,
  isActive: true,
}

const inactiveDiscount: CatalogDiscount = {
  id: "22222222-2222-4222-8222-222222222222",
  code: "WELCOME15",
  name: "Welcome offer",
  kind: "Percentage",
  value: 15,
  isActive: false,
}
const props: DiscountsEditorProps = {
  tenantId: "33333333-3333-4333-8333-333333333333",
  currency: "GBP",
  discounts: [fixedDiscount, inactiveDiscount],
}

function markup(value: DiscountsEditorProps = props) {
  return renderToStaticMarkup(createElement(DiscountsEditor, value))
}

it("renders active discount management with restaurant currency and percentage", () => {
  const html = markup()

  expect(html).toContain('aria-label="New discount code"')
  expect(html).toContain('aria-label="Edit discount LUNCH10"')
  expect(html).toContain('aria-label="Deactivate discount LUNCH10"')
  expect(html).toContain("£5.50")
  expect(html).toContain("15%")
  expect(html).toContain('name="code"')
})

it("keeps inactive codes visible as read-only history", () => {
  const html = markup({
    ...props,
    discounts: [inactiveDiscount],
  })

  expect(html).toContain("Inactive")
  expect(html).toContain("WELCOME15")
  expect(html).not.toContain('aria-label="Edit discount WELCOME15"')
  expect(html).not.toContain('aria-label="Deactivate discount WELCOME15"')
  expect(html.match(/name="code"/g)).toHaveLength(1)
})

it("shows a localized empty state while keeping the create form available", () => {
  const html = markup({ ...props, discounts: [] })

  expect(html).toContain("No discount codes yet.")
  expect(html).toContain('aria-label="New discount code"')
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { OrderTicket } from "./order-ticket"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

it("renders saved localized preparation notes and accessible pickup timing", () => {
  const html = renderToStaticMarkup(
    createElement(OrderTicket, {
      order: {
        id: "22222222-2222-4222-8222-222222222222",
        customerName: "Ada",
        currency: "EUR",
        menuLocale: "fr",
        total: 19.25,
        status: "Preparing",
        version: 1,
        createdAt: "2026-10-01T18:00:00.000Z",
        pickupAt: "2026-10-01T18:04:00.000Z",
        lines: [
          {
            productId: "11111111-1111-4111-8111-111111111111",
            productName: "Soupe",
            quantity: 1,
            preparationMinutes: 8,
            preparationNotes: {
              en: "Finish last.",
              fr: "Terminer à la commande.",
            },
            options: [],
          },
        ],
      },
      permissions: ["kitchen.display"],
      locale: "en",
      now: Date.parse("2026-10-01T18:00:00.000Z"),
      pending: null,
      onUpdate: async () => undefined,
    })
  )

  expect(html).toContain("Terminer à la commande.")
  expect(html).not.toContain("Finish last.")
  expect(html).toContain('role="timer"')
  expect(html).toContain("pickupDueSoon")
})

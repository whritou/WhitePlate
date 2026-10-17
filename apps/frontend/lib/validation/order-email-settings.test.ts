import { describe, expect, it } from "vitest"
import {
  parseOrderEmailSettings,
  parseOrderEmailTemplates,
} from "./order-email-settings"

const template = {
  subject: "Order {{orderNumber}} received",
  heading: "Thanks, {{customerName}}",
  body: "Pickup: {{pickupTime}} {{pickupInstructions}}",
}
const localeTemplates = {
  locale: "en",
  orderCreated: template,
  preparing: template,
  ready: template,
}

describe("order email settings parsing", () => {
  it("accepts a complete localized settings response", () => {
    expect(
      parseOrderEmailSettings({
        version: 1,
        defaultLocale: "en",
        locales: ["en"],
        templates: [localeTemplates],
        defaults: [localeTemplates],
      })?.templates[0].orderCreated.subject
    ).toBe(template.subject)
  })

  it("rejects markup and placeholders outside the documented allowlist", () => {
    const unsafe = {
      ...localeTemplates,
      ready: { ...template, body: "<img src=x> {{unknown}}" },
    }

    expect(parseOrderEmailTemplates([unsafe])).toBeNull()
  })
})

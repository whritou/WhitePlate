import { expect, test } from "@playwright/test"

for (const locale of ["en", "fr"]) {
  test(`${locale}: /demo stays on the demo storefront route`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/demo`)

    await expect(page.locator(".storefront-page")).toBeVisible()
    await expect(page.getByText(/menu.*temporarily unavailable/i)).toHaveCount(
      0
    )
  })

  test(`${locale}: live menu, checkout and tracking use the customer page recipes`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${locale}/live-workspace-test?view=store`)

    await expect(page.locator(".storefront-page")).toBeVisible()

    const banner = page.locator(".customer-banner")

    await expect(banner).toBeVisible()
    expect(
      await banner.evaluate((element) => element.getBoundingClientRect().height)
    ).toBeLessThan(220)
    await expect(
      page.getByRole("region", {
        name:
          locale === "en"
            ? "Collection information"
            : "Informations de retrait",
      })
    ).toBeVisible()
    await expect(page.getByText("12 rue de la Roquette")).toBeVisible()
    await expect(page.getByText("+33123456789")).toBeVisible()

    const allCategories = page.getByRole("button", {
      name: locale === "en" ? "All" : "Tout",
      exact: true,
    })

    await allCategories.click()
    await expect(allCategories).toHaveAttribute("aria-pressed", "true")

    const category = page.getByRole("button", { name: "Entrées", exact: true })

    await category.click()
    await expect(category).toHaveAttribute("aria-pressed", "true")

    await page.goto(
      `/${locale}/live-workspace-test?view=store&layout=list&theme=custom`
    )

    const storefront = page.locator(".storefront-page")

    await expect(storefront).toHaveAttribute("data-button-style", "outline")
    expect(
      await storefront.evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--primary").trim()
      )
    ).toBe("#b3261e")

    const productCard = page.locator("main [data-slot=card]").first()
    const productImage = productCard.locator(":scope > div").first()
    const productCardWidth = await productCard.evaluate(
      (element) => element.getBoundingClientRect().width
    )
    const productImageWidth = await productImage.evaluate(
      (element) => element.getBoundingClientRect().width
    )

    expect(productImageWidth).toBeGreaterThan(productCardWidth * 0.9)

    await page.goto(`/${locale}/live-workspace-test?view=store&step=checkout`)

    const checkout = page.locator(".live-checkout-layout.customer-two-column")

    await expect(checkout).toBeVisible()
    await expect(page.locator(".customer-banner")).toHaveCount(0)
    await expect(page.locator(".customer-page h1")).toBeVisible()

    const checkoutBounds = await checkout
      .locator("aside")
      .evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const previous = element.previousElementSibling!.getBoundingClientRect()

        return {
          width: rect.width,
          top: rect.top,
          previousBottom: previous.bottom,
        }
      })

    expect(checkoutBounds.width).toBeGreaterThan(300)
    expect(checkoutBounds.top).toBeGreaterThanOrEqual(
      checkoutBounds.previousBottom
    )

    const orderId = "44444444-4444-4444-8444-444444444444"

    await page.route(`**/api/public/orders/${orderId}/tracking**`, (route) =>
      route.fulfill({
        json: {
          id: orderId,
          status: "Preparing",
          version: 2,
          createdAt: "2026-10-18T10:00:00.000Z",
          pickupAt: "2026-10-18T10:30:00.000Z",
          pickupTimeZone: "Europe/Paris",
          menuLocale: "fr",
        },
      })
    )
    await page.route("**/api/public/establishment?*", (route) =>
      route.fulfill({
        json: {
          name: "Maison Verte",
          phone: "+33123456789",
          addressLine1: "12 rue de la Roquette",
          addressLine2: null,
          postalCode: "75011",
          city: "Paris",
          region: null,
          countryCode: "FR",
          latitude: null,
          longitude: null,
          timeZone: "Europe/Paris",
          pickupInstruction: "Entrez par la porte verte.",
          pickupLocale: "fr",
          openingHours: null,
        },
      })
    )
    await page.goto(
      `/${locale}/live-workspace-test?view=tracking#${"a".repeat(43)}`
    )

    const tracking = page.locator(".customer-two-column")

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(tracking).toBeVisible()
    await expect(tracking.locator("aside.customer-summary")).toBeVisible()
    await expect(page.getByText("Entrez par la porte verte.")).toBeVisible()
    await expect(page.getByText("12 rue de la Roquette")).toBeVisible()
    await expect(page.getByText(/product|produit/i)).toHaveCount(0)

    const trackingBounds = await tracking
      .locator("aside")
      .evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const previous = element.previousElementSibling!.getBoundingClientRect()

        return {
          width: rect.width,
          top: rect.top,
          previousBottom: previous.bottom,
        }
      })

    expect(trackingBounds.width).toBeGreaterThan(300)
    expect(trackingBounds.top).toBeGreaterThanOrEqual(
      trackingBounds.previousBottom
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

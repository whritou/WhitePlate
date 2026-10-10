import { expect, test } from "@playwright/test"

test("dish thumbnails load actual saved covers using a supported media size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.route("**/api/product-photos?**", (route) => {
    const query = new URL(route.request().url()).searchParams

    return query.has("assetId")
      ? route.fulfill({
          path: "public/design/photo-15.webp",
          contentType: "image/webp",
        })
      : route.fulfill({
          json: {
            storageAvailable: true,
            assets: [
              {
                id: "33333333-3333-4333-8333-333333333333",
                width: 640,
                height: 480,
                bytes: 4000,
              },
            ],
          },
        })
  })
  await page.goto("/en/photo-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const cover = page
    .getByRole("button", {
      name: "Select Burger Le Rustique Truffé",
      exact: true,
    })
    .locator("img")

  await expect(cover).toHaveAttribute("src", /assetId=.*&size=320/)
  await expect
    .poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  await page
    .getByRole("button", {
      name: "Select Burger Le Rustique Truffé",
      exact: true,
    })
    .click()
  await expect(
    page.getByRole("region", { name: "Product photography", exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: ".acceptance/parity-menu-photos.png",
    fullPage: true,
  })
})

for (const locale of ["en", "fr"]) {
  test(`${locale}: real menu follows demo tabs, adjacent editor and responsive category navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(
      `/${locale}/catalog-design-test?view=builder&shell=1&tenantId=11111111-1111-4111-8111-111111111111`
    )
    await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
      "data-ready",
      "true"
    )
    await expect(page.getByRole("tab")).toHaveCount(4)
    await page
      .getByRole("button", { name: /(?:Select|Sélectionner) Soupe du potager/ })
      .click()

    const panel = page.locator(".live-product-panel")

    await expect(panel).toBeVisible()
    await expect(
      panel.getByLabel(locale === "en" ? "Name" : "Nom", { exact: true })
    ).toHaveValue("Soupe du potager")
    await expect(page.locator('[data-slot="sheet-backdrop"]')).toHaveCount(0)
    await expect(page.locator(".live-menu-layout aside")).toBeVisible()
    await page.screenshot({
      path: `.acceptance/parity-menu-${locale}.png`,
      fullPage: true,
    })
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    }
  })
}

test("restaurant appbar includes authorized staff, demo hover and source dashboard sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(
    "/en/live-workspace-test?view=dashboard&tenantId=22222222-2222-4222-8222-222222222222"
  )

  const navigation = page.getByRole("navigation", {
    name: "Workspace navigation",
    exact: true,
  })

  await expect(navigation.getByRole("link")).toHaveCount(8)

  const staff = navigation.getByRole("link", { name: "Staff", exact: true })

  await expect(staff).toHaveAttribute(
    "href",
    /organization\/team\?organizationId=.*&tenantId=/
  )
  await staff.hover()
  await expect(staff).toHaveCSS("background-color", "oklch(0.88 0.19 122)")
  for (const name of [
    "In the kitchen",
    "Connections",
    "Latest orders",
    "Your storefront",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible()
  }

  await page.screenshot({
    path: ".acceptance/parity-dashboard.png",
    fullPage: true,
  })
})

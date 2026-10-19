import { expect, test, type Locator } from "@playwright/test"
import { installParityFixtures } from "./helpers/parity-fixtures"
import { parityCaptureOptions } from "./helpers/pixel-parity"

async function expectHoverFeedback(button: Locator) {
  await expect(button).toBeEnabled()
  await button.scrollIntoViewIfNeeded()

  const bounds = await button.boundingBox()

  await button.hover()
  await expect(button).toHaveCSS("filter", "brightness(0.94)")
  await expect(button).not.toHaveCSS("box-shadow", "none")
  expect(await button.boundingBox()).toEqual(bounds)
}

for (const reference of [true, false]) {
  test(`${reference ? "Studio" : "real store"}: source buttons visibly respond to hover`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await installParityFixtures(page)
    await page.goto(`/fr/studio-parity-test?reference=${reference ? 1 : 0}`)
    await expect(page.locator(".storefront-page")).toHaveAttribute(
      "aria-busy",
      "false"
    )
    await page.evaluate(() => document.fonts.ready)

    const basket = page.locator(".storefront-page > header button").last()

    await basket.hover()
    await expect(basket).toHaveCSS("background-color", "rgb(179, 38, 30)")
    await expect(basket).toHaveCSS("color", "rgb(255, 253, 247)")
    await expect(basket).toHaveCSS("border-width", "1px")
    await page.screenshot({
      path: testInfo.outputPath(
        `hover-${reference ? "studio" : "live"}-store.png`
      ),
      ...parityCaptureOptions,
    })
    await expectHoverFeedback(
      page.getByRole("button", { name: "Entrées", exact: true })
    )
    await expectHoverFeedback(
      page.locator("article .customer-product-image").first()
    )
    await expectHoverFeedback(
      page.locator("article .customer-product-details > button").first()
    )
    await expectHoverFeedback(
      page.getByRole("button", { name: "Add Burrata", exact: true })
    )
    await page.getByRole("button", { name: "Add Burrata", exact: true }).click()
    await expectHoverFeedback(
      page.getByRole("button", { name: "Salade +€1.00", exact: true })
    )
    await expectHoverFeedback(
      page.getByRole("button", { name: "Fermer", exact: true })
    )
    await expectHoverFeedback(
      page.getByRole("dialog").getByRole("button", { name: "+", exact: true })
    )
    await expectHoverFeedback(
      page.getByRole("button", { name: "Ajouter 1 · €11.50", exact: true })
    )
    await page.screenshot({
      path: testInfo.outputPath(
        `hover-${reference ? "studio" : "live"}-modal.png`
      ),
      ...parityCaptureOptions,
    })
    await page
      .getByRole("button", { name: "Ajouter 1 · €11.50", exact: true })
      .click()

    const floating = page.locator(".storefront-page > button")

    await expectHoverFeedback(floating)
    await floating.click()
    await expectHoverFeedback(
      page.getByRole("dialog").getByRole("button", { name: "+", exact: true })
    )
    await expectHoverFeedback(
      page.getByRole("button", { name: "Fermer", exact: true })
    )
    await page.screenshot({
      path: testInfo.outputPath(
        `hover-${reference ? "studio" : "live"}-basket.png`
      ),
      ...parityCaptureOptions,
    })
  })
}

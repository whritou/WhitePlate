import { expect, test } from "@playwright/test"

test("customer checkout and tracking fit narrow mobile widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  for (const route of ["/fr/demo/checkout", "/fr/demo/tracking"]) {
    await page.goto(route)
    await expect(page.locator("h1").first()).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      route
    ).toBe(true)
  }
})

test("mobile basket is accessible, inset and dismissible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/en/demo")
  await page.getByRole("button", { name: /Basket ·/ }).click()

  const dialog = page.getByRole("dialog")

  await expect(dialog).toBeVisible()

  const bounds = await dialog.boundingBox()

  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
})

test("existing live-screen fixtures retain responsive containment", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      "/fr/catalog-design-test",
      "/fr/order-history-test",
      "/fr/orders-kanban-test",
    ]) {
      const response = await page.goto(route)

      expect(response?.status()).toBe(200)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        route + " " + width
      ).toBe(true)
    }
  }
})

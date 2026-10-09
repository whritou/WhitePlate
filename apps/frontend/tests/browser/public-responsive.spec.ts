import { expect, test } from "@playwright/test"

test("landing locale links remain keyboard-accessible 44px targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")
  for (const language of ["en", "fr"]) {
    const link = page.locator(`header a[lang=${language}]`)
    const bounds = await link.boundingBox()

    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
  }

  await page.locator("header a[lang=en]").click()
  await expect(page).toHaveURL(/\/en$/)
})

test("localized hero actions have matching heights at tablet width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto("/fr")

  const actions = page.locator("section").first().getByRole("button")
  const a = await actions.nth(0).boundingBox()
  const b = await actions.nth(1).boundingBox()

  expect(a).not.toBeNull()
  expect(b).not.toBeNull()
  expect(Math.abs(a!.height - b!.height)).toBeLessThanOrEqual(1)
})

for (const locale of ["en", "fr"])
  for (const theme of ["light", "dark"]) {
    test(`${locale} ${theme}: public pages reflow across breakpoint edges`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      for (const width of [
        320, 375, 639, 640, 768, 1023, 1024, 1279, 1280, 1440, 1536,
      ]) {
        await page.setViewportSize({ width, height: 900 })
        for (const route of [`/${locale}`, `/${locale}/demo`]) {
          await page.goto(route)
          await expect(page.locator("h1").first()).toBeVisible()
          await page.evaluate(() => document.fonts.ready)
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            ),
            route + " " + width
          ).toBe(true)
        }
      }
    })
  }

test("public pages reflow with doubled root text size", async ({ page }) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ["/fr", "/fr/demo"]) {
      await page.goto(route)
      await expect(page.locator("h1").first()).toBeVisible()
      await page.addStyleTag({ content: "html {font-size:200%}" })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        route + " " + width
      ).toBe(true)
    }
  }
})

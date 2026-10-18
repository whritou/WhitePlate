import { expect, test } from "@playwright/test"
import { STORE_THEME_PARITY_FIXTURE } from "@/app/[locale]/live-workspace-test/fixture-data"
import { themeVariables } from "@/lib/lovable/storeTheme"
import { themeAppearance } from "@/lib/validation/theme-appearance"

const widths = [320, 390, 768, 1024, 1440, 1920]
const properties = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--accent",
  "--accent-foreground",
  "--customer-radius",
  "--customer-button-radius",
  "--customer-font",
  "--customer-heading-font",
  "--customer-heading-weight",
  "--customer-body-weight",
  "--customer-text-scale",
  "--customer-line-height",
  "--customer-gap",
  "--customer-padding",
  "--customer-image-ratio",
  "--customer-banner-overlay",
]

for (const locale of ["en", "fr"]) {
  test(`${locale}: published Studio theme reaches the real storefront at responsive widths`, async ({
    page,
  }) => {
    const draft = {
      theme: themeAppearance(STORE_THEME_PARITY_FIXTURE),
      version: 1,
    }

    await page.route("**/api/theme-settings**", (route) =>
      route.fulfill({
        json: new URL(route.request().url()).searchParams.has("palette")
          ? { palette: null, reason: "no_logo" }
          : draft,
      })
    )

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(
        `/${locale}/live-workspace-test?view=studio&theme=parity&tenantId=22222222-2222-4222-8222-222222222222`
      )

      const studio = page.locator("#studio-panel .storefront-page").first()

      await expect(studio).toBeVisible()
      await expect(
        page.getByLabel("Primary color", { exact: true })
      ).toHaveValue(STORE_THEME_PARITY_FIXTURE.primary)

      const studioTheme = await studio.evaluate((element, keys) => {
        const style = getComputedStyle(element)

        return Object.fromEntries(
          keys.map((key) => [key, style.getPropertyValue(key).trim()])
        )
      }, properties)

      await page.goto(`/${locale}/live-workspace-test?view=store&theme=parity`)

      const store = page.locator(".lovable-live.storefront-page").first()

      await expect(store).toBeVisible()

      const storeTheme = await store.evaluate((element, keys) => {
        const style = getComputedStyle(element)

        return Object.fromEntries(
          keys.map((key) => [key, style.getPropertyValue(key).trim()])
        )
      }, properties)

      expect(storeTheme).toEqual(studioTheme)
      expect(storeTheme["--background"]).toBe("#fffdf7")
      expect(storeTheme["--foreground"]).toBe("#1b1b1b")
      expect(storeTheme["--primary"]).toBe("#b3261e")
      expect(storeTheme["--customer-image-ratio"]).toBe("16 / 9")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)

      const expectedVariables = themeVariables(STORE_THEME_PARITY_FIXTURE)

      for (const key of properties) {
        const value = expectedVariables[key as keyof typeof expectedVariables]

        expect(storeTheme[key]).toBe(String(value))
      }

      const outlineButton = store.locator("button.bg-primary").first()

      await expect(outlineButton).toBeVisible()
      await expect(outlineButton).toHaveCSS("color", "rgb(179, 38, 30)")
      await outlineButton.hover()
      await expect(outlineButton).toHaveCSS(
        "background-color",
        "rgb(255, 253, 247)"
      )
      await expect(outlineButton).toHaveCSS(
        "box-shadow",
        "rgb(179, 38, 30) 0px 0px 0px 2px inset"
      )
      await page.mouse.down()
      await expect(outlineButton).toHaveCSS(
        "box-shadow",
        "rgb(179, 38, 30) 0px 0px 0px 3px inset"
      )
      await page.mouse.up()
    }
  })
}

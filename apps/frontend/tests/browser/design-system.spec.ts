import { expect, test } from "@playwright/test"
import type { Locator } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

async function contrastOf(locator: Locator, part = "color") {
  return locator.evaluate((element, property) => {
    const canvas = document.createElement("canvas")

    canvas.width = canvas.height = 1

    const context = canvas.getContext("2d")!
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)

      return Array.from(context.getImageData(0, 0, 1, 1).data).map((v, i) =>
        i === 3 ? v / 255 : v
      )
    }

    const blend = (front: number[], back: number[]) =>
      front
        .slice(0, 3)
        .map((v, i) => v * front[3] + back[i] * (1 - front[3]))
        .concat(1)
    const ancestors: Element[] = []
    let current: Element | null = element

    while (current) {
      ancestors.unshift(current)
      current = current.parentElement
    }

    let background = [255, 255, 255, 1]
    let surface = background
    let opacity = 1

    for (const ancestor of ancestors) {
      const style = getComputedStyle(ancestor)

      if (ancestor === element) surface = background
      background = blend(rgba(style.backgroundColor), background)
      opacity *= Number(style.opacity)
    }

    const front = rgba(getComputedStyle(element).getPropertyValue(property))

    front[3] *= opacity

    const back = property === "color" ? background : surface
    const rendered = blend(front, back)
    const luminance = (color: number[]) =>
      color
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
    const values = [luminance(rendered), luminance(back)].sort((a, b) => b - a)

    return (values[0] + 0.05) / (values[1] + 0.05)
  }, part)
}

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale} ${theme}: readable controls, badge states, keyboard focus and responsive layouts`, async ({
      page,
    }) => {
      const hydrationErrors: string[] = []

      page.on("pageerror", (error) => {
        if (error.message.includes("Hydration"))
          hydrationErrors.push(error.message)
      })
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.goto(`/${locale}/design-system-test`)
      await expect(page.locator("html")).toHaveClass(new RegExp(theme))
      await page.waitForTimeout(250)
      expect(hydrationErrors).toEqual([])

      const buttons = page.getByTestId("button-samples").getByRole("button")
      const badges = page.locator('[data-slot="badge"]')
      const ratios: number[] = []

      for (const element of [
        ...(await buttons.all()),
        ...(await badges.all()),
      ]) {
        const ratio = await contrastOf(element)

        ratios.push(ratio)
        expect(ratio, await element.innerText()).toBeGreaterThanOrEqual(4.5)
      }

      console.log(
        `${locale}/${theme}: ${ratios.length} rendered button/badge pairs; minimum ${Math.min(...ratios).toFixed(2)}:1`
      )

      for (const button of await buttons.all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
        if (await button.isDisabled()) continue
        await button.hover()
        await page.waitForTimeout(150)
        expect(await contrastOf(button)).toBeGreaterThanOrEqual(4.5)
        await page.mouse.down()
        expect(await contrastOf(button)).toBeGreaterThanOrEqual(4.5)
        await page.mouse.up()
      }

      const input = page.locator("#design-name")

      expect(
        await contrastOf(input, "border-top-color")
      ).toBeGreaterThanOrEqual(3)
      await input.focus()
      await input.press("Tab")
      await page.keyboard.press("Shift+Tab")
      await expect(input).toBeFocused()
      expect(await contrastOf(input, "outline-color")).toBeGreaterThanOrEqual(3)
      expect(
        await input.evaluate((el) => getComputedStyle(el).outlineWidth)
      ).toBe("2px")

      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `overflow at ${width}px`
        ).toBe(true)
        for (const button of await page
          .locator("main")
          .getByRole("button")
          .all()) {
          expect(
            await button.evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
            `clipped button at ${width}px`
          ).toBe(true)
        }
      }

      if (process.env.WHITEPLATE_DESIGN_SCREENSHOTS) {
        await mkdir(process.env.WHITEPLATE_DESIGN_SCREENSHOTS, {
          recursive: true,
        })
        await page.screenshot({
          path: join(
            process.env.WHITEPLATE_DESIGN_SCREENSHOTS,
            `workspace-${locale}-${theme}.png`
          ),
          fullPage: true,
        })
      }

      await page.setViewportSize({ width: 375, height: 900 })

      const navigationTrigger = page.getByRole("button", {
        name: locale === "fr" ? "Ouvrir la navigation" : "Open navigation",
        exact: true,
      })

      await navigationTrigger.focus()
      await navigationTrigger.press("Enter")
      await expect(page.getByRole("dialog")).toBeVisible()
      await expect(
        page.getByRole("button", {
          name: locale === "fr" ? "Fermer la navigation" : "Close navigation",
          exact: true,
        })
      ).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(page.getByRole("dialog")).toHaveCount(0)
      await expect(navigationTrigger).toBeFocused()

      await page.emulateMedia({ reducedMotion: "reduce" })
      expect(
        await input.evaluate((el) => getComputedStyle(el).transitionDuration)
      ).toBe("0s")

      await page.setViewportSize({ width: 640, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "32px"
      })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        "200% text size"
      ).toBe(true)
    })
  }
}

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale} ${theme}: sign-in controls and mobile layout`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.goto(`/${locale}/sign-in`)
      await expect(page.locator("#email")).toBeVisible()
      await expect(page.locator("html")).toHaveClass(new RegExp(theme))
      await page.waitForTimeout(250)

      for (const button of await page
        .locator("main")
        .getByRole("button")
        .all()) {
        expect(await contrastOf(button)).toBeGreaterThanOrEqual(4.5)
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      }

      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
      }
    })

    test(`${locale} ${theme}: fixture menu and checkout remain usable`, async ({
      page,
      baseURL,
    }) => {
      test.skip(
        process.env.WHITEPLATE_DESIGN_STOREFRONT_FIXTURE !== "1",
        "Requires the documented deterministic checkout API on port 5189"
      )

      const url = new URL(`/${locale}`, baseURL)

      url.hostname = "bistro.localhost"
      url.searchParams.set("menuLocale", locale)

      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.goto(url.href)
      await expect(
        page.getByRole("heading", { name: "Bistro fixture" })
      ).toBeVisible()
      await page
        .getByRole("checkbox", {
          name: locale === "fr" ? "Levain" : "Sourdough",
        })
        .check()
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Ajouter Soupe" : "Add Soup",
        })
        .click()
      await page.locator("#customer-name").fill("Design fixture")
      await page.locator("#discount-code").fill("INVALID")
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Passer la commande" : "Place order",
          exact: true,
        })
        .click()
      await expect(page.getByRole("alert")).toBeVisible()
      expect(
        await contrastOf(page.locator('[data-slot="alert-description"]'))
      ).toBeGreaterThanOrEqual(4.5)
      await page.locator("#discount-code").fill("LUNCH")

      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `storefront overflow ${width}`
        ).toBe(true)
        for (const button of await page
          .locator("main")
          .getByRole("button")
          .all())
          expect(await contrastOf(button)).toBeGreaterThanOrEqual(4.5)
      }

      if (process.env.WHITEPLATE_DESIGN_SCREENSHOTS) {
        await page.screenshot({
          path: join(
            process.env.WHITEPLATE_DESIGN_SCREENSHOTS,
            `menu-${locale}-${theme}.png`
          ),
          fullPage: true,
        })
      }

      await page
        .getByRole("button", {
          name: locale === "fr" ? "Passer la commande" : "Place order",
          exact: true,
        })
        .click()
      await expect(
        page.getByRole("heading", {
          name: locale === "fr" ? "Commande confirmée" : "Order confirmed",
        })
      ).toBeVisible()
    })
  }
}

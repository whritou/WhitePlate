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

for (const reference of [true, false]) {
  test(`${reference ? "Studio" : "real checkout"}: contact focus stays on fields`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await installParityFixtures(page)
    await page.goto(
      `/fr/studio-parity-test?screen=checkout&reference=${reference ? 1 : 0}`
    )
    await expect(page.locator("form.customer-two-column")).toHaveAttribute(
      "aria-busy",
      "false"
    )

    for (const id of ["customer-name", "customer-phone", "order-notes"]) {
      const field = page.locator(`#${id}`)
      const label = page.locator(`label[for="${id}"]`)

      await field.focus()
      expect
        .soft(
          await field.evaluate(
            (element) => getComputedStyle(element).outlineWidth
          )
        )
        .toBe("2px")
      expect
        .soft(
          await label.evaluate(
            (element) => getComputedStyle(element).outlineStyle
          )
        )
        .toBe("none")
    }
  })
}

for (const reference of [true, false]) {
  test(`${reference ? "Studio" : "real store"}: product-card hover covers each area`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await installParityFixtures(page)
    await page.goto(`/fr/studio-parity-test?reference=${reference ? 1 : 0}`)
    await expect(page.locator(".storefront-page")).toHaveAttribute(
      "aria-busy",
      "false"
    )

    const productCard = page.locator("article").first()
    const hoverAreas = [
      productCard.locator(".customer-product-image"),
      productCard.locator(".customer-product-details > button").first(),
      productCard.getByRole("button", { name: "Add Burrata", exact: true }),
    ]

    for (const area of hoverAreas) {
      await area.hover()

      const shadow = await productCard.evaluate(
        (element) => getComputedStyle(element).boxShadow
      )

      expect(shadow).not.toBe("none")
    }
  })
}

for (const reference of [true, false]) {
  test(`${reference ? "Studio" : "real store"}: basket quantity controls fit and checkout responds`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await installParityFixtures(page)
    await page.goto(`/fr/studio-parity-test?reference=${reference ? 1 : 0}`)
    await expect(page.locator(".storefront-page")).toHaveAttribute(
      "aria-busy",
      "false"
    )
    await page.getByRole("button", { name: "Add Burrata", exact: true }).click()

    const productModal = page.getByRole("dialog")
    const modalMinus = productModal.getByRole("button", {
      name: "−",
      exact: true,
    })
    const modalPlus = productModal.getByRole("button", {
      name: "+",
      exact: true,
    })

    for (const modalControl of [modalMinus, modalPlus]) {
      await modalControl.hover()
      expect
        .soft(
          await modalControl.evaluate(
            (element) => getComputedStyle(element).borderRadius
          )
        )
        .toBe("0px")
    }

    await page
      .getByRole("button", { name: "Ajouter 1 · €11.50", exact: true })
      .click()

    const floatingBasket = page.locator(".storefront-page > button")

    await floatingBasket.click()

    const basket = page.getByRole("dialog")
    const basketPlus = basket.getByRole("button", { name: "+", exact: true })
    const basketMinus = basket.getByRole("button", {
      name: "−",
      exact: true,
    })
    const counter = basketPlus.locator("xpath=..")
    const counterBounds = await counter.boundingBox()
    const plusBounds = await basketPlus.boundingBox()
    const minusBounds = await basketMinus.boundingBox()

    await basketPlus.hover()
    expect
      .soft(
        await basketPlus.evaluate(
          (element) => getComputedStyle(element).borderRadius
        )
      )
      .toBe("0px")
    await basketMinus.hover()
    expect
      .soft(
        await basketMinus.evaluate(
          (element) => getComputedStyle(element).borderRadius
        )
      )
      .toBe("0px")
    expect.soft(plusBounds!.height).toBeLessThanOrEqual(counterBounds!.height)
    expect.soft(minusBounds!.height).toBeLessThanOrEqual(counterBounds!.height)

    const checkout = basket.getByRole("button", {
      name: /Passer au paiement/,
    })

    await checkout.hover()
    await expect(checkout).toHaveCSS("filter", "brightness(0.94)")
    expect
      .soft(
        await checkout.evaluate((element) => getComputedStyle(element).filter)
      )
      .toBe("brightness(0.94)")
  })
}

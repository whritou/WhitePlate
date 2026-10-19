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

    const productCard = page.locator("article").first()
    const cardTrigger = productCard.locator(".customer-product-card-trigger")

    await cardTrigger.hover()
    await expect(productCard).not.toHaveCSS("box-shadow", "none")
    await expect(cardTrigger).toHaveCSS("filter", "none")

    const addProduct = page.getByRole("button", {
      name: "Add Burrata",
      exact: true,
    })

    await addProduct.hover()
    await expect(addProduct).toHaveCSS("filter", "none")
    await expect(productCard).not.toHaveCSS("box-shadow", "none")
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

for (const width of [1024, 390]) {
  for (const reference of [true, false]) {
    test(`${reference ? "Studio" : "real store"} (${width}px): product-card hover covers each area`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await installParityFixtures(page)
      await page.goto(`/fr/studio-parity-test?reference=${reference ? 1 : 0}`)
      await expect(page.locator(".storefront-page")).toHaveAttribute(
        "aria-busy",
        "false"
      )

      const productCard = page.locator("article").first()

      await productCard.scrollIntoViewIfNeeded()

      const cardTrigger = productCard.locator(".customer-product-card-trigger")

      await expect(cardTrigger).toHaveCount(1)
      await expect(
        productCard.locator(".customer-product-image")
      ).not.toHaveRole("button")
      await expect(
        productCard.locator(
          ".customer-product-details > div:first-child button"
        )
      ).toHaveCount(0)

      const cardBounds = await productCard.boundingBox()
      const triggerBounds = await cardTrigger.boundingBox()

      expect(triggerBounds).toEqual(cardBounds)

      const hoverAreas = [
        productCard.locator(".customer-product-image"),
        productCard.locator(".customer-product-details p.font-bold").first(),
        productCard.locator(".customer-product-details p.text-sm").first(),
        productCard.locator(".customer-product-details"),
      ]

      for (const area of hoverAreas) {
        const bounds = await area.boundingBox()

        await page.mouse.move(
          bounds!.x + bounds!.width / 2,
          bounds!.y + bounds!.height / 2
        )

        const shadow = await productCard.evaluate(
          (element) => getComputedStyle(element).boxShadow
        )
        const childEffects = await productCard
          .locator(".customer-product-card-trigger")
          .evaluate((element) => ({
            filter: getComputedStyle(element).filter,
            boxShadow: getComputedStyle(element).boxShadow,
          }))

        expect(shadow).not.toBe("none")
        expect(childEffects).toEqual({ filter: "none", boxShadow: "none" })
      }

      const titleBounds = await productCard
        .locator(".customer-product-details p.font-bold")
        .first()
        .boundingBox()

      await page.mouse.click(
        titleBounds!.x + titleBounds!.width / 2,
        titleBounds!.y + titleBounds!.height / 2
      )
      await expect(page.getByRole("dialog")).toBeVisible()
    })
  }
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
    const modalControl = modalPlus.locator("xpath=..")
    const modalRadii = await modalControl.evaluate((element) => {
      const minus = element.querySelector("button:first-child")!
      const plus = element.querySelector("button:last-child")!
      const minusStyle = getComputedStyle(minus)
      const plusStyle = getComputedStyle(plus)

      return {
        parent: getComputedStyle(element).borderTopLeftRadius,
        minusOuter: minusStyle.borderTopLeftRadius,
        minusInner: minusStyle.borderTopRightRadius,
        plusInner: plusStyle.borderTopLeftRadius,
        plusOuter: plusStyle.borderTopRightRadius,
      }
    })

    expect(modalRadii.minusOuter).toBe(modalRadii.parent)
    expect(modalRadii.minusInner).toBe("0px")
    expect(modalRadii.plusInner).toBe("0px")
    expect(modalRadii.plusOuter).toBe(modalRadii.parent)

    for (const modalControl of [modalMinus, modalPlus]) {
      await modalControl.hover()
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

    await expect(counter).toHaveClass(/customer-quantity-control/)
    expect(
      await counter.evaluate((element) => getComputedStyle(element).overflow)
    ).toBe("hidden")

    await basketPlus.hover()

    const basketRadii = await counter.evaluate((element) => {
      const minus = element.querySelector("button:first-child")!
      const plus = element.querySelector("button:last-child")!
      const minusStyle = getComputedStyle(minus)
      const plusStyle = getComputedStyle(plus)

      return {
        parent: getComputedStyle(element).borderTopLeftRadius,
        minusOuter: minusStyle.borderTopLeftRadius,
        minusInner: minusStyle.borderTopRightRadius,
        plusInner: plusStyle.borderTopLeftRadius,
        plusOuter: plusStyle.borderTopRightRadius,
      }
    })

    expect(basketRadii.minusOuter).toBe(basketRadii.parent)
    expect(basketRadii.minusInner).toBe("0px")
    expect(basketRadii.plusInner).toBe("0px")
    expect(basketRadii.plusOuter).toBe(basketRadii.parent)
    await basketMinus.hover()
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

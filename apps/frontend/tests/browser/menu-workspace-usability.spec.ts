import { expect, test } from "@playwright/test"

const fixture =
  "/en/catalog-design-test?view=builder&shell=1&tenantId=11111111-1111-4111-8111-111111111111"

test("archive confirmation stays a usable width in the menu category manager", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 720 })
    await page.goto(fixture)
    await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
      "data-ready",
      "true"
    )
    await page.getByRole("button", { name: "Manage categories" }).click()

    const manager = page.getByRole("dialog", {
      name: "Manage categories",
    })

    await expect(manager).toBeVisible()
    await manager
      .getByRole("button", { name: /^Archive / })
      .first()
      .click()

    const popup = page.locator('[data-slot="alert-dialog-popup"]')

    await expect(popup).toBeVisible()
    await expect(popup).toHaveCSS("width", `${Math.min(width - 32, 512)}px`)
  }
})

test("desktop menu height follows its content instead of leaving a blank tail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(fixture)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const metrics = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    menuHeight: document
      .querySelector(".live-menu-layout")!
      .getBoundingClientRect().height,
  }))

  expect(metrics.menuHeight).toBeLessThan(600)
  expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.viewportHeight)

  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()

  const panel = page.locator(".live-product-panel").filter({ visible: true })

  await panel.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })

  const selectedMetrics = await page.evaluate(() => {
    const shell = document.querySelector(".lovable-live")!

    return {
      documentHeight: document.documentElement.scrollHeight,
      shellBottom: shell.getBoundingClientRect().bottom + window.scrollY,
      viewportHeight: window.innerHeight,
    }
  })

  expect(selectedMetrics.documentHeight).toBeLessThanOrEqual(
    Math.max(selectedMetrics.viewportHeight, selectedMetrics.shellBottom) + 16
  )
})

test("discount code helper text does not shift the paired name input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(fixture)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("tab", { name: "Discount codes" }).click()
  await page.getByRole("button", { name: "New discount code" }).click()

  const form = page.getByRole("form", { name: "New discount code" })
  const code = await form.getByLabel("Discount code").boundingBox()
  const name = await form.getByLabel("Name").boundingBox()

  expect(code).not.toBeNull()
  expect(name).not.toBeNull()
  expect(code!.y).toBe(name!.y)
})

test("product metadata stays editable and readable while its form is scrolled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 720 })
  await page.goto(fixture)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const productButton = page.getByRole("button", {
    name: "Select Soupe du potager",
    exact: true,
  })
  const productText = productButton.locator(":scope > span").last()

  await expect(productText).toHaveCSS("flex-grow", "1")
  await expect(productText).toHaveCSS("overflow-wrap", "break-word")
  await productButton.click()

  const panel = page.locator(".live-product-panel").filter({ visible: true })
  const details = panel.getByRole("region", { name: "Product details" })
  const description = details.getByText(
    "Légumes de saison et herbes fraîches.",
    { exact: true }
  )

  await expect(description).toBeVisible()
  await expect(description).toHaveCSS("overflow-wrap", "break-word")
  await page.getByRole("button", { name: "Edit product", exact: true }).click()

  const form = panel.getByRole("form", {
    name: "Edit product Soupe du potager",
  })
  const sku = form.getByLabel(/SKU \/ reference/)
  const metadata = form.getByRole("heading", { name: "Product details" })
  const save = form.getByRole("button", { name: "Save changes", exact: true })
  const cancel = form.getByRole("button", { name: "Cancel", exact: true })
  const createCategory = page.getByRole("button", {
    name: "New category",
    exact: true,
  })
  const manageCategories = page.getByRole("button", {
    name: "Manage categories",
    exact: true,
  })

  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 720 })
    await sku.fill(`ESC-${width}`)
    await expect(sku).toHaveValue(`ESC-${width}`)

    const skuBox = await sku.boundingBox()
    const metadataBox = await metadata.locator("xpath=..").boundingBox()

    expect(skuBox?.width).toBeGreaterThanOrEqual(
      (metadataBox?.width ?? 0) * 0.9
    )
    await panel.scrollIntoViewIfNeeded()
    if (width > 1024) {
      await panel.evaluate((element) => {
        element.scrollTop = 800
      })
    } else {
      await save.scrollIntoViewIfNeeded()
      await page.evaluate(() => window.scrollBy(0, 120))
    }

    await expect(save).toBeInViewport()

    const saveBox = await save.boundingBox()
    const cancelBox = await cancel.boundingBox()
    const panelBox = await panel.boundingBox()

    if (width > 1024) {
      expect(saveBox?.y).toBeGreaterThanOrEqual(panelBox?.y ?? 0)
      expect(saveBox?.y).toBeLessThan(
        (panelBox?.y ?? 0) + (panelBox?.height ?? 0)
      )
    }

    if (width <= 1024) {
      await expect(createCategory).toBeInViewport()
      await expect(manageCategories).toBeInViewport()
      await expect(cancel).toBeInViewport()

      const createBox = await createCategory.boundingBox()

      expect((saveBox?.y ?? 0) + (saveBox?.height ?? 0)).toBeLessThan(
        createBox?.y ?? 0
      )

      expect(
        (createBox?.y ?? 0) - ((saveBox?.y ?? 0) + (saveBox?.height ?? 0))
      ).toBeLessThanOrEqual(8)
      expect(
        (createBox?.y ?? 0) - ((saveBox?.y ?? 0) + (saveBox?.height ?? 0))
      ).toBeGreaterThanOrEqual(0)
      expect(Math.abs((cancelBox?.y ?? 0) - (saveBox?.y ?? 0))).toBeLessThan(2)
    }

    if (width === 1440) {
      const preparationMinutes = await form
        .locator('[name="preparationMinutes"]')
        .boundingBox()
      const preparationNote = await form
        .locator('[name="preparationNote-en"]')
        .boundingBox()

      expect(
        Math.abs((preparationMinutes?.y ?? 0) - (preparationNote?.y ?? 0))
      ).toBeLessThan(2)
    }
  }
})

test("category actions stay together at the bottom of the menu while scrolling", async ({
  page,
}) => {
  await page.goto(fixture)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const menuList = page.locator(".live-menu-layout > fieldset")

  await menuList.evaluate((element) => {
    const filler = document.createElement("div")

    filler.style.height = "1600px"
    element.append(filler)
  })

  const create = page.getByRole("button", { name: "New category", exact: true })
  const manage = page.getByRole("button", {
    name: "Manage categories",
    exact: true,
  })

  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 720 })
    if (width === 1440) {
      const createBefore = await create.boundingBox()
      const manageBefore = await manage.boundingBox()

      await menuList.evaluate((element) => {
        element.scrollTop = 600
      })

      const createAfter = await create.boundingBox()
      const manageAfter = await manage.boundingBox()

      expect(
        Math.abs((createAfter?.y ?? 0) - (createBefore?.y ?? 0))
      ).toBeLessThan(2)
      expect(
        Math.abs((manageAfter?.y ?? 0) - (manageBefore?.y ?? 0))
      ).toBeLessThan(2)
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    }

    await expect(create).toBeInViewport()
    await expect(manage).toBeInViewport()

    const createBox = await create.boundingBox()
    const manageBox = await manage.boundingBox()

    expect(Math.abs((createBox?.y ?? 0) - (manageBox?.y ?? 0))).toBeLessThan(64)
  }
})

test("allergen declarations use click-to-toggle multi-select menus and no separate allergen tab", async ({
  page,
}) => {
  await page.goto(fixture)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await expect(page.getByRole("tab", { name: "Allergens" })).toHaveCount(0)
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await page.getByRole("button", { name: "Edit product", exact: true }).click()

  const form = page.getByRole("form", { name: "Edit product Soupe du potager" })
  const contains = form.getByRole("button", { name: "Contains", exact: true })
  const mayContain = form.getByRole("button", {
    name: "May contain",
    exact: true,
  })

  await contains.click()

  const milk = page.getByRole("checkbox", { name: "Milk", exact: true })
  const eggs = page.getByRole("checkbox", { name: "Eggs", exact: true })

  await expect(milk).toHaveRole("checkbox")
  await expect(milk).toHaveAccessibleName("Milk")
  await milk.click()
  await expect(milk).toHaveAttribute("data-checked", "")
  await expect(page.locator(".max-h-72")).toHaveClass(/lovable-live/)
  await expect(page.locator(".max-h-72")).toHaveCSS(
    "--primary",
    "oklch(0.5 0.16 152)"
  )

  await eggs.click()
  await expect(
    form.locator('input[type="hidden"][name="containsAllergens"][value="milk"]')
  ).toHaveCount(1)
  await expect(
    form.locator('input[type="hidden"][name="containsAllergens"][value="eggs"]')
  ).toHaveCount(1)

  await mayContain.click()
  await page.getByRole("checkbox", { name: "Sesame", exact: true }).click()
  await page.getByRole("checkbox", { name: "Peanuts", exact: true }).click()
  await expect(
    form.locator(
      'input[type="hidden"][name="mayContainAllergens"][value="sesame"]'
    )
  ).toHaveCount(1)
  await expect(
    form.locator(
      'input[type="hidden"][name="mayContainAllergens"][value="peanuts"]'
    )
  ).toHaveCount(1)
})

test("mobile product details scroll with the page and end without a blank tail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(fixture)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await expect
    .poll(() =>
      page
        .locator(".live-appbar")
        .evaluate((element) =>
          Math.round(element.getBoundingClientRect().height)
        )
    )
    .toBeLessThanOrEqual(180)

  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()

  const panel = page.locator(".live-product-panel").filter({ visible: true })

  await expect(panel).toHaveCSS("overflow-y", "visible")
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

  const geometry = await panel.evaluate((panelElement) => {
    const panelBottom =
      panelElement.getBoundingClientRect().bottom + window.scrollY

    return {
      scrollHeight: document.documentElement.scrollHeight,
      panelBottom,
    }
  })

  expect(geometry.scrollHeight - geometry.panelBottom).toBeLessThan(180)
  await page.mouse.move(200, 200)

  const beforeScroll = await page.evaluate(() => window.scrollY)

  await page.mouse.wheel(0, -300)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(beforeScroll)
})

test("desktop photo controls sit beside the preview and stack on small screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/en/photo-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", {
      name: "Select Burger Le Rustique Truffé",
      exact: true,
    })
    .click()

  const photos = page.getByRole("region", { name: "Product photography" })
  const preview = photos.locator("[data-photo-preview]")
  const controls = photos.locator("[data-photo-controls]")

  await expect(preview).toBeVisible()
  await expect(controls).toBeVisible()

  const desktopPreview = await preview.boundingBox()
  const desktopControls = await controls.boundingBox()

  expect(desktopPreview?.x).toBeLessThan(desktopControls?.x ?? 0)
  await page.setViewportSize({ width: 390, height: 844 })

  const mobilePreview = await preview.boundingBox()
  const mobileControls = await controls.boundingBox()

  expect(mobileControls?.y).toBeGreaterThan(mobilePreview?.y ?? 0)
})

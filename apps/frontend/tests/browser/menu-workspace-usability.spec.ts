import { expect, test } from "@playwright/test"

const fixture =
  "/en/catalog-design-test?view=builder&shell=1&tenantId=11111111-1111-4111-8111-111111111111"

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
  const save = form.getByRole("button", { name: "Save changes", exact: true })
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
    await panel.scrollIntoViewIfNeeded()
    await panel.evaluate((element) => {
      element.scrollTop = 800
    })
    await expect(save).toBeInViewport()

    const saveBox = await save.boundingBox()
    const panelBox = await panel.boundingBox()

    expect(saveBox?.y).toBeGreaterThanOrEqual(panelBox?.y ?? 0)
    expect(saveBox?.y).toBeLessThan(
      (panelBox?.y ?? 0) + (panelBox?.height ?? 0)
    )

    if (width <= 1024) {
      await expect(createCategory).toBeInViewport()
      await expect(manageCategories).toBeInViewport()

      const createBox = await createCategory.boundingBox()

      expect((saveBox?.y ?? 0) + (saveBox?.height ?? 0)).toBeLessThan(
        createBox?.y ?? 0
      )
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

test("allergen declarations use multi-select lists and no separate allergen tab", async ({
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
  const contains = form.getByLabel("Contains", { exact: true })
  const mayContain = form.getByLabel("May contain", { exact: true })

  await expect(contains).toHaveAttribute("multiple", "")
  await expect(mayContain).toHaveAttribute("multiple", "")
  await contains.selectOption(["milk", "eggs"])
  await mayContain.selectOption(["sesame", "peanuts"])
  await expect(contains).toHaveValues(["eggs", "milk"])
  await expect(mayContain).toHaveValues(["peanuts", "sesame"])
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

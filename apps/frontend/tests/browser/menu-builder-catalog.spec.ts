import { expect, test } from "@playwright/test"

test("shared workspace keeps discounts and archived products reachable", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("tab", { name: "Discount codes", exact: true }).click()

  const discount = page.getByRole("listitem", { name: /BIENVENUE/ })

  await expect(
    discount.getByLabel("Discount code", { exact: true })
  ).toHaveValue("BIENVENUE")
  await page.getByRole("tab", { name: "Dishes", exact: true }).click()
  await page
    .getByRole("button", { name: "All categories", exact: true })
    .click()
  await page.getByLabel("Show", { exact: true }).selectOption("archived")
  await page
    .getByRole("button", { name: "Select Velouté d’hiver", exact: true })
    .click()
  await expect(
    page
      .locator(".live-dish-row")
      .filter({ hasText: "Velouté d’hiver" })
      .getByRole("button", { name: "Restore product", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("form", { name: /Edit product/ })).toBeHidden()
})

test("product availability toggles directly from its status control", async ({
  page,
}) => {
  const requests: string[] = []

  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      requests.push(route.request().postData() ?? "")
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: '0:{"a":{"ok":true},"f":"","b":""}\n',
      })

      return
    }

    await route.continue()
  })

  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()

  const row = page
    .locator(".live-dish-row")
    .filter({ hasText: "Soupe du potager" })

  await row.hover()

  const toggle = page.getByRole("button", {
    name: "Hide product Soupe du potager",
    exact: true,
  })

  await expect(toggle).toBeVisible({ timeout: 1_000 })
  await toggle.click()
  await expect(
    page.getByRole("button", {
      name: "Make product Soupe du potager available",
      exact: true,
    })
  ).toHaveAttribute("aria-pressed", "false")
  expect(requests).toHaveLength(1)
  expect(requests[0]).toContain("false")
})

test("category rows follow the demo layout and keep the add action sticky", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const categoryRow = page
    .locator(".live-menu-category-row")
    .filter({ hasText: "Les entrées" })

  await expect(categoryRow.getByRole("button")).toHaveCount(4)
  await expect(
    categoryRow.getByRole("button", { name: "Hide category Les entrées" })
  ).toBeVisible()
  await expect(
    categoryRow.getByRole("button", { name: "Edit category Les entrées" })
  ).toHaveCount(0)
  await expect(page.locator(".live-menu-category-actions")).toHaveCSS(
    "position",
    "sticky"
  )
})

test("dragging a product submits the visible category order", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()

  const rows = page.locator(".live-dish-row")
  const firstProductId = "33333333-3333-4333-8333-333333333333"
  const secondProductId = "33333333-3333-4333-8333-444444444444"
  let actionBody = ""
  let resolveAction: () => void = () => {}

  const actionSubmitted = new Promise<void>((resolve) => {
    resolveAction = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      actionBody = route.request().postData() ?? ""
      resolveAction()
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: '0:{"a":{"ok":true},"f":"","b":""}\n',
      })

      return
    }

    await route.continue()
  })
  await expect(rows).toHaveCount(2)
  await rows
    .nth(1)
    .locator("[data-product-selector]")
    .dragTo(rows.nth(0).locator("[data-product-selector]"))
  await actionSubmitted

  await expect(rows.nth(0)).toContainText(
    "Salade de tomates anciennes et burrata",
    {
      timeout: 1_000,
    }
  )

  expect(actionBody.indexOf(secondProductId)).toBeGreaterThanOrEqual(0)
  expect(actionBody.indexOf(firstProductId)).toBeGreaterThanOrEqual(0)
  expect(actionBody.indexOf(secondProductId)).toBeLessThan(
    actionBody.indexOf(firstProductId)
  )
})

test("active products remain reorderable with all categories selected", async ({
  page,
}) => {
  const firstProductId = "33333333-3333-4333-8333-333333333333"
  const secondProductId = "33333333-3333-4333-8333-444444444444"
  let actionBody = ""
  let resolveAction: () => void = () => {}

  const actionSubmitted = new Promise<void>((resolve) => {
    resolveAction = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      actionBody = route.request().postData() ?? ""
      resolveAction()
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: '0:{"a":{"ok":true},"f":"","b":""}\n',
      })

      return
    }

    await route.continue()
  })

  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const rows = page.locator(".live-dish-row")

  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toHaveAttribute("draggable", "true")
  await rows
    .nth(1)
    .locator("[data-product-selector]")
    .dragTo(rows.nth(0).locator("[data-product-selector]"))
  await actionSubmitted

  await expect(rows.nth(0)).toContainText(
    "Salade de tomates anciennes et burrata"
  )
  expect(actionBody).toContain("22222222-2222-4222-8222-222222222222")
  expect(actionBody.indexOf(secondProductId)).toBeLessThan(
    actionBody.indexOf(firstProductId)
  )
})

test("dragging categories submits and immediately displays the new order", async ({
  page,
}) => {
  let actionBody = ""
  let releaseAction: () => void = () => {}

  const release = new Promise<void>((resolve) => {
    releaseAction = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      actionBody = route.request().postData() ?? ""
      await release
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: '0:{"a":{"ok":true},"f":"","b":""}\n',
      })

      return
    }

    await route.continue()
  })

  await page.setViewportSize({ width: 1440, height: 1400 })
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  try {
    const rows = page.locator(".live-menu-category-row")

    await expect(rows).toHaveCount(3)

    const source = rows.nth(2).getByRole("button").nth(1)

    await source.dragTo(rows.nth(0))
    await expect(rows.nth(0)).toContainText("Les desserts", { timeout: 1_000 })
    expect(actionBody).toContain("categories")
    expect(
      actionBody.indexOf("22222222-2222-4222-8222-444444444444")
    ).toBeLessThan(actionBody.indexOf("22222222-2222-4222-8222-222222222222"))
  } finally {
    releaseAction()
  }
})

test("discount codes use the demo's inline code, type, value, minimum and expiry fields", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("tab", { name: "Discount codes", exact: true }).click()

  const row = page.getByRole("listitem", { name: /BIENVENUE/ })

  await expect(row.getByLabel("Discount code", { exact: true })).toHaveValue(
    "BIENVENUE"
  )
  await expect(row.getByLabel("Type", { exact: true })).toHaveValue(
    "Percentage"
  )
  await expect(row.getByLabel("Value", { exact: true })).toHaveValue("10")
  await expect(row.getByLabel("Minimum order", { exact: true })).toHaveValue(
    "0"
  )
  await expect(row.getByLabel("Expires", { exact: true })).toHaveValue("")
})

test("the product panel opens directly without a redundant edit button", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()

  await expect(page.getByRole("form", { name: /Edit product/ })).toBeVisible()
  await expect(page.getByRole("button", { name: "Edit product" })).toHaveCount(
    0
  )
})

test("product extras keep the demo's inset cards and the archive cross appears on hover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()

  const panel = page.locator(".live-product-panel")
  const group = panel
    .locator('[data-slot="card"]')
    .filter({ hasText: "Accompagnement" })
    .first()
  const headerPadding = await group
    .locator('[data-slot="card-header"]')
    .evaluate((element) => getComputedStyle(element).paddingInlineStart)

  expect(Number.parseFloat(headerPadding)).toBeGreaterThanOrEqual(12)

  const contentPadding = await group
    .locator('[data-slot="card-content"]')
    .evaluate((element) => getComputedStyle(element).paddingInlineStart)

  expect(Number.parseFloat(contentPadding)).toBeGreaterThanOrEqual(20)

  const row = page
    .locator(".live-dish-row")
    .filter({ hasText: "Soupe du potager" })
  const archive = row.getByRole("button", {
    name: "Archive Soupe du potager",
    exact: true,
  })
  const rowBox = await row.boundingBox()
  const archiveBox = await archive.boundingBox()
  const visibility = row.getByRole("button", {
    name: "Hide product Soupe du potager",
    exact: true,
  })
  const visibilityBox = await visibility.boundingBox()

  await expect(archive).toHaveCSS("position", "absolute")
  await expect(visibility).toHaveCSS("position", "absolute")
  expect(visibilityBox?.y).toBeGreaterThan(archiveBox?.y ?? 0)
  expect(archiveBox?.x).toBeGreaterThanOrEqual(
    (rowBox?.x ?? 0) + (rowBox?.width ?? 0) - (archiveBox?.width ?? 0) - 16
  )
  expect(archiveBox?.y).toBeLessThanOrEqual((rowBox?.y ?? 0) + 12)
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  })
  await expect(archive).toHaveCSS("opacity", "0")
  await row.hover()
  await expect(archive).toHaveCSS("opacity", "1")
})

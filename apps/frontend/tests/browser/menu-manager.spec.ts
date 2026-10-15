import { expect, test } from "@playwright/test"

test("demo tabs retain filters and category actions stay in the selected category", async ({
  page,
}) => {
  await page.goto(
    "/en/catalog-design-test?view=builder&shell=1&tenantId=11111111-1111-4111-8111-111111111111"
  )
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await expect(
    page.getByRole("link", { name: "Menu", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("tab")).toHaveCount(3)
  await expect(page.getByRole("tab", { name: "Allergens" })).toHaveCount(0)
  await page.getByLabel("Search products", { exact: true }).fill("Soupe")
  await page.getByRole("tab", { name: "Languages", exact: true }).click()
  await page.getByRole("tab", { name: "Dishes", exact: true }).click()
  await expect(page.getByLabel("Search products", { exact: true })).toHaveValue(
    "Soupe"
  )
  await expect(
    page.getByRole("button", { name: "Manage categories", exact: true })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Hide category Les entrées", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Archive Les entrées", exact: true })
  ).toBeVisible()
})

test("dish cards open an adjacent product editor and retain its draft", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await expect(
    page.getByRole("list", { name: "Products", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()

  const sheet = page.locator(".live-product-panel").filter({ visible: true })

  await expect(sheet).toBeVisible()
  await expect(
    sheet
      .getByRole("region", { name: "Product details" })
      .getByText("Légumes de saison et herbes fraîches.", { exact: true })
  ).toBeVisible()
  await sheet.getByLabel("Name", { exact: true }).fill("Retained draft")
  await sheet.getByRole("button", { name: "Close", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Select Soupe du potager", exact: true })
  ).toBeFocused()
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await expect(sheet.getByLabel("Name", { exact: true })).toHaveValue(
    "Retained draft"
  )
  await expect(sheet.getByRole("region", { name: "Extras" })).toBeVisible()
  await expect(sheet.getByRole("table", { name: "Translations" })).toHaveCount(
    0
  )
})

test("an empty menu can save a category in context and select it without clearing the product", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder&empty=1")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "New product", exact: true }).click()

  const product = page.getByRole("form", { name: "New product", exact: true })

  await product.getByLabel("Name", { exact: true }).fill("Seasonal soup")
  await product
    .getByLabel("Description", { exact: true })
    .fill("Keep this description")
  await product
    .getByRole("button", { name: "Create category", exact: true })
    .click()

  const category = page.getByRole("form", { name: "New category", exact: true })

  await category.getByLabel("Name", { exact: true }).fill("Lunch")

  let reject = true

  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() !== "POST" ||
      !route.request().headers()["next-action"]
    )
      return route.continue()

    const result = reject
      ? { ok: false, error: "unavailable" }
      : {
          ok: true,
          category: {
            id: "88888888-8888-4888-8888-888888888888",
            name: "Lunch",
            sortOrder: 0,
            isVisible: true,
            isArchived: false,
            translations: {},
          },
        }

    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: `0:${JSON.stringify({ a: result, f: "", b: "" })}\n`,
    })
  })
  await category
    .getByRole("button", { name: "Create category", exact: true })
    .click()
  await expect(category.getByRole("alert")).toBeVisible()
  await expect(category.getByLabel("Name", { exact: true })).toHaveValue(
    "Lunch"
  )
  reject = false
  await category
    .getByRole("button", { name: "Create category", exact: true })
    .click()
  await expect(product.getByLabel("Category", { exact: true })).toHaveValue(
    "88888888-8888-4888-8888-888888888888"
  )
  await expect(product.getByLabel("Name", { exact: true })).toHaveValue(
    "Seasonal soup"
  )
  await expect(product.getByLabel("Description", { exact: true })).toHaveValue(
    "Keep this description"
  )
})

test("product status and category filters combine, including inherited archival", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const table = page.getByRole("list", { name: "Products", exact: true })

  await expect(
    table.getByRole("button", { name: "Select Soupe du potager", exact: true })
  ).toBeVisible()
  await page.getByLabel("Show", { exact: true }).selectOption("archived")
  await expect(
    table.getByRole("button", { name: "Select Soupe du potager", exact: true })
  ).toHaveCount(0)
  await expect(
    table.getByRole("button", { name: "Select Velouté d’hiver", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Ancienne carte 1", exact: true })
    .click()
  await expect(
    table.getByRole("button", {
      name: "Select Produit de la catégorie archivée",
      exact: true,
    })
  ).toBeVisible()
  await expect(
    table.getByRole("button", { name: "Select Velouté d’hiver", exact: true })
  ).toHaveCount(0)
})

test("failed optimistic product reorders roll back to the saved order", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder&shell=1")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()

  let releaseAction: () => void = () => {}

  let actionArrived: () => void = () => {}

  const release = new Promise<void>((resolve) => {
    releaseAction = resolve
  })
  const arrived = new Promise<void>((resolve) => {
    actionArrived = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()
    actionArrived()
    await release
    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":false,"error":"unavailable"},"f":"","b":""}\n',
    })
  })

  const rows = page.locator(".live-dish-row")

  try {
    await expect(rows).toHaveCount(2)
    await rows.nth(1).dragTo(rows.nth(0))
    await arrived
    await expect(rows.nth(0)).toContainText("Salade de tomates anciennes")
    releaseAction()
    await expect(rows.nth(0)).toContainText("Soupe du potager")
    await expect(
      page.getByText("The catalog service is unavailable. Try again.", {
        exact: true,
      })
    ).toBeVisible()
  } finally {
    releaseAction()
  }
})

test("extras retain failed edits from the product sheet", async ({ page }) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await page
    .getByRole("button", {
      name: "Edit option group Accompagnement",
      exact: true,
    })
    .click()

  const form = page.getByRole("form", {
    name: "Edit option group Accompagnement",
    exact: true,
  })

  await form.getByLabel("Name", { exact: true }).fill("Retained extra group")
  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()
    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":false,"error":"unavailable"},"f":"","b":""}\n',
    })
  })
  await form.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(form.getByRole("alert")).toBeVisible()
  await expect(form.getByLabel("Name", { exact: true })).toHaveValue(
    "Retained extra group"
  )
  await form.getByRole("button", { name: "Cancel", exact: true }).click()
})

test("new product allows creating a category without losing its fields", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "New product", exact: true }).click()

  const form = page.getByRole("form", { name: "New product", exact: true })

  await form.getByLabel("Name", { exact: true }).fill("New soup")
  await form
    .getByRole("button", { name: "Create category", exact: true })
    .click()
  await expect(
    page.getByRole("form", { name: "New category", exact: true })
  ).toBeVisible()
  await page
    .getByRole("form", { name: "New category", exact: true })
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await expect(form.getByLabel("Name", { exact: true })).toHaveValue("New soup")
})

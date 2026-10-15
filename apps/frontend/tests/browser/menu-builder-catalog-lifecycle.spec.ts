import { expect, test } from "@playwright/test"

test("category rows expose visibility and archive actions with confirmation", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const categoryRow = page
    .locator(".live-menu-category-row")
    .filter({ hasText: "Les entrées" })

  await expect(
    categoryRow.getByRole("button", {
      name: "Hide category Les entrées",
      exact: true,
    })
  ).toBeVisible()

  const archiveBox = await categoryRow
    .getByRole("button", { name: "Archive Les entrées", exact: true })
    .boundingBox()
  const visibilityBox = await categoryRow
    .getByRole("button", { name: "Hide category Les entrées", exact: true })
    .boundingBox()

  expect(visibilityBox?.y).toBeGreaterThan(archiveBox?.y ?? 0)
  await categoryRow
    .getByRole("button", { name: "Archive Les entrées", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Archive Les entrées?", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(page.locator(".live-menu-layout")).toHaveAttribute(
    "data-dragging",
    "false"
  )
})

test("restoring an archived category switches the product filter to active", async ({
  page,
}) => {
  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
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
  await page
    .locator(".live-menu-category-row")
    .filter({ hasText: "Ancienne carte" })
    .getByRole("button", { name: "Restore Ancienne carte", exact: true })
    .click()

  await expect(page.getByLabel("Show", { exact: true })).toHaveValue("active")
})

test("restoring a product switches back to active products", async ({
  page,
}) => {
  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
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
  await page.getByLabel("Show", { exact: true }).selectOption("archived")
  await page
    .getByRole("button", { name: "Select Velouté d’hiver", exact: true })
    .click()
  await page
    .locator(".live-dish-row")
    .filter({ hasText: "Velouté d’hiver" })
    .getByRole("button", { name: "Restore product", exact: true })
    .click()

  await expect(page.getByLabel("Show", { exact: true })).toHaveValue("active")
})

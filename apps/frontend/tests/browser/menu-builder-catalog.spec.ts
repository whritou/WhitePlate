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
  await expect(page.getByText("BIENVENUE", { exact: true })).toBeVisible()
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

test("dragging a product submits the visible category order", async ({ page }) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", { name: "Les entrées 2", exact: true })
    .click()

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
  await rows.nth(1).dragTo(rows.nth(0))
  await actionSubmitted

  expect(actionBody.indexOf(secondProductId)).toBeGreaterThanOrEqual(0)
  expect(actionBody.indexOf(firstProductId)).toBeGreaterThanOrEqual(0)
  expect(actionBody.indexOf(secondProductId)).toBeLessThan(
    actionBody.indexOf(firstProductId)
  )
})

import { expect, test } from "@playwright/test"

const soup = "Soupe du potager"

test("catalog save blocks dismissal while pending, retains rejected input and closes on acknowledgement", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", { name: `Edit product ${soup}`, exact: true })
    .click()

  const dialog = page.getByRole("dialog")
  let release = () => {}

  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  let started = () => {}

  const requestStarted = new Promise<void>((resolve) => {
    started = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()
    started()
    await released
    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":false,"error":"unavailable"},"f":"","b":""}\n',
    })
  })
  await dialog.getByLabel("Name", { exact: true }).fill("Rejected draft")
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await requestStarted
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true })
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeVisible()
  release()
  await expect(dialog.getByRole("alert")).toBeVisible()
  await expect(dialog.getByLabel("Name", { exact: true })).toHaveValue(
    "Rejected draft"
  )
  await page.unroute("**/catalog-design-test*")
  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()
    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":true},"f":"","b":""}\n',
    })
  })
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: `Edit product ${soup}`, exact: true })
  ).toBeFocused()
})

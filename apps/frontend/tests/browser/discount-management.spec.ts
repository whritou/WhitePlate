import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { requireAcceptanceDatabase } from "./acceptance-environment"

async function openEditor(page: Page, title: string) {
  await page.getByRole("button", { name: title, exact: true }).click()

  return page.getByRole("dialog", { name: title, exact: true })
}

test("owner manages fixed and percentage discount codes", async ({
  page,
  context,
}) => {
  requireAcceptanceDatabase()

  const email = process.env.WHITEPLATE_DEV_EMAIL
  const password = process.env.WHITEPLATE_DEV_PASSWORD

  if (!email?.endsWith(".invalid") || !password)
    throw new Error("Configure the verified local .invalid acceptance account")

  const fixture = JSON.parse(
    await readFile(".acceptance/restaurant.json", "utf8")
  )
  const login = await context.request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { Origin: "http://localhost:3000" },
  })

  expect(login.status()).toBe(200)
  await page.goto(`/en/organization/catalog?tenantId=${fixture.tenantId}`)
  await page.getByRole("button", { name: "Discounts", exact: true }).click()

  const stamp = Date.now().toString(36).toUpperCase()
  const fixedCode = `LUNCH-${stamp}`
  const percentCode = `WELCOME-${stamp}`
  const create = await openEditor(page, "New discount code")

  await create.getByLabel("Discount code").fill(fixedCode.toLowerCase())
  await create.getByLabel("Name", { exact: true }).fill(`Lunch ${stamp}`)
  await create.getByLabel("Discount type").selectOption("FixedAmount")
  await create.getByLabel("Value (GBP)").fill("2.50")
  await create.getByRole("button", { name: "Create discount code" }).click()
  await expect(create).toHaveCount(0)

  const fixed = page.getByRole("listitem", { name: new RegExp(fixedCode) })
  const editFixed = await openEditor(page, `Edit discount ${fixedCode}`)

  await expect(editFixed.locator('[name="code"]')).toHaveCount(0)
  await editFixed
    .getByLabel("Name", { exact: true })
    .fill(`Lunch edited ${stamp}`)
  await editFixed
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await expect(editFixed).toHaveCount(0)
  await openEditor(page, `Edit discount ${fixedCode}`)
  await expect(editFixed.getByLabel("Name", { exact: true })).toHaveValue(
    `Lunch edited ${stamp}`
  )
  await editFixed.getByRole("button", { name: "Cancel", exact: true }).click()

  const deactivateFixed = fixed.getByRole("button", {
    name: `Deactivate discount ${fixedCode}`,
    exact: true,
  })
  const confirmation = page.getByRole("alertdialog")

  await deactivateFixed.click()
  await expect(confirmation).toContainText(
    "Existing order history will be kept"
  )
  await expect(
    confirmation.getByRole("button", { name: "Cancel", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(confirmation).toHaveCount(0)
  await expect(deactivateFixed).toBeFocused()

  let release = () => {}

  let started = () => {}

  const requestStarted = new Promise<void>((resolve) => {
    started = resolve
  })
  const requestReleased = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route("**/organization/catalog*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      started()
      await requestReleased
    }

    await route.continue()
  })
  await deactivateFixed.click()
  await confirmation
    .getByRole("button", { name: "Confirm deactivation", exact: true })
    .click()
  await requestStarted
  await expect(
    confirmation.getByRole("button", { name: "Cancel", exact: true })
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await expect(confirmation).toBeVisible()
  release()
  await expect(confirmation).toHaveCount(0)
  await expect(
    fixed.getByRole("button", {
      name: `Edit discount ${fixedCode}`,
      exact: true,
    })
  ).toHaveCount(0)
  await page.unroute("**/organization/catalog*")

  const newPercentage = await openEditor(page, "New discount code")

  await newPercentage.getByLabel("Discount code").fill(percentCode)
  await newPercentage
    .getByLabel("Name", { exact: true })
    .fill(`Welcome ${stamp}`)
  await newPercentage.getByLabel("Discount type").selectOption("Percentage")
  await newPercentage.getByLabel("Value (%)").fill("15")
  await newPercentage
    .getByRole("button", { name: "Create discount code" })
    .click()
  await expect(newPercentage).toHaveCount(0)

  const percentage = page.getByRole("listitem", {
    name: new RegExp(percentCode),
  })

  await expect(percentage).toContainText("15%")
  await percentage
    .getByRole("button", {
      name: `Deactivate discount ${percentCode}`,
      exact: true,
    })
    .click()

  let failNext = true

  await page.route("**/organization/catalog*", async (route) => {
    if (
      failNext &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      failNext = false
      await route.abort("failed")

      return
    }

    await route.continue()
  })
  await confirmation
    .getByRole("button", { name: "Confirm deactivation", exact: true })
    .click()
  await expect(confirmation.getByRole("alert")).toContainText(
    "service is unavailable"
  )
  await page.unroute("**/organization/catalog*")
  await confirmation
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await expect(
    percentage.getByRole("button", {
      name: `Edit discount ${percentCode}`,
      exact: true,
    })
  ).toBeVisible()
  await page.goto(`/fr/organization/catalog?tenantId=${fixture.tenantId}`)
  await page.getByRole("button", { name: "Remises", exact: true }).click()

  const frenchEditor = page.getByRole("region", { name: "Codes de réduction" })
  const frenchCreate = await openEditor(page, "Nouveau code de réduction")

  await expect(frenchCreate.getByLabel("Code de réduction")).toBeVisible()
  await expect(frenchCreate.getByLabel("Type de réduction")).toBeVisible()
  await frenchCreate
    .getByRole("button", { name: "Annuler", exact: true })
    .click()
  await expect(
    frenchEditor.getByText("Inactif", { exact: true }).first()
  ).toBeVisible()
  await expect(frenchEditor).toContainText(/15\s*%/)
  await page
    .getByRole("button", {
      name: `Désactiver la réduction ${percentCode}`,
      exact: true,
    })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmer la désactivation", exact: true })
    .click()
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
})

import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { requireAcceptanceDatabase } from "./acceptance-environment"

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

  const stamp = Date.now().toString(36).toUpperCase()
  const fixedCode = `LUNCH-${stamp}`
  const percentCode = `WELCOME-${stamp}`
  const editor = page.getByRole("region", { name: "Discount codes" })
  const create = editor.getByRole("form", { name: "New discount code" })

  await expect(editor).toBeVisible()
  await create.getByLabel("Discount code").fill(fixedCode.toLowerCase())
  await create.getByLabel("Name", { exact: true }).fill(`Lunch ${stamp}`)
  await create.getByLabel("Discount type").selectOption("FixedAmount")
  await create.getByLabel("Value (GBP)").fill("2.50")
  await create.getByRole("button", { name: "Create discount code" }).click()
  await expect(create.getByLabel("Discount type")).toHaveValue("FixedAmount")
  await expect(create.getByLabel("Value (GBP)")).toBeVisible()

  const fixed = page.getByRole("listitem", { name: new RegExp(fixedCode) })
  const editFixed = fixed.getByRole("form", {
    name: `Edit discount ${fixedCode}`,
  })

  await expect(editFixed).toBeVisible()
  await expect(editFixed.locator('[name="code"]')).toHaveCount(0)
  await editFixed
    .getByLabel("Name", { exact: true })
    .fill(`Lunch edited ${stamp}`)
  await editFixed.getByRole("button", { name: "Save changes" }).click()
  await expect(editFixed.getByLabel("Name", { exact: true })).toHaveValue(
    `Lunch edited ${stamp}`
  )

  const deactivateFixed = fixed.getByRole("button", {
    name: `Deactivate discount ${fixedCode}`,
  })

  await deactivateFixed.click()

  const fixedDialog = page.getByRole("alertdialog")

  await expect(fixedDialog).toContainText(
    `Stop accepting ${fixedCode} at checkout? Existing order history will be kept.`
  )
  await expect(
    fixedDialog.getByRole("button", { name: "Cancel", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(fixedDialog).toBeHidden()
  await expect(deactivateFixed).toBeFocused()
  await expect(editFixed).toBeVisible()

  let releaseMutation = () => {}

  let signalMutationStarted = () => {}

  const mutationStarted = new Promise<void>((resolve) => {
    signalMutationStarted = resolve
  })
  const mutationReleased = new Promise<void>((resolve) => {
    releaseMutation = resolve
  })

  await page.route("**/organization/catalog*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      signalMutationStarted()
      await mutationReleased
    }

    await route.continue()
  })
  await deactivateFixed.click()
  await fixedDialog
    .getByRole("button", { name: "Confirm deactivation", exact: true })
    .click()
  await mutationStarted
  await expect(
    fixedDialog.getByRole("button", {
      name: "Confirm deactivation",
      exact: true,
    })
  ).toBeDisabled()
  await expect(
    fixedDialog.getByRole("button", { name: "Cancel", exact: true })
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await expect(fixedDialog).toBeVisible()
  releaseMutation()
  await expect(editFixed).toHaveCount(0)
  await expect(fixedDialog).toBeHidden()
  await expect(deactivateFixed).toBeFocused()
  await page.unroute("**/organization/catalog*")

  await create.getByLabel("Discount code").fill(percentCode)
  await create.getByLabel("Name", { exact: true }).fill(`Welcome ${stamp}`)
  await create.getByLabel("Discount type").selectOption("Percentage")
  await create.getByLabel("Value (%)").fill("15")
  await create.getByRole("button", { name: "Create discount code" }).click()

  const percentage = page.getByRole("listitem", {
    name: new RegExp(percentCode),
  })
  const editPercentage = percentage.getByRole("form", {
    name: `Edit discount ${percentCode}`,
  })

  await expect(editPercentage).toBeVisible()
  await expect(percentage).toContainText("15%")
  await percentage
    .getByRole("button", { name: `Deactivate discount ${percentCode}` })
    .click()

  const percentageDialog = page.getByRole("alertdialog")
  let failNextCatalogMutation = true

  await page.route("**/organization/catalog*", async (route) => {
    if (
      failNextCatalogMutation &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      failNextCatalogMutation = false
      await route.abort("failed")

      return
    }

    await route.continue()
  })
  await percentageDialog
    .getByRole("button", { name: "Confirm deactivation", exact: true })
    .click()
  await expect(percentageDialog.getByRole("alert")).toContainText(
    "service is unavailable"
  )
  await expect(percentageDialog).toBeVisible()
  await page.unroute("**/organization/catalog*")
  await percentageDialog
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await expect(percentageDialog).toBeHidden()
  await expect(editPercentage).toBeVisible()

  await page.goto(`/fr/organization/catalog?tenantId=${fixture.tenantId}`)

  const frenchEditor = page.getByRole("region", {
    name: "Codes de réduction",
  })
  const frenchCreate = frenchEditor.getByRole("form", {
    name: "Nouveau code de réduction",
  })

  await expect(frenchCreate.getByLabel("Code de réduction")).toBeVisible()
  await expect(frenchCreate.getByLabel("Type de réduction")).toBeVisible()
  await expect(frenchEditor.getByText("Inactif").first()).toBeVisible()
  await expect(frenchEditor).toContainText(/15\s*%/)
})

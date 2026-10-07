import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { requireAcceptanceDatabase } from "./acceptance-environment"

async function openEditor(page: Page, title: string) {
  await page.getByRole("button", { name: title, exact: true }).click()

  const dialog = page.getByRole("dialog", { name: title, exact: true })

  await expect(dialog).toBeVisible()

  return dialog
}

test("owner creates, edits and archives catalog items with localized feedback", async ({
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
  await expect(
    page.getByRole("heading", { name: "Manage catalog", exact: true })
  ).toBeVisible()
  await page.getByRole("tab", { name: "Categories", exact: true }).click()

  const stamp = Date.now().toString(36)
  const categoryName = `Lunch ${stamp}`
  const productName = `Soup ${stamp}`
  const category = await openEditor(page, "New category")

  await category.getByLabel("Name", { exact: true }).fill(categoryName)
  await category.getByLabel("Display order", { exact: true }).fill("3")
  await category
    .getByRole("button", { name: "Create category", exact: true })
    .click()
  await expect(category).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: categoryName, exact: true })
  ).toBeVisible()
  await page.getByRole("tab", { name: "Products", exact: true }).click()

  const product = await openEditor(page, "New product")

  await product
    .getByLabel("Category", { exact: true })
    .selectOption({ label: categoryName })
  await product.getByLabel("Name", { exact: true }).fill(productName)
  await product.getByLabel("Description", { exact: true }).fill("Fresh soup")
  await product.getByLabel("Base price (GBP)", { exact: true }).fill("7.50")
  await product.getByLabel("Tax rate (%)", { exact: true }).fill("5.50")
  await product.getByLabel("Display order", { exact: true }).fill("2")
  await product
    .getByRole("button", { name: "Create product", exact: true })
    .click()
  await expect(product).toHaveCount(0)

  const edit = await openEditor(page, `Edit product ${productName}`)

  await edit.getByLabel("Base price (GBP)", { exact: true }).fill("8.25")
  await edit.getByLabel("Availability", { exact: true }).selectOption("false")
  await edit.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(edit).toHaveCount(0)

  const options = await openEditor(page, `Options for ${productName}`)
  const groupName = `Size ${stamp}`
  const editedGroupName = `Portion ${stamp}`
  const group = await openEditor(page, `New option group for ${productName}`)

  await group.getByLabel("Name", { exact: true }).fill(groupName)
  await group.getByLabel("Minimum selections", { exact: true }).fill("0")
  await group.getByLabel("Maximum selections", { exact: true }).fill("2")
  await group.getByLabel("Display order", { exact: true }).fill("1")
  await group
    .getByRole("button", { name: "Create option group", exact: true })
    .click()
  await expect(group).toHaveCount(0)

  const editGroup = await openEditor(page, `Edit option group ${groupName}`)

  await editGroup.getByLabel("Name", { exact: true }).fill(editedGroupName)
  await editGroup.getByLabel("Minimum selections", { exact: true }).fill("1")
  await editGroup.getByLabel("Display order", { exact: true }).fill("0")
  await editGroup
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await expect(editGroup).toHaveCount(0)

  const optionName = `Large ${stamp}`
  const option = await openEditor(page, `New option for ${editedGroupName}`)

  await option.getByLabel("Name", { exact: true }).fill(optionName)
  await option
    .getByLabel("Price adjustment (GBP)", { exact: true })
    .fill("1.25")
  await option.getByLabel("Display order", { exact: true }).fill("2")
  await option
    .getByRole("button", { name: "Create option", exact: true })
    .click()
  await expect(option).toHaveCount(0)

  const editOption = await openEditor(page, `Edit option ${optionName}`)

  await editOption
    .getByLabel("Price adjustment (GBP)", { exact: true })
    .fill("1.75")
  await editOption.getByLabel("Display order", { exact: true }).fill("3")
  await editOption
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await expect(editOption).toHaveCount(0)

  const secondOptionName = `Small ${stamp}`
  const secondOption = await openEditor(
    page,
    `New option for ${editedGroupName}`
  )

  await secondOption.getByLabel("Name", { exact: true }).fill(secondOptionName)
  await secondOption
    .getByLabel("Price adjustment (GBP)", { exact: true })
    .fill("0")
  await secondOption.getByLabel("Display order", { exact: true }).fill("0")
  await secondOption
    .getByRole("button", { name: "Create option", exact: true })
    .click()
  await expect(secondOption).toHaveCount(0)
  await options.getByRole("button", { name: "Close", exact: true }).click()
  await page.reload()

  const persisted = await openEditor(page, `Edit product ${productName}`)

  await expect(
    persisted.getByLabel("Availability", { exact: true })
  ).toHaveValue("false")
  await expect(
    persisted.getByLabel("Base price (GBP)", { exact: true })
  ).toHaveValue("8.25")
  await persisted.getByRole("button", { name: "Cancel", exact: true }).click()
  await openEditor(page, `Options for ${productName}`)

  const persistedGroup = await openEditor(
    page,
    `Edit option group ${editedGroupName}`
  )

  await expect(
    persistedGroup.getByLabel("Minimum selections", { exact: true })
  ).toHaveValue("1")
  await expect(
    persistedGroup.getByLabel("Maximum selections", { exact: true })
  ).toHaveValue("2")
  await persistedGroup
    .getByRole("button", { name: "Cancel", exact: true })
    .click()

  const persistedOption = await openEditor(page, `Edit option ${optionName}`)

  await expect(
    persistedOption.getByLabel("Price adjustment (GBP)", { exact: true })
  ).toHaveValue("1.75")
  await persistedOption
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await options.getByRole("button", { name: "Close", exact: true }).click()
  await page.getByRole("tab", { name: "Categories", exact: true }).click()

  const editCategory = await openEditor(page, `Edit category ${categoryName}`)

  await editCategory.getByLabel("Display order", { exact: true }).fill("1")
  await editCategory
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await expect(editCategory).toHaveCount(0)
  await page.reload()
  await page.getByRole("tab", { name: "Categories", exact: true }).click()

  const persistedCategory = await openEditor(
    page,
    `Edit category ${categoryName}`
  )

  await expect(
    persistedCategory.getByLabel("Display order", { exact: true })
  ).toHaveValue("1")
  await persistedCategory
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await page.goto(`/fr/organization/catalog?tenantId=${fixture.tenantId}`)
  await openEditor(page, `Options de ${productName}`)

  const archiveOption = page.getByRole("button", {
    name: `Archiver ${optionName}`,
    exact: true,
  })
  const confirmation = page.getByRole("alertdialog")

  await archiveOption.click()
  await expect(confirmation).toContainText("Cette option ne sera plus proposée")
  await expect(
    confirmation.getByRole("button", { name: "Annuler", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(confirmation).toHaveCount(0)
  await expect(archiveOption).toBeFocused()
  await archiveOption.click()
  await confirmation
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(confirmation).toHaveCount(0)
  await expect(
    page.getByRole("button", {
      name: `Modifier l’option ${optionName}`,
      exact: true,
    })
  ).toHaveCount(0)

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
  await page
    .getByRole("button", { name: `Archiver ${secondOptionName}`, exact: true })
    .click()
  await confirmation
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(confirmation.getByRole("alert")).toContainText("indisponible")
  await expect(confirmation).toBeVisible()
  await page.unroute("**/organization/catalog*")
  await confirmation
    .getByRole("button", { name: "Annuler", exact: true })
    .click()

  const archiveGroup = page.getByRole("button", {
    name: `Archiver ${editedGroupName}`,
    exact: true,
  })

  await archiveGroup.click()
  await expect(confirmation).toContainText("et ses options")
  await confirmation
    .getByRole("button", { name: "Annuler", exact: true })
    .click()
  await expect(archiveGroup).toBeFocused()
  await archiveGroup.click()
  await confirmation
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(confirmation).toHaveCount(0)
  await expect(
    page.getByRole("button", {
      name: `Modifier le groupe d’options ${editedGroupName}`,
      exact: true,
    })
  ).toHaveCount(0)
  await page
    .getByRole("dialog", { name: `Options de ${productName}`, exact: true })
    .getByRole("button", { name: "Fermer", exact: true })
    .click()

  const archiveProduct = page.getByRole("button", {
    name: `Archiver ${productName}`,
    exact: true,
  })

  await archiveProduct.click()
  await expect(confirmation).toContainText("Il quittera le menu public")
  await confirmation
    .getByRole("button", { name: "Annuler", exact: true })
    .click()
  await expect(archiveProduct).toBeFocused()
  await archiveProduct.click()
  await confirmation
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: productName, exact: true })
  ).toHaveCount(0)
  await page.getByRole("tab", { name: "Catégories", exact: true }).click()
  await page
    .getByRole("button", { name: `Archiver ${categoryName}`, exact: true })
    .click()
  await expect(confirmation).toContainText("tous ses produits et options")
  await confirmation
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(
    page.getByRole("button", {
      name: `Modifier la catégorie ${categoryName}`,
      exact: true,
    })
  ).toHaveCount(0)
  await page.reload()
  await page.getByLabel("Afficher", { exact: true }).selectOption("archived")
  await expect(
    page.getByRole("heading", { name: productName, exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: `Modifier le produit ${productName}`,
      exact: true,
    })
  ).toHaveCount(0)
})

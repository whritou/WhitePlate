import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("owner creates, edits and archives catalog items with localized feedback", async ({
  page,
  context,
}) => {
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

  const stamp = Date.now().toString(36)
  const categoryName = `Lunch ${stamp}`
  const productName = `Soup ${stamp}`
  const category = page.getByRole("form", { name: "New category", exact: true })

  await category.getByLabel("Name", { exact: true }).fill(categoryName)
  await category.getByLabel("Display order", { exact: true }).fill("3")
  await category
    .getByRole("button", { name: "Create category", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: categoryName, exact: true })
  ).toBeVisible()

  const product = page.getByRole("form", { name: "New product", exact: true })

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

  const edit = page.getByRole("form", {
    name: `Edit product ${productName}`,
    exact: true,
  })

  await expect(edit).toBeVisible()
  await edit.getByLabel("Base price (GBP)", { exact: true }).fill("8.25")
  await edit.getByLabel("Availability", { exact: true }).selectOption("false")
  await edit.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(
    edit.getByLabel("Base price (GBP)", { exact: true })
  ).toHaveValue("8.25")
  await page.reload()
  await expect(edit.getByLabel("Availability", { exact: true })).toHaveValue(
    "false"
  )
  await expect(
    edit.getByLabel("Base price (GBP)", { exact: true })
  ).toHaveValue("8.25")

  const editCategory = page.getByRole("form", {
    name: `Edit category ${categoryName}`,
    exact: true,
  })

  await editCategory.getByLabel("Display order", { exact: true }).fill("1")
  await editCategory
    .getByRole("button", { name: "Save changes", exact: true })
    .click()
  await expect(
    editCategory.getByLabel("Display order", { exact: true })
  ).toHaveValue("1")
  await page.goto(`/fr/organization/catalog?tenantId=${fixture.tenantId}`)
  await expect(
    page.getByRole("heading", { name: "Gérer le catalogue", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", { name: `Archiver ${productName}`, exact: true })
    .click()
  await page.getByRole("button", { name: "Annuler", exact: true }).click()
  await expect(
    page.getByRole("form", {
      name: `Modifier le produit ${productName}`,
      exact: true,
    })
  ).toBeVisible()
  await page
    .getByRole("button", { name: `Archiver ${productName}`, exact: true })
    .click()
  await page
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(
    page.getByRole("form", {
      name: `Modifier le produit ${productName}`,
      exact: true,
    })
  ).toHaveCount(0)
  await page
    .getByRole("button", { name: `Archiver ${categoryName}`, exact: true })
    .click()
  await page
    .getByRole("button", { name: "Confirmer l’archivage", exact: true })
    .click()
  await expect(
    page.getByRole("form", {
      name: `Modifier la catégorie ${categoryName}`,
      exact: true,
    })
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: productName, exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("form", {
      name: `Modifier le produit ${productName}`,
      exact: true,
    })
  ).toHaveCount(0)
})

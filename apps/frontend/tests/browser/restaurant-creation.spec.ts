import { expect, test } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"

test("owner creates a restaurant and receives a localized duplicate-subdomain error", async ({
  page,
  context,
}) => {
  const email = process.env.WHITEPLATE_DEV_EMAIL
  const password = process.env.WHITEPLATE_DEV_PASSWORD

  if (!email?.endsWith(".invalid") || !password)
    throw new Error("Configure the verified local .invalid acceptance account")

  const login = await context.request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { Origin: "http://localhost:3000" },
  })

  expect(login.status()).toBe(200)

  const stamp = Date.now().toString(36)
  const name = `Acceptance Bistro ${stamp}`
  const slug = `acceptance-${stamp}`

  await page.goto("/en/organization/sign-up")
  await page
    .getByLabel("Organization name", { exact: true })
    .fill(`Acceptance ${stamp}`)
  await page
    .getByRole("button", { name: "Create organization", exact: true })
    .click()
  await expect(page).toHaveURL(/\/en\/organization$/)
  await page
    .getByRole("listitem")
    .filter({ hasText: `Acceptance ${stamp}` })
    .getByRole("link", { name: "Create restaurant", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Create a restaurant", exact: true })
  ).toBeVisible()

  const organizationId = new URL(page.url()).searchParams.get("organizationId")

  expect(organizationId).toMatch(/^[a-f0-9-]{36}$/)
  await page.getByLabel("Restaurant name", { exact: true }).fill(name)
  await page
    .getByLabel("Restaurant subdomain", { exact: true })
    .fill(slug.toUpperCase())
  await page.getByLabel("Currency", { exact: true }).selectOption("GBP")
  await page
    .getByRole("button", { name: "Create restaurant", exact: true })
    .click()
  await expect(page).toHaveURL(/\/en\/organization\/team\?/)

  const restaurantRow = page.getByRole("listitem").filter({ hasText: name })

  await expect(restaurantRow.getByText(name, { exact: true })).toBeVisible()

  const settings = restaurantRow.getByRole("link", {
    name: "Edit languages",
    exact: true,
  })
  const tenantId = new URL(
    (await settings.getAttribute("href")) ?? "",
    page.url()
  ).searchParams.get("tenantId")

  expect(tenantId).toMatch(/^[a-f0-9-]{36}$/)
  await page.goto(
    `/fr/organization/restaurants/new?organizationId=${organizationId}`
  )
  await page.getByLabel("Nom du restaurant", { exact: true }).fill("Doublon")
  await page
    .getByLabel("Sous-domaine du restaurant", { exact: true })
    .fill(slug)
  await page
    .getByRole("button", { name: "Créer le restaurant", exact: true })
    .click()
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Ce sous-domaine est déjà utilisé"
  )
  await expect(
    page.getByRole("button", { name: "Créer le restaurant", exact: true })
  ).toBeEnabled()
  await mkdir(".acceptance", { recursive: true })
  await writeFile(
    ".acceptance/restaurant.json",
    JSON.stringify({ organizationId, tenantId, name, slug, currency: "GBP" })
  )
})

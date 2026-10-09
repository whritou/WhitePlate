import { expect, test } from "@playwright/test"

test("switching workspace tabs and products preserves an unsaved product draft", async ({
  page,
}) => {
  await page.goto(
    "/en/catalog-design-test?view=builder&tenantId=11111111-1111-4111-8111-111111111111&context=keep"
  )
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("tab", { name: "Menu", exact: true }).click()

  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await page.getByRole("button", { name: "Edit product", exact: true }).click()

  const product = page.getByRole("form", {
    name: "Edit product Soupe du potager",
    exact: true,
  })

  await product
    .getByLabel("Name", { exact: true })
    .fill("Unsaved seasonal soup")
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByRole("button", {
      name: "Select Salade de tomates anciennes et burrata",
      exact: true,
    })
    .click()
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await expect(product.getByLabel("Name", { exact: true })).toHaveValue(
    "Unsaved seasonal soup"
  )
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByRole("button", { name: "Translations & languages", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Manage languages", exact: true })
  ).toBeVisible()
  await expect(page).toHaveURL(/context=keep/)
  await expect(page).toHaveURL(/view=translations/)

  const translations = page.getByRole("dialog", {
    name: "Translations & languages",
    exact: true,
  })

  await translations
    .getByLabel("Edit language", { exact: true })
    .selectOption("en")
  await expect(
    translations.getByText("Garden soup", { exact: true })
  ).toBeVisible()
  await translations.getByRole("button", { name: "Close", exact: true }).click()
  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await expect(product.getByLabel("Name", { exact: true })).toHaveValue(
    "Unsaved seasonal soup"
  )
  await page
    .getByRole("button", { name: "Discard product changes", exact: true })
    .click()
  await expect(product.getByLabel("Name", { exact: true })).toHaveValue(
    "Soupe du potager"
  )
})

test("shared workspace keeps discounts and archived products reachable", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Discounts", exact: true }).click()
  await expect(page.getByText("BIENVENUE", { exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByLabel("Show", { exact: true }).selectOption("archived")
  await page
    .getByRole("button", { name: "Select Velouté d’hiver", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Restore product", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("form", { name: /Edit product/ })).toBeHidden()
})

test("restaurant description drafts survive menu-language switches", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=translations")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Unsaved French description")
  await page
    .getByLabel("Description language", { exact: true })
    .selectOption("en")
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Unsaved English description")
  await page
    .getByLabel("Description language", { exact: true })
    .selectOption("fr")
  await expect(
    page.getByRole("textbox", { name: "Description", exact: true })
  ).toHaveValue("Unsaved French description")
  await page
    .getByRole("dialog", { name: "Translations & languages", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Translations & languages", exact: true })
    .click()
  await expect(
    page.getByRole("textbox", { name: "Description", exact: true })
  ).toHaveValue("Unsaved French description")
})

test("product save locks selection, rejects duplicate submissions and retains a failed draft", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  await page
    .getByRole("button", { name: "Select Soupe du potager", exact: true })
    .click()
  await page.getByRole("button", { name: "Edit product", exact: true }).click()

  const form = page.getByRole("form", {
    name: "Edit product Soupe du potager",
    exact: true,
  })
  let release = () => {}

  let started = () => {}

  let writes = 0
  const startedPromise = new Promise<void>((resolve) => {
    started = resolve
  })
  const releasedPromise = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()

    writes++
    started()
    await releasedPromise
    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":false,"error":"unavailable"},"f":"","b":""}\n',
    })
  })
  await form.getByLabel("Name", { exact: true }).fill("Retained after failure")
  await form.getByRole("button", { name: "Save changes", exact: true }).click()
  await startedPromise
  await expect(
    page.locator("button").filter({ hasText: "Translations & languages" })
  ).toBeDisabled()
  await expect(
    page.locator('[aria-label="Select Salade de tomates anciennes et burrata"]')
  ).toBeDisabled()
  await form.evaluate((element: HTMLFormElement) => element.requestSubmit())
  release()
  await expect(form.getByRole("alert")).toBeVisible()
  await expect(form.getByLabel("Name", { exact: true })).toHaveValue(
    "Retained after failure"
  )
  expect(writes).toBe(1)
  await expect(
    page.locator("button").filter({ hasText: "Translations & languages" })
  ).toBeEnabled()
  await page.unroute("**/catalog-design-test*")
  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()

    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":true},"f":"","b":""}\n',
    })
  })
  await form.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Discard product changes", exact: true })
  ).toBeDisabled()
})

test("category visibility errors preserve the saved state and recover controls", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.route("**/catalog-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()

    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":false,"error":"unavailable"},"f":"","b":""}\n',
    })
  })

  await page.getByRole("tab", { name: "Categories", exact: true }).click()

  const hide = page.getByRole("button", {
    name: "Hide category Les entrées",
    exact: true,
  })

  await hide.click()
  await expect(
    page
      .getByRole("tabpanel", { name: "Categories", exact: true })
      .getByRole("alert")
  ).toBeVisible()
  await expect(hide).toBeEnabled()
  await expect(page.getByText("Visible online", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Translations & languages", exact: true })
  ).toBeEnabled()
})

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale}/${theme}: menu workspace reflows with accessible controls`, async ({
      page,
    }) => {
      const errors: string[] = []

      page.on("pageerror", (error) => errors.push(error.message))
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(
        `/${locale}/catalog-design-test?view=builder&shell=1&tenantId=11111111-1111-4111-8111-111111111111`
      )
      await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
        "data-ready",
        "true"
      )
      await page
        .getByRole("button", {
          name:
            locale === "fr"
              ? "Sélectionner Soupe du potager"
              : "Select Soupe du potager",
          exact: true,
        })
        .click()
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Modifier le produit" : "Edit product",
          exact: true,
        })
        .click()
      for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
        await expect(
          page
            .getByRole("form", { name: /Soupe du potager/ })
            .getByRole("button", {
              name:
                locale === "fr"
                  ? "Enregistrer les modifications"
                  : "Save changes",
              exact: true,
            })
        ).toBeVisible()
        if (width >= 768) {
          const target = await page
            .getByRole("form", { name: /Soupe du potager/ })
            .getByRole("button", {
              name:
                locale === "fr"
                  ? "Enregistrer les modifications"
                  : "Save changes",
              exact: true,
            })
            .boundingBox()

          expect(target?.height).toBeGreaterThanOrEqual(48)
        }
      }

      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%"
      })
      await page.setViewportSize({ width: 390, height: 900 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)

      await page
        .getByRole("button", {
          name: locale === "fr" ? "Fermer" : "Close",
          exact: true,
        })
        .click()

      const tab = page.getByRole("tab", {
        name: "Menu",
        exact: true,
      })

      await tab.focus()
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("Enter")
      await expect(
        page.getByRole("table", {
          name: locale === "fr" ? "Catégories" : "Categories",
          exact: true,
        })
      ).toBeVisible()
      await page
        .getByRole("button", {
          name:
            locale === "fr"
              ? "Traductions & Langues"
              : "Translations & languages",
          exact: true,
        })
        .click()
      await expect(
        page.getByRole("button", {
          name: locale === "fr" ? "Gérer les langues" : "Manage languages",
          exact: true,
        })
      ).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
  }
}

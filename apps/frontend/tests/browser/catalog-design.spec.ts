import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const soup = "Soupe du potager"

async function noPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
}

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale}/${theme}: browse, filter and edit catalog in isolated modals`, async ({
      page,
    }) => {
      const fr = locale === "fr"
      const errors: string[] = []

      page.on("pageerror", (error) => errors.push(error.message))
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.goto(`/${locale}/catalog-design-test`)
      await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
        "data-ready",
        "true"
      )
      await expect(
        page.getByRole("tab", {
          name: fr ? "Produits" : "Products",
          exact: true,
        })
      ).toBeVisible()
      await expect(page.getByRole("textbox")).toHaveCount(1)
      await page
        .getByRole("button", {
          name: fr ? `Modifier le produit ${soup}` : `Edit product ${soup}`,
          exact: true,
        })
        .click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await page
        .getByRole("dialog")
        .getByRole("button", {
          name: fr ? "Annuler" : "Cancel",
          exact: true,
        })
        .click()
      await expect(
        page.getByRole("heading", { name: soup, exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "Velouté d’hiver", exact: true })
      ).toHaveCount(0)
      await page
        .getByLabel(fr ? "Afficher" : "Show", { exact: true })
        .selectOption("archived")
      await expect(
        page.getByRole("heading", { name: "Velouté d’hiver", exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole("button", {
          name: fr
            ? "Modifier le produit Produit de la catégorie archivée"
            : "Edit product Produit de la catégorie archivée",
          exact: true,
        })
      ).toHaveCount(0)
      await page
        .getByLabel(fr ? "Afficher" : "Show", { exact: true })
        .selectOption("active")
      await page
        .getByLabel(fr ? "Rechercher un produit" : "Search products")
        .fill("tomates")
      await expect(
        page.getByRole("heading", { name: soup, exact: true })
      ).toHaveCount(0)
      await page
        .getByLabel(fr ? "Rechercher un produit" : "Search products")
        .fill("")

      const edit = page.getByRole("button", {
        name: fr ? `Modifier le produit ${soup}` : `Edit product ${soup}`,
        exact: true,
      })

      await edit.focus()
      await page.keyboard.press("Enter")

      const dialog = page.getByRole("dialog")

      await expect(dialog).toBeVisible()

      const name = dialog.getByLabel(fr ? "Nom" : "Name", { exact: true })

      await name.fill("Draft")
      await dialog
        .getByRole("button", { name: fr ? "Annuler" : "Cancel", exact: true })
        .click()
      await expect(dialog).toHaveCount(0)
      await expect(edit).toBeFocused()
      await edit.click()
      await expect(name).toHaveValue(soup)
      await page.keyboard.press("Escape")
      await expect(dialog).toHaveCount(0)
      await expect(edit).toBeFocused()

      await page
        .getByRole("button", {
          name: fr ? `Options de ${soup}` : `Options for ${soup}`,
          exact: true,
        })
        .click()

      const options = page.getByRole("dialog", {
        name: fr ? `Options de ${soup}` : `Options for ${soup}`,
        exact: true,
      })

      await expect(
        options.getByText("Pain au levain", { exact: true })
      ).toBeVisible()
      await page
        .getByRole("button", {
          name: fr
            ? "Modifier l’option Pain au levain"
            : "Edit option Pain au levain",
          exact: true,
        })
        .click()

      const child = page.getByRole("dialog", {
        name: fr
          ? "Modifier l’option Pain au levain"
          : "Edit option Pain au levain",
        exact: true,
      })

      await expect(child).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(child).toHaveCount(0)
      await expect(options).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(page.getByRole("dialog")).toHaveCount(0)

      const categoriesTab = page.getByRole("tab", {
        name: fr ? "Catégories" : "Categories",
        exact: true,
      })

      await categoriesTab.focus()
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("Enter")
      await expect(
        page.getByRole("tab", {
          name: fr ? "Remises" : "Discounts",
          exact: true,
        })
      ).toHaveAttribute("aria-selected", "true")
      await expect(
        page.getByRole("button", {
          name: fr ? "Modifier la réduction ANCIEN" : "Edit discount ANCIEN",
          exact: true,
        })
      ).toHaveCount(0)

      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await noPageOverflow(page)
        await page
          .getByRole("button", {
            name: fr ? "Nouveau code de réduction" : "New discount code",
            exact: true,
          })
          .click()
        await noPageOverflow(page)
        await page.keyboard.press("Escape")
      }

      expect(errors).toEqual([])
      if (process.env.WHITEPLATE_DESIGN_SCREENSHOTS) {
        await page
          .getByRole("tab", { name: fr ? "Produits" : "Products", exact: true })
          .click()
        await page.screenshot({
          path: join(
            process.env.WHITEPLATE_DESIGN_SCREENSHOTS,
            `catalog-${locale}-${theme}.png`
          ),
          fullPage: true,
        })
      }
    })

    test(`${locale}/${theme}: language settings and translation status stay separate from editing`, async ({
      page,
    }) => {
      const fr = locale === "fr"

      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.goto(`/${locale}/catalog-design-test?view=languages`)
      await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
        "data-ready",
        "true"
      )
      await expect(page.getByRole("textbox")).toHaveCount(1)
      await page
        .getByRole("button", {
          name: fr ? "Gérer les langues" : "Manage languages",
          exact: true,
        })
        .click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await page
        .getByRole("dialog")
        .getByRole("button", { name: fr ? "Annuler" : "Cancel", exact: true })
        .click()
      await page
        .getByLabel(fr ? "Langue à modifier" : "Edit language", {
          exact: true,
        })
        .selectOption("en")
      await expect(page.getByText("Garden soup", { exact: true })).toBeVisible()
      await page
        .getByLabel(fr ? "État de traduction" : "Translation status")
        .selectOption("missing")
      await expect(page.getByText("Garden soup", { exact: true })).toHaveCount(
        0
      )
      await expect(
        page
          .locator('[data-slot="badge"]')
          .filter({ hasText: fr ? "À traduire" : "To translate" })
          .first()
      ).toBeVisible()
      await page
        .getByLabel(fr ? "État de traduction" : "Translation status")
        .selectOption("all")
      await page
        .getByRole("button", {
          name: fr ? `Traduire ${soup} (en)` : `Translate ${soup} (en)`,
          exact: true,
        })
        .click()

      const dialog = page.getByRole("dialog")

      await expect(dialog.getByLabel(fr ? "Nom" : "Name")).toHaveValue(
        "Garden soup"
      )
      await dialog.getByLabel(fr ? "Nom" : "Name").fill("Draft translation")
      await dialog
        .getByRole("button", { name: fr ? "Annuler" : "Cancel", exact: true })
        .click()
      await expect(page.getByText("Garden soup", { exact: true })).toBeVisible()
      await page
        .getByRole("button", {
          name: fr ? "Gérer les langues" : "Manage languages",
          exact: true,
        })
        .click()
      await dialog
        .getByLabel(fr ? "Ajouter un code de langue" : "Add a language tag", {
          exact: true,
        })
        .fill("de")
      await dialog
        .getByRole("button", {
          name: fr ? "Ajouter la langue" : "Add language",
          exact: true,
        })
        .click()
      await dialog
        .getByRole("button", { name: fr ? "Annuler" : "Cancel", exact: true })
        .click()
      await expect(
        page.getByRole("button", {
          name: fr ? "Gérer les langues" : "Manage languages",
          exact: true,
        })
      ).toBeFocused()
      await expect(
        page
          .getByLabel(fr ? "Langue à modifier" : "Edit language")
          .locator("option")
      ).toHaveCount(2)

      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await noPageOverflow(page)
        await page
          .getByRole("button", {
            name: fr ? "Gérer les langues" : "Manage languages",
            exact: true,
          })
          .click()
        await noPageOverflow(page)
        await page.keyboard.press("Escape")
      }

      if (process.env.WHITEPLATE_DESIGN_SCREENSHOTS) {
        await mkdir(process.env.WHITEPLATE_DESIGN_SCREENSHOTS, {
          recursive: true,
        })
        await page.screenshot({
          path: join(
            process.env.WHITEPLATE_DESIGN_SCREENSHOTS,
            `translations-${locale}-${theme}.png`
          ),
          fullPage: true,
        })
      }
    })
  }
}

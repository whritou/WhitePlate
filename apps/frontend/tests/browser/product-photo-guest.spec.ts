import { expect, test } from "@playwright/test"

for (const locale of ["en", "fr"])
  for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
    test(`saved guest gallery ${locale} ${width}px keeps ordering controls accessible`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 })
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.route("**/api/public/product-photos/**", (route) =>
        route.fulfill({
          path: "public/design/photo-15.webp",
          contentType: "image/webp",
        })
      )
      await page.goto(`/${locale}/photo-guest-design-test`)
      await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
        "data-ready",
        "true"
      )
      await page.addStyleTag({ content: "html { font-size: 200% }" })
      await page
        .getByRole("button", {
          name: locale === "en" ? "Add Burger" : "Ajouter Burger",
          exact: true,
        })
        .click()

      const dialog = page.getByRole("dialog")

      await expect(dialog).toBeVisible()

      const photo = dialog.getByRole("button", {
        name: locale === "en" ? "Show photo 2" : "Afficher la photo 2",
        exact: true,
      })

      await photo.click()
      await expect(photo).toHaveAttribute("aria-pressed", "true")

      const quantity = dialog.getByRole("spinbutton")

      await quantity.scrollIntoViewIfNeeded()
      await expect(quantity).toBeInViewport()

      const cancel = dialog.getByRole("button", {
        name: locale === "en" ? "Cancel" : "Annuler",
        exact: true,
      })

      await expect(cancel).toBeInViewport()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      await cancel.click()
      await expect(
        page.getByRole("button", {
          name: locale === "en" ? "Add Burger" : "Ajouter Burger",
          exact: true,
        })
      ).toBeFocused()
    })
  }

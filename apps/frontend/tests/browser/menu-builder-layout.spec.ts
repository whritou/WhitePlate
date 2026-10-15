import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`product actions stay visible inside the card at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/en/catalog-design-test?view=builder&shell=1")
    await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
      "data-ready",
      "true"
    )

    const row = page
      .locator(".live-dish-row")
      .filter({ hasText: "Soupe du potager" })
    const archive = row.getByRole("button", {
      name: "Archive Soupe du potager",
      exact: true,
    })
    const rowBox = await row.boundingBox()
    const archiveBox = await archive.boundingBox()
    const visibility = row.getByRole("button", {
      name: "Hide product Soupe du potager",
      exact: true,
    })
    const visibilityBox = await visibility.boundingBox()

    expect(visibilityBox?.y).toBeGreaterThan(archiveBox?.y ?? 0)
    expect(visibilityBox!.y + visibilityBox!.height).toBeLessThanOrEqual(
      rowBox!.y + rowBox!.height - 8
    )
    expect(visibilityBox!.x + visibilityBox!.width).toBeLessThanOrEqual(
      rowBox!.x + rowBox!.width - 8
    )
    await page.mouse.move(0, 0)
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur()
    })
    await expect(archive).toHaveCSS("opacity", "1")
    await expect(visibility).toHaveCSS("opacity", "1")
    await expect(visibility).toHaveCSS("pointer-events", "auto")
    await archive.click()
    await expect(page.getByRole("alertdialog")).toBeVisible()
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
  })
}

test("category filters leave category actions in the sidebar", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder&shell=1")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "Les entrées 2", exact: true }).click()

  const toolbar = page.locator(".live-menu-toolbar")

  await expect(
    toolbar.getByRole("button", {
      name: "Hide category Les entrées",
      exact: true,
    })
  ).toHaveCount(0)
  await expect(
    toolbar.getByRole("button", { name: "Archive Les entrées", exact: true })
  ).toHaveCount(0)
  await expect(
    page
      .locator(".live-menu-category-row")
      .filter({ hasText: "Les entrées" })
      .getByRole("button", { name: "Hide category Les entrées", exact: true })
  ).toBeVisible()
})

test("saving an archive does not paint unrelated row controls gray", async ({
  page,
}) => {
  let releaseAction: () => void = () => {}

  const release = new Promise<void>((resolve) => {
    releaseAction = resolve
  })

  await page.route("**/catalog-design-test*", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      await release
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: '0:{"a":{"ok":true},"f":"","b":""}\n',
      })
    } else await route.continue()
  })
  await page.goto("/en/catalog-design-test?view=builder&shell=1")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const controls = page.locator(
    '.live-dish-row [data-product-selector], .live-dish-row button[aria-label^="Move"], .live-menu-category-row button[aria-label^="Move"], .live-menu-category-row button[aria-pressed]'
  )
  const backgrounds = await controls.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor)
  )
  const row = page
    .locator(".live-dish-row")
    .filter({ hasText: "Soupe du potager" })

  await row.hover()
  await row
    .getByRole("button", { name: "Archive Soupe du potager", exact: true })
    .click()
  try {
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Confirm archive", exact: true })
      .click()
    await expect(row.locator("[data-product-selector]")).toBeDisabled()
    await expect
      .poll(() =>
        controls.evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).backgroundColor)
        )
      )
      .toEqual(backgrounds)
  } finally {
    releaseAction()
  }
})

for (const locale of ["en", "fr"]) {
  test(`discount fields remain readable beside their actions in ${locale}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/${locale}/catalog-design-test?view=builder&shell=1`)
    await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
      "data-ready",
      "true"
    )
    await page
      .getByRole("tab", {
        name: locale === "fr" ? "Codes de réduction" : "Discount codes",
        exact: true,
      })
      .click()

    const row = page.getByTestId("discount-row").first()

    for (const [selector, minimum] of [
      ["input[readonly]", 120],
      ["select", 140],
      ["input[name=value]", 80],
      ["input[name=minimumOrderAmount]", 100],
      ["input[type=date]", 160],
    ] as const) {
      const field = row.locator(selector)
      const box = await field.boundingBox()

      expect(box!.width).toBeGreaterThanOrEqual(minimum)
    }

    const fieldPositions = await row
      .locator(
        "input[readonly], select, input[name=value], input[name=minimumOrderAmount], input[type=date]"
      )
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().x)
      )

    for (let index = 1; index < fieldPositions.length; index++) {
      expect(fieldPositions[index]).toBeGreaterThan(fieldPositions[index - 1])
    }

    const dateBox = await row.locator("input[type=date]").boundingBox()
    const saveBox = await row
      .getByRole("button", {
        name:
          locale === "fr"
            ? "Enregistrer le code BIENVENUE"
            : "Save discount BIENVENUE",
        exact: true,
      })
      .boundingBox()

    expect(saveBox!.y).toBeGreaterThanOrEqual(dateBox!.y + dateBox!.height)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(1440)
  })
}

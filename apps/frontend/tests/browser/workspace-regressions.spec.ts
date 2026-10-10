import { expect, test } from "@playwright/test"

test("demo interface language changes preserve the current settings section", async ({
  page,
}) => {
  await page.goto("/en/demo/settings?section=payments")
  await page
    .getByRole("navigation", { name: "Language / Langue" })
    .getByRole("link", { name: "fr", exact: true })
    .click()
  await expect(page).toHaveURL(/\/fr\/demo\/settings\?section=payments/)
  await expect(
    page
      .getByRole("navigation", { name: "Language / Langue" })
      .getByRole("link", { name: "fr", exact: true })
  ).toHaveAttribute("aria-current", "true")
})

test("live shop long copy fits cards and add buttons at mobile widths", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/en/live-workspace-test?view=store&long=1")

    const card = page.locator('.customer-page [data-slot="card"]').first()

    await expect(card).toBeVisible()

    const geometry = await card.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const action = element.querySelector("button")!.getBoundingClientRect()

      return {
        width: rect.width,
        overflow: element.scrollWidth - element.clientWidth,
        action: action.right - rect.right,
      }
    })

    expect(geometry.width).toBeGreaterThan(250)
    expect(geometry.overflow).toBeLessThanOrEqual(1)
    expect(geometry.action).toBeLessThanOrEqual(1)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth
      )
    ).toBeLessThanOrEqual(1)
  }
})

test("organization overview and restaurant settings keep scoped entry links", async ({
  page,
}) => {
  const organizationId = "11111111-1111-4111-8111-111111111111"
  const tenantId = "22222222-2222-4222-8222-222222222222"

  await page.goto(
    `/en/live-workspace-test?view=overview&organizationId=${organizationId}`
  )

  const main = page.getByRole("main")

  await expect(
    main.getByRole("link", { name: "Open restaurant", exact: true })
  ).toHaveAttribute("href", `/en/organization/dashboard?tenantId=${tenantId}`)
  await expect(
    main.getByRole("link", { name: "Organization settings", exact: true })
  ).toHaveAttribute(
    "href",
    `/en/organization/settings?organizationId=${organizationId}`
  )
  await page.goto(
    `/en/live-workspace-test?view=restaurant-settings&tenantId=${tenantId}`
  )
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Visit shop", exact: true })
  ).toHaveAttribute("href", `/en/organization/shop?tenantId=${tenantId}`)
})

test("category creation stays in one dialog and preserves the product draft", async ({
  page,
}) => {
  await page.goto("/en/catalog-design-test?view=builder&empty=1&shell=1")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByRole("button", { name: "New product", exact: true }).click()
  await page
    .getByRole("form", { name: "New product", exact: true })
    .getByLabel("Name", { exact: true })
    .fill("Draft soup")

  const dialogs = await page
    .getByRole("dialog", { includeHidden: true })
    .count()

  await page
    .getByRole("button", { name: "Create category", exact: true })
    .click()
  await expect(page.getByRole("dialog", { includeHidden: true })).toHaveCount(
    dialogs
  )
  await page
    .getByRole("form", { name: "New category", exact: true })
    .getByRole("button", { name: "Cancel", exact: true })
    .click()
  await expect(
    page
      .getByRole("form", { name: "New product", exact: true })
      .getByLabel("Name", { exact: true })
  ).toHaveValue("Draft soup")
})

test("narrow Studio previews keep readable cards and contained add controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/en/demo/studio")
  await page.getByRole("button", { name: "mobile", exact: true }).click()

  const products = page.locator(".storefront-page article")

  await expect(products.first()).toBeVisible()

  const geometry = await products.first().evaluate((card) => {
    const details = card.querySelector(".customer-product-details")!
    const text = details.querySelector("button")!.getBoundingClientRect()
    const action = details
      .querySelector("button:last-child")!
      .getBoundingClientRect()
    const bounds = card.getBoundingClientRect()

    return {
      textWidth: text.width,
      cardWidth: bounds.width,
      actionRight: action.right,
      cardRight: bounds.right,
    }
  })

  expect(geometry.cardWidth).toBeGreaterThan(250)
  expect(geometry.textWidth).toBeGreaterThan(180)
  expect(geometry.actionRight).toBeLessThanOrEqual(geometry.cardRight)
})

test("demo selects preserve language values and translate menu content", async ({
  page,
}) => {
  await page.goto("/en/demo")

  const select = page.locator(".storefront-page select")

  await expect(select).toBeEnabled()
  await select.selectOption("fr")
  await expect(
    page.getByText("Burrata & tomates anciennes", { exact: true })
  ).toBeVisible()
  await select.selectOption("en")
  await expect(
    page.getByText("Burrata & heirloom tomato", { exact: true })
  ).toBeVisible()
})

test("selected settings buttons retain readable text while held", async ({
  page,
}) => {
  await page.goto("/en/demo/settings")

  const selected = page.locator('aside button[aria-current="page"]').first()
  // The source marks selection through its colors; click the first section if needed.
  const button = (await selected.count())
    ? selected
    : page.locator("aside button").first()

  await button.hover()
  await page.mouse.down()

  const colors = await button.evaluate((element) => {
    const style = getComputedStyle(element)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const luminance = (color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)

      const rgb = [...ctx.getImageData(0, 0, 1, 1).data]
        .slice(0, 3)
        .map((v) => {
          const s = v / 255

          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })

      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    }

    const bg = luminance(style.backgroundColor)
    const fg = luminance(style.color)

    return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05)
  })

  await page.mouse.up()
  expect(colors).toBeGreaterThanOrEqual(4.5)
})

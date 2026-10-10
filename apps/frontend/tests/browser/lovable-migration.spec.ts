import { expect, test } from "@playwright/test"

test("menu language remains independent from the interface locale", async ({
  page,
}) => {
  await page.goto("/fr/demo")
  await expect(
    page.getByText("Burrata & tomates anciennes", { exact: true })
  ).toBeVisible()
  await page.locator(".storefront-page select").selectOption("en")
  await expect(
    page.getByText("Burrata & heirloom tomato", { exact: true })
  ).toBeVisible()
  await page.locator(".storefront-page select").selectOption("fr")
  await expect(
    page.getByText("Burrata & tomates anciennes", { exact: true })
  ).toBeVisible()
})

for (const locale of ["en", "fr"]) {
  test(`${locale} migrated pages reflow at mobile, tablet and desktop widths`, async ({
    page,
  }) => {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of [
        "",
        "checkout",
        "tracking",
        "dashboard",
        "orders",
        "history",
        "analytics",
        "menu",
        "studio",
        "staff",
        "settings",
      ]) {
        await page.goto(`/${locale}/demo${route ? `/${route}` : ""}`)
        await expect(page.locator("h1").first()).toBeVisible()
        await page.evaluate(() => document.fonts.ready)

        const dimensions = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }))

        expect(
          dimensions.scroll,
          `${locale}/${route} at ${width}px`
        ).toBeLessThanOrEqual(dimensions.client)
      }
    }
  })
}

test("basket dialog closes on Escape and restores focus", async ({ page }) => {
  await page.goto("/en/demo")

  const trigger = page.getByRole("button", { name: /Basket ·/ })

  await trigger.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test("Lovable landing keeps its original assets and working pricing and FAQ", async ({
  page,
}) => {
  await page.goto("/en")
  await expect(
    page.getByRole("heading", { name: "WhitePlate", exact: true })
  ).toBeVisible()
  await expect(page.locator('img[src="/lovable/hero.jpg"]')).toBeVisible()
  await page.getByRole("button", { name: "Monthly", exact: true }).click()
  await expect(page.locator("#pricing")).toContainText("€29")
  await page
    .getByRole("button", {
      name: "Does creating an account start a subscription?",
    })
    .click()
  await expect(
    page.getByText(
      "No. Creating an account is free and does not charge you or activate a paid plan."
    )
  ).toBeVisible()
})

test("landing contains its content at mobile, tablet and desktop widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/en")
    await expect(
      page.getByRole("heading", { name: "WhitePlate", exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
  }
})

test("all migrated demo routes render and keep navigation inside the demo", async ({
  page,
}) => {
  const errors: string[] = []

  page.on("pageerror", (error) => errors.push(error.message))
  for (const route of [
    "",
    "checkout",
    "tracking",
    "dashboard",
    "orders",
    "history",
    "analytics",
    "menu",
    "studio",
    "staff",
    "settings",
  ]) {
    await page.goto(`/en/demo${route ? `/${route}` : ""}`)
    await expect(page.locator("h1").first()).toBeVisible()
    await expect(page.locator(".lovable-surface")).toBeVisible()
    expect(await page.locator('a[href^="/en/organization"]').count()).toBe(0)
  }

  expect(errors).toEqual([])
})

test("demo basket, checkout and tracking preserve the customer journey without API writes", async ({
  page,
}) => {
  const writes: string[] = []

  page.on("request", (request) => {
    if (
      request.url().includes("/api/") &&
      !["GET", "HEAD"].includes(request.method())
    )
      writes.push(request.url())
  })
  await page.goto("/en/demo")
  await page.getByRole("button", { name: "Add Tiramisu", exact: true }).click()
  await page.getByRole("button", { name: /Basket · 1/ }).click()
  await page.getByRole("button", { name: /Checkout ·/ }).click()
  await expect(page).toHaveURL(/\/demo\/checkout/)
  await page.getByLabel("Full name", { exact: true }).fill("Demo Guest")
  await page.getByLabel("Email", { exact: true }).fill("demo@example.com")
  await page.getByLabel("Phone number", { exact: true }).fill("0102030405")
  await page.getByRole("button", { name: /Place demo order/ }).click()
  await expect(page).toHaveURL(/\/demo\/tracking\?orderId=/)
  await expect(
    page.getByText(
      "Your demo order is saved. No payment was taken and the restaurant has not received it."
    )
  ).toBeVisible()
  expect(writes).toEqual([])
})

test("French landing and interactive customer previews use the French catalog", async ({
  page,
}) => {
  await page.goto("/fr")
  await expect(page.getByText(/Votre menu\. Votre boutique\./)).toBeVisible()
  await page
    .getByRole("button", { name: "Validation de commande", exact: true })
    .click()
  await expect(page.getByText("Votre commande", { exact: true })).toBeVisible()
  await page
    .getByRole("button", { name: "Suivi de commande", exact: true })
    .click()
  await expect(
    page.getByText("Votre repas se prépare.", { exact: true })
  ).toBeVisible()
})

test("Studio preserves original font pairs and saves only to its demo storage", async ({
  page,
}) => {
  await page.goto("/en/demo/studio")
  await page.getByRole("button", { name: /Editorial/ }).click()
  await expect(page.locator(".customer-page h1").first()).toHaveCSS(
    "font-family",
    /Fraunces/
  )
  await page.getByRole("button", { name: "Save demo", exact: true }).click()

  const draft = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("whiteplate-lovable-demo-store-theme") ?? "null"
    )
  )

  expect(draft.headingFont).toBe("Fraunces")
  expect(draft.font).toBe("Work Sans")
  await page.goto("/en/demo")
  await expect(page.locator("h1").first()).toHaveCSS("font-family", /Fraunces/)
})

test("domain dialog shows examples and cannot claim DNS verification", async ({
  page,
}) => {
  await page.goto("/en/demo/studio")
  await page.getByRole("tab", { name: "Brand & details" }).click()
  await page
    .getByRole("button", { name: "Connect domain", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(
    page.getByText(
      "Example records only. DNS verification and SSL require a backend connection."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Verify connection", exact: true })
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
})
